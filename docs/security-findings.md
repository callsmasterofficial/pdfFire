# Security and correctness findings

Record of verified defects, the evidence for each, and what remains open.
Status words mean exactly what they say: **fixed** has a regression test,
**confirmed** has been reproduced but not fixed, **unverified** has not been
tested in this project.

Last updated: 2026-10-31.

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

### FM-006 — Next.js had a published advisory · **fixed, awaiting merge**

`next@16.4.0` was affected by a published advisory; `next build` refused its
first invocation each session with `SecurityFatalError` and only completed on
retry.

Fixed on `chore/next-security-upgrade` by moving to **16.4.3**, the patch
release that clears it, with `eslint-config-next` in lockstep and
`experimental.agentUpgrade: "security"` set so future advisories keep surfacing.
Same-major update: no codemod, no application code changed.

Verified off `origin/main`: `next --version` 16.4.3, 111/111 tests unchanged,
clean `tsc` and `eslint`, and `next build` succeeding from a cleared `.next` on
the first invocation with no advisory output. Open as draft
[PR #2](https://github.com/callsmasterofficial/pdfFire/pull/2).

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

### FM-013 — Character selection at box edges is approximate · **confirmed**

PDF.js reports one width per text run, not per glyph, so which characters a
box edge touches is estimated from an average character width. For a run of
mixed-width text that estimate can be out by a character or two: a box drawn
exactly around "555-0100" removed "555-0100 an".

Selection rounds outward deliberately, so a partially covered character is
removed rather than left as a fragment, and nothing covered is ever left
behind. The cost is that a few characters beside the box may also go, and the
same approximation makes the restored advance inexact, which is what produces
the `shiftedPages` reports.

Exact widths would need the font dictionaries — `/Widths` and `/FirstChar` for
simple fonts, `/W` and `/DW` for CID fonts — plus the encoding needed to map
PDF.js's Unicode back to character codes. That is a real piece of work and is
tracked here rather than implied away. A test records the current edge
behaviour so it cannot change unnoticed.
