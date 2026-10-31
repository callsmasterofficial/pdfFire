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

### FM-007 — PII auto-redaction boxes are imprecise · **confirmed**

`scanPdfForPii` derives a box from the PDF.js text item that contains a match,
not from the match itself, so the whole item is covered: it over-redacts, and a
match spanning two items may be partly uncovered. The box is placed from the
baseline upward by roughly the font size, which does not account for
descenders. With FM-001 fixed the *text* is removed correctly wherever a box
lands, so this is a fidelity and coverage issue rather than a leak. Its Node
fallback also regex-scans raw PDF bytes decoded as UTF-8, which cannot work on
compressed streams and should be removed now that PDF.js runs outside the
browser.

### FM-008 — Table cells are truncated · **confirmed**

The DOCX, HTML, XLSX and CSV table renderers clip cell text at 22–31
characters and append "...". Longer values are lost from the output with no
warning. Unlike FM-002 this is reported nowhere.

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

### FM-011 — Unlock rasterises the document · **confirmed, disclosed**

`unlockPdfWithPassword` opens the file with PDF.js and re-renders every page to
a JPEG at scale 2.0, then rebuilds a PDF from those images. The output opens
without a password, but it has no text layer: nothing can be selected,
searched or read by a screen reader, and the file is usually much larger.

The listing described this as "Decrypts document streams locally", which it is
not. The mechanism is now stated in the copy, in the tool's description, and in
an `UnlockRasterizationNotice` shown before the user commits.

A real fix needs a decrypting writer: pdf-lib cannot open an encrypted document
at all, and PDF.js can decrypt but cannot re-serialise. Until one exists, the
honest options are the disclosed rasterised copy or no feature. Not started.

