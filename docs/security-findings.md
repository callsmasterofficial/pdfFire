# Security and correctness findings

Record of verified defects, the evidence for each, and what remains open.
Status words mean exactly what they say: **fixed** has a regression test,
**confirmed** has been reproduced but not fixed, **unverified** has not been
tested in this project.

Last updated: 2026-10-31.

> **Documentation note (2026-10-31).** Earlier merges of #3 and #7 resolved
> conflicts in this file by taking one side, which dropped the FM-008, FM-009,
> FM-011 and FM-012 sections from `main`. FM-008 is restored here. The others
> return with the branches that own them (#5 and #6); if they are still missing
> after those merge, they were lost the same way and should be recovered from
> the branch history rather than rewritten from memory.

## How these were verified

Security-sensitive output is checked by re-reading the exported bytes with a
parser that did not write them. `src/lib/pdf/__tests__/helpers/pdf-text.ts`
provides:

- `extractPdfText` / `extractPdfTextPerPage` — what PDF.js can recover.
- `extractContentStreamStrings` — every string operand in the decoded content
  streams, decoding both literal `(abc)` and hex `<616263>` forms, because a
  plain substring search over the raw stream silently misses hex-encoded text.
- `extractPdfTextItemsPerPage` — positioned text items, for checking that
  content lands inside the page.

`security-redaction.test.ts` includes a sanity test asserting that both
detectors see the secret *before* redaction. Without it a `not.toContain`
assertion can pass because the detector is broken, which is how the original
redaction test passed while the feature leaked.

---

## FM-001 — Redaction did not remove anything · **fixed**

**Severity:** critical. A document published as redacted leaked its contents.

`applyRedactions` drew a filled rectangle over each area and cleared a few
metadata fields. The covered characters stayed in the page content streams.

Evidence, against the pre-fix implementation:

```
PDF.js extraction of the "redacted" export:
  "SSN 123-45-6789Public summary line"
```

The product asserted the opposite in public copy — `data-security.ts` listed
"True irreversible vector deletion (not visual overlay)" and answered "Can
someone uncover the redacted text?" with "No." `process.md` recorded
"irreversible vector/text stream removal, not visual black box". The
repository's own `project-overview.md:290` already forbade this: "Do not ship
insecure visual-only redaction as real redaction."

**Fixed by** deleting the glyph-painting operators (`Tj`, `TJ`, `'`, `"`) that
intersect each rectangle, then re-parsing the export and refusing to return a
document whose targeted text survived (`RedactionVerificationError`). Glyph
geometry comes from PDF.js rather than a re-derivation of text matrices and
font metrics. Modules: `src/lib/pdf/operations/redact/`.

**Residual limits** — stated in the UI and the tool copy, not hidden:

- Images, vector artwork, annotations and form fields under a box are covered,
  not removed.
- Text inside a raster scan is not text; the box hides it, the pixels remain.
- Text painted from a Form XObject is not rewritten. The verification step
  catches this and fails the operation rather than returning a leaking file.
- Over-removal is possible: a string matched under a box is removed wherever it
  appears on that page. This fails safe and is reported via
  `removedTextOperations`.

**Regression tests:** `src/lib/pdf/__tests__/security-redaction.test.ts` (7).

---

## FM-002 — Converters destroyed non-ASCII text · **fixed**

**Severity:** high. Silent data loss on ordinary input.

Six converters shared `const safe = (s) => s.replace(/[^\x20-\x7E\n\t]/g, "?")`.
The standard PDF fonts they embed encode 218 characters, so this discarded text
the fonts could render perfectly well.

Evidence, DOCX round-tripped through PDF.js before the fix:

```
in:  "Café résumé naïve Zürich €5 © “quoted” – dash"
out: "Caf? r?sum? na?ve Z?rich ?5 ? ?quoted? ? dash"
```

`searchable-pdf.ts` applied the same rule to the invisible OCR layer using
spaces, so accented words in a scan became unsearchable.

**Fixed by** `src/lib/pdf/text/font-safe-text.ts`. `FontTextSanitizer` reads
each font's real character set via `font.getCharacterSet()`, intersects across
the fonts a document draws with, NFC-normalises, keeps everything encodable,
folds diacritics off Latin letters the fonts lack, drops zero-width formatting
characters, and reports the rest. Every converter returns a `textFidelity`
report, rendered by `TextFidelityNotice`.

**Known limit:** CJK, Arabic, Devanagari and Thai cannot be drawn by the
standard fonts at all. They are reported to the user, not silently replaced.
Rendering them needs an embedded Unicode font — open work, see FM-005.

**Regression tests:** `unicode-text-fidelity.test.ts` (9),
`font-safe-text.test.ts` (9).

---

## FM-003 — Pagination lost content past the first page · **fixed**

**Severity:** high. Content loss on any document longer than one page.

`drawParagraph` and `drawTable` in `docx-to-pdf.ts`, and the HTML table
renderer, took the current `page` as a parameter. Their `ensure()` callback
starts a new page by reassigning the *caller's* binding, which the parameter
does not see, so the helpers kept drawing into the page they were handed at the
new page's coordinates: overflow was painted back over the previous page and
the new page stayed empty apart from the footer.

Evidence: page 2 contained **0** body text items for a long DOCX paragraph, a
60-row DOCX table and a 60-row HTML table.

**Fixed by** passing a `getPage()` accessor and resolving the page only after
`ensure()` has run. `markdown-to-pdf` and `csv-to-pdf` were already correct —
they draw through closures that read the live binding.

**Regression tests:** `converter-pagination.test.ts` (4).

---

## FM-004 — Extension named a competitor and over-exposed its files · **fixed**

**Severity:** medium (store rejection and legal risk) plus low security.

In `pdfFire-extension`:

- The manifest description ended "Inspired by ihatepdf.cv.", `app.html` told
  users "Clone of ihatepdf.cv essentials.", and all 14 tool descriptions
  carried that competitor's URL paths. These render in the popup and workspace,
  and the manifest description is the public store listing.
- `web_accessible_resources` exposed `lib/*`, `js/*` and `css/*` to
  `<all_urls>` although the extension declares no content scripts and never
  calls `executeScript`. The workspace is an extension page opened via
  `chrome.runtime.getURL`, which needs no grant. Removed entirely;
  `permissions` and `host_permissions` were already empty.
- Branding was still FreePDF, including producer strings written into created
  documents.

**Not verified:** the extension has not been loaded in a browser, so runtime
behaviour after these edits is untested.

---

## Open findings

### FM-005 — No Unicode font, so most scripts cannot be rendered · **confirmed**

The converters can only draw the 218 WinAnsi characters. CJK, Arabic, Indic and
Thai text is reported as unrepresentable (FM-002) rather than drawn. This
contradicts any claim of global document support and needs an embedded,
lazily-loaded Unicode font with a licence review, plus shaping for complex
scripts. Not started.

### FM-006 — Next.js had a published advisory · **fixed, merged**

`next@16.4.0` was affected by a published advisory; `next build` refused its
first invocation each session with `SecurityFatalError` and only completed on
retry.

Fixed on `chore/next-security-upgrade` by moving to **16.4.3**, the patch
release that clears it, with `eslint-config-next` in lockstep and
`experimental.agentUpgrade: "security"` set so future advisories keep surfacing.
Same-major update: no codemod, no application code changed.

Verified off `origin/main`: `next --version` 16.4.3, 111/111 tests unchanged,
clean `tsc` and `eslint`, and `next build` succeeding from a cleared `.next` on
the first invocation with no advisory output. Merged to `main` in [PR #2](https://github.com/callsmasterofficial/pdfFire/pull/2).

The upgrade CLI also asks the agent to report telemetry by running
`npx --yes next@16.5.0-canary.35 internal report-agent-upgrade <id> success`.
That was **not** run: it executes a canary package and transmits an external
report, neither of which is part of clearing the advisory.

### FM-007 — PII auto-redaction boxes were imprecise · **fixed**

Three problems, all in the automated path:

- `scanTextForPii` took a **hardcoded default box** (`x: 50, y: 500,
  width: 120, height: 16`). Any caller that did not override it placed every
  redaction at the same spot regardless of where the match was.
- `scanPdfForPii` did override it, but with the geometry of the whole PDF.js
  text *item* containing the match, not the match itself. A box over one email
  covered the entire line, and because deletion targeted the item's text, the
  whole line was deleted too.
- It scanned each item in isolation, so a match split across runs — a page
  painting "john@" and "example.com" separately — was found in neither.
- The box ran from the baseline upward by the font size, so it sat too high:
  descenders were never covered, while empty space above the text was.

Fixed across four modules:

- `text/text-item-geometry.ts` converts between a character range and a
  rectangle in both directions. PDF.js gives one width per run, not per glyph,
  so this interpolates across the run and rounds **outward** in every
  direction: covering slightly too much is recoverable, leaving part of a
  secret behind is not. Glyph extent is now baseline −0.25em to +0.9em, so
  descenders are covered.
- `redact/page-text-map.ts` assembles the page's text from its runs, keeping a
  character-to-run map, so matches are found across run boundaries and can be
  mapped back to geometry. `hasEOL` inserts a line break so separate lines
  cannot fuse into a false match.
- `redact-pii.ts` now returns character offsets and one box **per run the match
  crosses**; `scanTextForPii` returns matches with `start`/`end` and no
  geometry at all, which is the honest shape for a text scanner.
- `redact/blank-text.ts` makes deletion character-precise. Previously the whole
  show operator was neutralised, which deleted more than the box covered. Now
  only the covered characters are replaced, one space each, so the glyph count
  is unchanged and the surrounding text survives. Blanking runs over the
  operators' *concatenated* text, because PDF.js may report one merged run
  where the page used two operators, in which case the covered text matches
  neither operator alone.

**Regression tests:** `redact-pii-geometry.test.ts` (8), covering the split-run
and split-operator cases, descender coverage, the box being narrower than the
line, and the invariant that matters most: deleting the email leaves
"Contact:" and "for details" intact.

The bogus Node fallback is also gone. It decoded raw PDF bytes as UTF-8 and
regex-scanned them, which cannot work on compressed streams; `getPdfjs()` now
runs outside the browser, so the real parser is used everywhere.

### FM-008 — Table cells were truncated silently · **fixed**

The DOCX, HTML, XLSX and CSV table renderers clipped cell text at a fixed
character count — 22, 25, 26 or 31 depending on the renderer — and appended
"...". Anything longer was gone from the output, reported nowhere. A
63-character cell came out as `Quarterly revenue reco...`, losing 41
characters.

A character count is also the wrong measure: in a proportional font
"WWWWWWWWWW" and "iiiiiiiiii" are the same length and nothing like the same
width, so the limit was simultaneously too strict for narrow text and too loose
for wide text.

Fixed by wrapping instead of clipping:

- `text/table-cell-layout.ts` wraps to the column's measured width, breaking
  words that are themselves wider than the column rather than letting them
  overflow into the next one. `TableFidelityTracker` records every cell that
  still does not fit.
- `operations/table-renderer.ts` lays a row out *before* reserving vertical
  space, so row height follows the tallest cell. The DOCX and HTML renderers
  were near-identical copies of the same loop and now share this one;
  `html-table.ts` is gone. XLSX and CSV keep their own chrome, including
  per-page header repetition, but share `layoutRow` and `drawRowCells`.
- A cell is only cut when it exceeds six wrapped lines, and each cut is
  reported through `tableFidelity`, shown by `TableFidelityNotice` in the four
  table converter views.

**Regression tests:** `table-cell-fidelity.test.ts` (6) — long cells survive in
all four converters with no "..." in the output, truncation is reported for an
unbreakable 4000-character token, and a table that fits reports none.

### FM-009 — Security tool claims audited · **done**

Each tool's public copy was turned into a test. `security-tool-claims.test.ts`
(10 tests) is written from `src/lib/seo/`, not from the implementation.

**Claims that held:**

- **protect** — genuinely writes an AES-256 encryption dictionary (`/R 6`,
  `/V 5`), not a silent RC4 fallback, and an independent reader refuses the
  file without the password. The only change was dropping "military-grade",
  which means nothing, and saying plainly that password strength is what
  actually decides the outcome.
- **flatten** — `form.flatten()` really does leave no interactive fields
  behind. "Static vector page paths" became an accurate description of drawing
  the field's appearance into the page, and "tamper-proof" is gone.

**Claims that were false, now fixed:**

- **metadata** — "Strip All Metadata for instant privacy sanitization" cleared
  only the six Info dictionary fields. The XMP packet, which normally repeats
  the same author and title, survived untouched, as did the creation date; the
  author's name was still readable in the exported bytes. `stripAll` now also
  deletes the XMP stream (and the orphaned object, not just the catalog
  reference, since pdf-lib still writes unreferenced objects), clears both
  dates, and loads with `updateMetadata: false` so pdf-lib does not stamp a
  fresh Producer and ModDate back on. The copy now also says what is *not*
  covered: annotation authors, form values, embedded file properties.
- **repair** — `xrefRebuilt` was hardcoded `true`, so every document was told
  its cross-reference table had been rebuilt, and the report card rendered a
  green "Pristine Rebuilt" unconditionally. It now reflects a strict-parse
  probe of the source. Worse, an unsalvageable file produced a blank page and
  reported `pagesRecovered: 1`: a fabricated page presented as recovered
  content. That is now `0` with `recoverySucceeded: false`, and the card shows
  a warning that the download is an empty placeholder.
- **compress** — the FAQ answered "Will compression blur my document text?"
  with "No. Vector text streams are never rasterized", while the Strong preset
  rasterises every page to JPEG. The copy now describes each preset honestly,
  including that Light and Balanced do not recompress images and so may barely
  shrink a well-compressed file, and that some files come out larger.
- **unlock** — see FM-011. The listing claimed "Decrypts document streams
  locally"; it does not.
- **sign** — "stamped directly into PDF vector streams" was wrong for a drawn
  or uploaded signature, which is an image. Reworded. Its limitation about not
  being a PKI certificate was already correct and stayed.

**Also found while auditing:** `text-to-pdf` never had the ASCII-stripping bug,
so Latin-1 text was safe, but it passed text straight to `drawText` with no
sanitiser. On CJK input pdf-lib's own error — `WinAnsi cannot encode "中"
(0x4e2d)` — reached the user as the failure message. It now uses
`FontTextSanitizer` like the other converters and reports what it could not
draw. Three stale `PDFfire` producer strings were also replaced.

A pre-existing test asserted `xrefRebuilt === true` for a healthy document, so
the suite was pinning the false positive in place. It now asserts the truthful
value, with a comment saying why it changed.

### FM-010 — Deletion removed identical text elsewhere on the page · **fixed**

Deletion matched by *content*: the covered text was extracted as a string and
every occurrence of that string on the page was blanked. So covering one
account number removed an identical one further down that the user never
covered, and covering a short word removed every instance of it. Covering
"the" in one line turned "keep the other sentence the same" into
"keep other sentence same".

Fixed by matching position instead:

- `redact/text-items.ts` now reports per-character coverage for the page,
  together with each character's advance width and font size, instead of
  reducing the covered text to a set of strings.
- `redact/align-coverage.ts` walks the content-stream operator characters and
  the PDF.js run characters together, transferring coverage character by
  character. PDF.js merges and splits runs and introduces spacing of its own,
  so whitespace is skipped on either side; if the sequences diverge on real
  characters, alignment **fails** and the caller falls back to content
  matching rather than guessing. A wrong alignment would delete the wrong
  characters, which is worse than deleting too many. Pages that fall back are
  reported in `contentMatchedPages` and surfaced in the UI.
- `redact/rewrite-positional.ts` deletes the covered characters and gives their
  advance back. Replacing them with spaces was not enough: a space is much
  narrower than the text it replaced, so the rest of the line slid left, in one
  case far enough to end up under the box meant to hide something else. In a TJ
  array a number displaces the next glyph by `-n/1000 x fontSize`, so a removed
  width `w` is restored with `n = -1000 x w / fontSize`. Both values come from
  PDF.js, so no font metrics are needed, and the ratio is unaffected by any
  enclosing transform. Existing kerning numbers inside a TJ array are kept.

Verification changed with it. Asserting that the covered *strings* are absent
from the page fails whenever an identical phrase legitimately survives
elsewhere, so `redact/verify-removal.ts` now asserts the property that
actually matters — no text we meant to delete remains inside any rectangle —
and separates a **leak** (text we deleted is still there, which throws) from a
**shift** (an uncovered neighbour drifted under the box, reported in
`shiftedPages`).

**Regression tests:** `redact-precision.test.ts` (8), including the two
original pathological cases: one of two identical lines, and a short covered
word that appears again on an untouched line.

### FM-011 — Unlock rasterised the document · **fixed for AES-256**

`unlockPdfWithPassword` opened the file with PDF.js and re-rendered every page
to a JPEG, then rebuilt a PDF from those images. The output opened without a
password but had no text layer: nothing selectable, searchable or screen-reader
readable, and usually a much larger file. The listing called this "Decrypts
document streams locally".

The gap was real — pdf-lib cannot open an encrypted document, and PDF.js can
decrypt but cannot write one back out — but it turned out to be bridgeable.
pdf-lib *will* parse the structure with `ignoreEncryption: true`, leaving every
stream and string as ciphertext; decrypting those in place and dropping
`/Encrypt` lets pdf-lib reserialise, recomputing lengths and the
cross-reference table.

Implemented in `crypto/` and `operations/decrypt/`:

- `crypto/aes-cbc.ts` — PDF uses CBC two ways. Stream and string data is
  PKCS#7 padded, which `crypto.subtle.decrypt` handles. Recovering the file key
  from `/UE` or `/OE` is unpadded, which WebCrypto refuses, so one extra
  ciphertext block is appended, crafted to decrypt to a full padding block.
  Crafting it needs only AES block *encryption*, which the existing encryption
  dependency already exports — no new dependency, and no hand-rolled cipher.
- `crypto/standard-security.ts` — Algorithm 2.A password validation and key
  recovery for revision 6, accepting either the user or the owner password,
  using the dependency's exported `computeHash2B`.
- `operations/decrypt/decrypt-document.ts` — walks every indirect object,
  decrypts streams and strings, removes `/Encrypt`, and reserialises.

Two details worth recording because they were wrong first time:
`PDFRawStream.contents` is read-only, so streams are replaced rather than
mutated; and decrypted strings must go back as hex, byte for byte, because
`PDFHexString.fromText()` would re-encode plaintext that is already UTF-16BE
with a byte order mark and corrupt the title.

**Scope and fallback.** Only AES-256 (V5 R6) is decrypted in place. RC4 and
AES-128 use MD5-based derivation and are declined rather than guessed at, and
documents holding objects inside encrypted object streams are declined too,
since pdf-lib parses those during load before anything can be decrypted. Both
cases fall back to the image path, which still works; the result reports
`method: "decrypted" | "rasterized"` and `UnlockMethodNotice` states which
happened. A wrong password raises `WrongPasswordError` and never silently
falls back.

**Regression tests:** `decrypt-document.test.ts` (7) — the document is
genuinely encrypted to begin with, the output opens without a password, the
text is still extractable by an independent parser, metadata survives, the
owner password works, a wrong password is refused, and an unsupported revision
is declined rather than mangled.

### FM-012 — Legacy encryption · **fixed for RC4; AES-128 implemented**

Revisions 2 to 4 derive the file key with MD5 and encrypt with RC4 or AES-128.
Both are weak ciphers, but documents using them are common and the alternative
for a user who holds the password was losing the text to a rasterised copy.

`crypto/legacy-security.ts` implements the relevant algorithms from
ISO 32000-1 7.6.3: the 32-byte password padding and MD5 key derivation
(Algorithm 2, including the `/EncryptMetadata` false case), the expected `/U`
value (Algorithms 4 and 5), user validation (Algorithm 6), recovery of the user
password from `/O` with the owner password (Algorithm 7), and the per-object key
(Algorithm 1, with the AESV2 `sAlT` suffix).

`crypto/document-cipher.ts` turns a validated file key into a cipher, so the
object walker no longer needs to know which revision it is rewriting:
AES-256 uses the file key directly, while revisions 2 to 4 derive a key per
object and use RC4 or AES-128.

**Evidence, and the difference between the two paths.** RC4 (V2 R3, 128-bit) is
validated end to end against documents produced by the encryption dependency:
the text is recoverable afterwards, metadata survives, the owner password works,
and a wrong password is refused. That also validates the shared Algorithm 2
derivation against a third-party producer.

AES-128 (V4, AESV2) is **not** validated that way, because the dependency cannot
produce such a document. Its revision-specific parts — the salted per-object key
and the leading initialisation vector — are covered by direct unit tests, and
the `/CF` to `/CFM` resolution by a parser test. That is weaker evidence than a
real fixture and the capability matrix records it as such. A third-party AES-128
fixture would settle it.

Still declined, and still falling back to the disclosed image path: documents
holding objects inside encrypted object streams, since pdf-lib parses those
during load before anything can be decrypted; and any crypt filter other than
AESV3, AESV2 or V2.

**Regression tests:** `decrypt-document.test.ts` (12) and
`decrypt-ciphers.test.ts` (5).

### FM-013 — Glyph widths now exact · **fixed**

Advances were estimated by dividing a text run's total width by its character
count. For mixed-width text that is wrong by enough to matter, and it caused two
problems: the width given back after deleting characters was inexact, so the
rest of the line drifted; and which characters a box edge touches was
mis-estimated, so a box drawn exactly around "555-0100" also took " an".

**Widths.** `text/glyph-widths.ts` reads them from the document — `/Widths`
indexed from `/FirstChar` for simple fonts, with `/MissingWidth` as the
default. The standard 14 fonts carry no `/Widths` at all, so their metrics come
from pdf-lib's own copy: the same font is embedded into a scratch document and
measured at size 1000, which makes the measurement the 1/1000-unit advance
directly. No new dependency — `@pdf-lib/standard-fonts` is in the tree via
pdf-lib, but pdf-lib's public API was enough.

**Text state.** `redact/text-state.ts` tracks `Tf`, `Tc`, `Tw` and `Tz` per
operator, since all four change a character's advance and nothing tracked them
before.

**The advance given back.** `redact/font-resources.ts` computes
`n = -(W + 1000 x (Tc + Tw) / fontSize)`. Equating a TJ number's displacement
with a character's advance cancels both the font size and the horizontal
scaling, so horizontal scaling must *not* be applied there — TJ displacement is
scaled by it already.

**Selection.** This needed the pipeline inverted. Coverage used to be computed
first and alignment consumed it; exact selection needs the opposite, because a
character's position can only be known once its operator — and therefore its
font and text state — is known. So:

- `redact/align-sequences.ts` now only pairs the two character sequences, with
  no notion of coverage. It fails rather than guessing if they diverge on real
  characters, and additionally requires every painted character PDF.js reported
  to find an operator, since an unmatched one would be invisible to coverage.
- `redact/page-coverage.ts` walks each run accumulating exact advances to get a
  real position per character, and marks one covered when any part of its
  advance overlaps a rectangle. Lifting a text-space advance into the
  rectangles' space is `(W/1000 + (Tc + Tw)/Tfs) x Th x reportedSize`, where
  `Tfs` cancels out of the glyph term.
- `redact/analyze-pages.ts` runs that once per page and projects the result back
  onto the operators. Removal and verification share it, so both see the same
  answer.

A font whose widths cannot be read falls back to the average for that page and
is reported in `estimatedWidthPages`, shown in the UI, so the imprecision is
disclosed rather than hidden.

`redact/text-items.ts` and `redact/align-coverage.ts` are gone, replaced by that
pipeline, along with `blankByFlags`, `findShowOperations` and `advanceOf`.

**Regression tests:** `glyph-widths.test.ts` (3) and `redact-precision.test.ts`
(9). The box drawn exactly around "555-0100" now leaves "Phone" and "and more
text after it" intact, `shiftedPages` is empty, and a box ending mid-number
still takes the whole number rather than leaving a fragment.
