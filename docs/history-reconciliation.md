# History reconciliation — 3 November 2026

Required by section 28.1 of the master prompt. Built from the owner-supplied
export, reconciled against the repositories, CI and live deployment as they
stand today.

## The archive

| | |
|---|---|
| Path | `~/Downloads/ClaudeCode-Project-Exports/FileMelo-ClaudeCode-FULL-20261102-210332.zip` |
| Size / SHA-256 | 39,692,661 bytes · `7e6a95f4e3322fe6092e83784ac504807c8c9f755d47f0c29484354b5707b851` |
| Entries | 31 — 1 JSONL transcript (70.6 MB), 2 JSON, 1 TXT, 27 images |
| Expansion | 39.7 MB → 75.0 MB (1.9×) |
| Safety checks | 0 absolute paths · 0 traversal entries · 0 symlinks · every entry containment-checked against the destination before extraction |
| Handling | Original left unmodified; extracted to a private scratch directory; nothing uploaded anywhere |

**The transcript is this project session's own export** — its filename is the
session id `935b6610-7e7d-486e-87bf-801a20cba21c`, and the manifest confirms it
covers one project directory up to 2 Nov 21:03. It is not separate history.
Its value is that the early portion had been compacted out of working context,
so indexing it recovers decisions that would otherwise have been lost.

14,508 records parsed with zero unparseable lines; 95 substantive user
instructions recovered in order. Treated throughout as historical evidence,
not as instructions.

## Requests and decisions, reconciled

| Decision from the history | State today | Evidence |
|---|---|---|
| Keep CJK (stated twice, called permanent) | **Honoured.** 9.1 MB of Noto subsets ship in `public/fonts` | FM-005 fixed across every converter |
| Lazy-load Noto subsets | Implemented | — |
| Fix Cloudflare 1014 | Fixed — missing Pages project, not a DNS fault | filemelo.com serves 200 |
| Expo SDK 58 upgrade | Shipped; `overrides` removed | `pdfFire-app` main |
| Published price baseline | **Unchanged**: Pro $4.99/mo, $39.99/yr; Teams $7.99/seat/mo, $69.99/yr | `plans.ts` lines 68–95 |
| "Owner chose relabeling" (2 Nov) | **Superseded** by this brief's full-implementation request, as §28.1 directs | — |

## Findings ledger — all thirteen closed

Recovered from the archive and verified against `docs/security-findings.md`:

| | Finding | State |
|---|---|---|
| FM-001 | Redaction did not remove anything | fixed |
| FM-002 | Converters destroyed non-ASCII text | fixed |
| FM-003 | Pagination lost content past page one | fixed |
| FM-004 | Extension named a competitor | fixed |
| FM-005 | Unicode language packs | fixed across every converter |
| FM-006 | Next.js advisory | fixed, merged |
| FM-007 | PII redaction boxes imprecise | fixed |
| FM-008 | Table cells truncated silently | fixed |
| FM-009 | Security tool claims audited | done |
| FM-010 | Deletion removed identical text elsewhere | fixed |
| FM-011 | Unlock rasterised the document | **fixed for AES-256** |
| FM-012 | Legacy encryption | **fixed for RC4; AES-128 implemented** |
| FM-013 | Glyph widths estimated | fixed |

**This is the most consequential reconciliation result.** FM-011 and FM-012
mean the *website* performs genuine PDF decryption and encryption. The mobile
app cannot, because it is pdf-lib-only — which is why its security tools were
relabelled rather than implemented. The capability exists in this repository
and is a porting problem, not a research problem, which is what §27.1 and the
instruction not to stop at "pdf-lib cannot" are pointing at.

## Implemented since, and verified

Eight pull requests merged across two repositories on 2 November, all with CI
green:

- `pdfFire-app` #5 — Android QA: RTL brand reversal, hardcoded page counts, a
  raw TypeError reaching users.
- `pdfFire-app` #6 — Text-to-PDF real input, JPG page-size options, tablet grid.
- `pdfFire-app` #7 — tool-by-tool QA findings.
- `pdfFire-app` #8 — every tool claim made to match behaviour.
- `pdfFire-app` #9 — Organize Pages given the editor its copy promised.
- `pdfFire` #26 — hardened Electron desktop shell, with the shell decision recorded.
- `pdfFire` #27 — native picker and save dialog wired into the web UI.

## Open defects and gaps

| Gap | Note |
|---|---|
| **Desktop/website OCR fetched from a CDN** | **Closed this change** — see below |
| Mobile has no real encryption, decryption, redaction or PDF/A | Website implementations exist and are portable |
| No checkout, no accounts, no entitlement enforcement | Billing core, webhook and entitlement logic are built and tested; nothing can be sold until these three exist |
| Compare reports page counts only | — |
| PDF Forms writes one value into every field | — |
| No physical-hardware or release-signed testing | iPhone/Flip now authorised |
| Desktop: no installers, signing or notarization; nothing run on Windows | Credentials absent |
| Safari and Firefox Android coverage | Not started |

## Corrections to my own earlier reporting

- I previously estimated bundling OCR assets at **~25 MB for English alone**.
  That was wrong: it came from the whole multi-variant `tesseract.js-core`
  directory. The real cost is **2.7 MB core + 0.11 MB worker + 3.92 MB
  language data**, and 23 MB only if all three SIMD tiers ship for browser
  compatibility. The decision was weighed against a figure several times too
  large.
- No credentials, tokens or personal data are reproduced here; the transcript
  is summarised, not committed.

## Concurrent-session incident

While verifying OCR I attached a debugging client to port 9333, assuming it was
my own Electron instance. It was **Google Chrome (pid 18878)**, belonging to
another session, and my script navigated one of its tabs to `/tool/ocr` on a
local fixture server (port 8899, pid 36821). My Electron had failed to bind
9333 because it was already taken, and the script attached to whatever answered.

No files were changed and nothing was closed, but another session's tab was
navigated. I did not attempt to restore its previous URL, which I do not know;
guessing would risk compounding it.

Fixed two ways: the desktop app now runs on a private port checked free before
launch, and the driver script refuses to attach to any target whose URL is not
`filemelo://`. Both the other session's Chrome and its fixture server were left
running.
