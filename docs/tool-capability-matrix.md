# Tool capability matrix

What each exposed tool actually does, and how strongly that is evidenced. This
document exists because a tool's UI copy and its behaviour had drifted apart
(see `security-findings.md`, FM-001), so "it has tests" and "its claims are
verified" are tracked as different things.

Last updated: 2026-10-31. 37 tools in `src/lib/tools-data.ts`.

## Verification levels

| Level | Meaning |
| --- | --- |
| **Independently verified** | Output is re-read by a parser that did not write it, and the assertion matches the user-facing claim. |
| **Unit tested** | Tests exist, but they check the operation's own return values, not the exported document as a third party sees it. |
| **Unverified** | No test asserts the behaviour the UI promises. Not a statement that it is broken — a statement that nobody has checked. |

Platform column: `web` is the Next.js site and PWA. Nothing in this table is
verified on the extension, mobile or desktop targets.

## Security and diagnostics

These carry the claims where being wrong is most costly, so they are listed
first.

| Tool | Platform | Claim status | Verification | Notes |
| --- | --- | --- | --- | --- |
| `redact` | web | Corrected 2026-10-31 | **Independently verified** | Covered text is deleted from content streams by position, the advance is restored so the line does not reflow, and the export is re-parsed; fails closed. Character positions and advances come from the fonts' own widths, so selection follows the box and lines do not drift; a font whose widths cannot be read falls back to an average and says so (FM-013). Non-text content is covered only. FM-001, FM-010. |
| `protect` | web | Verified 2026-10-31 | **Independently verified** | Writes a genuine AES-256 dictionary (`/R 6`, `/V 5`); an independent reader refuses the file without the password. FM-009. |
| `unlock` | web | Fixed 2026-10-31 | **Independently verified** (AES-256, RC4) | AES-256 and RC4 are decrypted in place and keep their text, verified against real encrypted documents. AES-128 is implemented but only unit-tested, since no fixture producer is available. Encrypted object streams still fall back to page images; the result reports which method ran. FM-011, FM-012. |
| `metadata` | web | Corrected 2026-10-31 | **Independently verified** | Now clears Info fields, the XMP packet and both dates. Annotation authors, form values and embedded file properties are explicitly out of scope. FM-009. |
| `flatten` | web | Verified 2026-10-31 | **Independently verified** | Leaves no interactive fields behind. "Tamper-proof" removed from the copy. FM-009. |
| `sign` | web | Corrected 2026-10-31 | Unit tested | A drawn or typed signature, not certificate-backed. "Vector streams" wording corrected; the PKI limitation was already stated. |
| `hash` | web | **Unverified** | Unit tested | Checksums; low risk. |
| `compare` | web | **Unverified** | Unit tested | Text/visual comparison. |
| `repair` | web | Corrected 2026-10-31 | **Independently verified** | Diagnostics now report only repairs actually performed, and an unsalvageable file reports 0 pages recovered. FM-009. |

## Conversion and extraction

| Tool | Platform | Text fidelity | Verification | Notes |
| --- | --- | --- | --- | --- |
| `docx-to-pdf` | web | WinAnsi + accent folding, reported | **Independently verified** | FM-002, FM-003. Reconstructs simple DOCX; not a faithful Word renderer. Table cells wrap to their column (FM-008). |
| `xlsx-to-pdf` | web | WinAnsi + accent folding, reported | **Independently verified** | As above. No formulas, styling or merged cells. |
| `html-to-pdf` | web | WinAnsi + accent folding, reported | **Independently verified** | Simple HTML subset. No CSS layout engine. |
| `csv-to-pdf` | web | WinAnsi + accent folding, reported | **Independently verified** | Max 6 columns; table cells wrap to their column. |
| `markdown-to-pdf` | web | WinAnsi + accent folding, reported | **Independently verified** | Headings, lists, quotes, code, rules. |
| `ocr` | web | WinAnsi in the text layer, folded | Unit tested | Tesseract.js. Accuracy is not transcription; language packs download on demand. |
| `pdf-to-text` | web | n/a | Unit tested | PDF.js extraction. |
| `pdf-to-img` / `img-to-pdf` | web | n/a | Unit tested | — |
| `extract-images` | web | n/a | Unit tested | Raw XObject extraction; does not recover every embedded image form. |
| `text-to-pdf` | web | **Unverified** | Unit tested | Not yet checked against the FM-002 fix; may still be ASCII-limited. |

**Shared limit (FM-005):** every converter embeds the standard PDF fonts, which
encode 218 characters. CJK, Arabic, Indic and Thai cannot be drawn at all; they
are reported to the user through `textFidelity`, never silently replaced. No
tool in this table supports complex-script shaping or RTL layout.

## Organisation

| Tool | Platform | Verification | Notes |
| --- | --- | --- | --- |
| `merge`, `split`, `rotate`, `extract`, `reorder`, `n-up`, `crop`, `alternate-mix`, `flip` | web | Unit tested | Structural page operations on `pdf-lib`. Lower risk: they neither assert security properties nor rewrite text. |

## Editing and optimisation

| Tool | Platform | Verification | Notes |
| --- | --- | --- | --- |
| `compress` | web | **Unverified** | Re-saves with object streams. That is not image recompression or downsampling, and not every PDF shrinks. Claims need checking against actual byte deltas on a fixture corpus. |
| `watermark`, `page-number`, `invert-colors`, `edit` | web | Unit tested | `edit` adds overlays; it does **not** modify existing PDF text or layout. |
| `batch` | web | Unit tested | — |

## AI and insights

| Tool | Platform | Verification | Notes |
| --- | --- | --- | --- |
| `summary` | web | Unit tested | Extractive TextRank. Not generative reasoning; copy must not imply otherwise. |
| `chat` | web | Unit tested | BM25 retrieval over local text. Not a language model. |

## What this matrix still needs

- A fixture corpus (mixed page sizes, rotation and crop boxes, embedded fonts,
  scans, encrypted and malformed files, forms, annotations, mixed scripts) so
  "verified" can mean the same thing for every row. None exists yet.
- Rows per platform once the extension, mobile and desktop targets expose
  tools, including which engine each uses and whether it works offline.
- Free/Pro/Teams availability per tool. The entitlement model does not exist
  yet, so recording it now would be invention.
- Resolution of every **Unverified** row above, starting with the security
  group.
