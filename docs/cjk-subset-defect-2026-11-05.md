# CJK PDFs rendered as `! " #` — root cause and fix

Found 5 November 2026 while verifying the OCR language packs. Fixed the same
day. This records what was actually wrong, because the first diagnosis was
wrong twice before the real cause turned up.

## The symptom

Every CJK PDF carried an embedded font viewers could not use.

| | MuPDF | CoreGraphics |
|---|---|---|
| Before | nothing drawn | `! " #` |
| After | correct | correct |

`! " #` was the clue that mattered. A viewer that cannot use an embedded font
falls back to a default one and maps the raw glyph indices — 1, 2, 3 — onto
those ASCII codepoints. So the PDF was asking for glyph 1, 2, 3 of a font
nothing could read.

## Why nothing caught it

**Text extraction kept working.** The ToUnicode CMap is written separately from
the outlines, so a document that displayed as punctuation still extracted
中文识别测试 perfectly. Every test we had asserted on extracted text, so every
test passed.

`unicode-language-packs.test.ts` went further: it asserted the output stays
small *because* it is subsetted, which locked the broken behaviour in as a
requirement.

A text assertion cannot see this. It needs the glyph outlines.

## Two wrong diagnoses first

Worth recording, because both looked convincing.

1. **"CFF subsetting throws."** Calling `subset.encode()` on the OTF raised
   `TypeError: Cannot read properties of undefined (reading 'pos')`. Real, but
   not what pdf-lib does — it calls `encodeStream()`. Wrong API, wrong
   conclusion.

2. **"The TrueType font only keeps one glyph."** A TrueType build rendered
   only 中, so it looked like subsetting dropped five of six glyphs. It did
   not: the subset contained all six. Five were *corrupt*, which looks
   identical from the outside.

## The actual cause

Two independent faults, both in `@pdf-lib/fontkit`:

**CFF outlines cannot be subset at all.** The bytes `encodeStream()` produces
for a CFF font are not a parseable font — feeding them back to fontkit gives
`Unknown font format`. Noto Sans SC was the only CFF font we shipped.

**Short-format `loca` truncates odd offsets.** fontkit writes `loca` in the
short format, which stores every glyph offset *halved*, so only even offsets
can be represented. Copying a glyph whose data length is odd leaves the next
glyph at an odd offset, which gets truncated, and everything after it is read
from the wrong place.

This is measurable rather than theoretical. In Noto Sans SC:

```
中  len=64   even   always fine
文  len=141  ODD    corruption starts here
识  len=234  even
别  len=241  ODD
测  len=271  ODD
试  len=295  ODD
```

15,684 of 31,036 glyphs had odd-length data — almost exactly half, which is
what you would expect by chance, and which is why roughly half of any CJK
document was destroyed. Latin fonts were unaffected only because they happened
to land on even boundaries.

## The fix

In the shipped font, not the PDF code — the code path is correct, it was being
handed a font it could not subset.

`scripts/prepare-cjk-font.py` builds `public/fonts/NotoSansSC-Regular.ttf`:

1. **TrueType outlines instead of CFF**, so subsetting works at all. Built by
   instantiating `wght=400` from the Google Fonts variable build.
2. **Glyph data padded to even lengths**, so every `loca` offset stays
   representable. Zero odd offsets across all 31,036 glyphs.

The build is byte-reproducible — timestamps are pinned, since fontTools
otherwise stamps the current time and the committed font could never be
checked against the script.

Licence unchanged: SIL Open Font License 1.1, covered by `public/fonts/OFL.txt`.

## Cost

| | old OTF | new TTF |
|---|---|---|
| on disk | 8,331,336 | 10,611,296 |
| gzipped — what users download | 7,202,373 | **6,307,283** |

Larger on disk, **~900 KB smaller over the wire**, because TrueType outlines
compress better than CFF. Subsetted output is unchanged in practice: a
three-line CJK document is 4,571 bytes.

## The guard

`font-subset-integrity.test.ts` subsets every shipped pack exactly as
pdf-lib does and decodes each glyph outline. Confirmed it fails on the old
font — *"26 of 53 glyphs could not be decoded"*, *"15,684 glyph offsets are
odd"* — and passes on the new one.

It also asserts directly that no glyph offset is odd, so if someone regenerates
the font without padding, the failure names the cause instead of leaving
another round of guessing.

One note on writing that test: it first failed on Devanagari, which looked like
a second bug. It was not. `unicode-text.ts` imports `regenerator-runtime`
before fontkit, because fontkit's Indic shapers are transpiled with generators;
the test did not. Aligning the test with the real path fixed it. The product
was right and the test was wrong — which was also true of both earlier
diagnoses.
