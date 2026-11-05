# CJK PDFs are visually broken — confirmed, not yet fixed

Found 5 November 2026 while verifying the OCR language packs. Recorded here
with evidence because it affects output users already receive.

## What is wrong

`src/lib/pdf/text/unicode-text.ts` embeds every font pack with
`subset: true`. For the five TrueType packs that is correct. The CJK pack,
`NotoSansSC-Regular.otf`, is the **only CFF-outline font we ship**, and
subsetting it produces an embedded font program viewers cannot use.

| Embedding | MuPDF | CoreGraphics (macOS) |
|---|---|---|
| OTF, `subset: true` — what ships | nothing drawn | draws `! " #` |
| OTF, `subset: false` | wrong glyphs | correct |

`! " #` is the diagnosis. The viewer cannot use the embedded program, falls
back to a default font, and maps the raw glyph indices 1, 2, 3 onto those ASCII
codepoints. The user sees punctuation where Chinese should be.

Reproduce with `node scripts/reproduce-cjk-subset-defect.mjs <outDir>`.

## Why nothing caught it

**Text extraction still works.** The ToUnicode CMap is written correctly, so
`get_text()` returns 中文识别测试 from a PDF that displays as `! " #`. Every
automated check we had asserted on extracted text, so all of them passed.

`unicode-language-packs.test.ts` even asserts the output stays small by
subsetting — locking in the broken behaviour as a requirement.

A check that asserts on extracted text cannot see this class of bug. It needs
a rendered picture.

## What has been ruled out

- **Not a MuPDF quirk.** Two unrelated renderers fail differently on the same
  file, and CoreGraphics' fallback is diagnostic rather than a refusal.
- **Not all fonts.** Spanish, French and German samples subset through the same
  code path and render correctly. The five Latin/Indic/Hebrew/Thai packs are
  all `glyf`; only the CJK pack is `CFF `.
- **Not the text, the CMap or the layout.** Extraction is correct throughout.

## The obvious fix is not yet correct

Replacing the CFF font with a TrueType-outline Noto Sans SC should let the
working code path handle it. Instantiating `wght=400` from the Google Fonts
variable TTF and subsetting it gives **correct glyph shapes** — 中 renders
properly in both engines, where the OTF rendered garbage — but **only the
first of six glyphs survives**. The subset is 2,867 bytes, about one glyph's
worth.

So the direction is right and the execution is not. Still open: whether the
variable-font instancing drops the data, or fontkit's subsetting mishandles
this font. Until that is resolved, swapping the font would trade one broken
rendering for another.

## Interim position

Nothing has been changed in the font pipeline. CJK output is as it was, which
is wrong, and this document says so rather than implying otherwise. The fix is
the next piece of work on this area.

If it has to ship before the subsetting is solved, `subset: false` renders
correctly in CoreGraphics at a cost of ~7.3 MB per document — unacceptable as
a default, but a usable fallback for the CJK pack alone if the choice is
between a large file and an unreadable one.
