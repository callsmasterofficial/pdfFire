# Continuation checkpoint

Resume point for the FileMelo work. Update this after each verified milestone.

Last updated: 2026-10-31.

## Where the work is

Rebuilt from live GitHub state and git ancestry. Every version of this section
written on a branch is stale about whatever merged after it, so it is rebuilt
rather than merged.

Website `main` is `f39301c`.

Merged to website `main`:

| PR | What |
| --- | --- |
| #10 | production dependency audit remediation |
| #9 | quality-gate CI workflow |
| #2 | Next.js 16.4.3 for the published advisory (FM-006) |
| #1 | redaction leak, Unicode loss, pagination loss (FM-001 to FM-003) |
| #11 | revalidate stacked PRs when their base moves |
| #3 | PII box geometry (FM-007) |
| #7 | positional redaction and exact font metrics (FM-010, FM-013) |
| #13 | integration of #5's security audit and decryption (FM-009, FM-011) |
| #5 | closed as integrated by #13 |
| #4 | table cell wrapping (FM-008) |

Still open on the website:

| PR | Branch | Base | State |
| --- | --- | --- | --- |
| #6 | `feat/legacy-pdf-decryption` | `main` | legacy RC4/AES-128 decryption (FM-012); being integrated |
| #8 | `feat/unicode-language-packs` | `main` | CJK and other language packs (FM-005); retargeted from #1's branch |

Then, once both #4 and #8 are on `main`: migrate the DOCX, HTML, XLSX and CSV
converters onto the language packs. They still use the WinAnsi sanitiser,
because #4 rewrote their text drawing and #8 could not migrate them at the same
time without conflicting.

Other repositories:

- `pdfFire-extension` `main` is `36c86b8`; PRs #1 (branding, resource exposure)
  and #2 (CI) are merged. The extension has not been loaded in a browser.
- `pdfFire-app` has PR #1 open, whose production dependency audit genuinely
  fails. That must be fixed before the branch is release-ready.

A merge is not a deployment. Nothing has been deployed, submitted to a store or
made publicly live; that is verified separately from GitHub state.

### Documentation drift to watch

Integrating #5 through #13 kept `main`'s documentation and archived the audit
branch's copies under `docs/archives/pr5/`. The code landed but the live
`docs/security-findings.md` lost FM-009, FM-011 and FM-012, and
`docs/tool-capability-matrix.md` still called `protect`, `unlock`, `metadata`,
`flatten`, `sign` and `repair` unverified after their tests had merged. Both
are reconciled in this merge. When integrating the remaining branches, check
that the live documents describe the code that is actually on `main`.

### Resolving conflicts in this file

This file is edited on several branches at once. Resolve by rebuilding the
current-state section above from live PR metadata and git ancestry. Do **not**
resolve it by keeping the longer version, the one listing more PRs, or a
blanket "ours"/"theirs": every version written on a branch is stale about
whatever merged after it. Earlier merges of #3 and #7 resolved documentation
conflicts that way and dropped four findings sections from
`docs/security-findings.md`.

## Verified state

Run from `pdfFire/`, which is what the CI workflow runs:

```bash
npm ci && npm test && npx tsc --noEmit && npm run lint && npm run build && npm audit --omit=dev --audit-level=high
```

Per-branch test counts are not additive and no single historical figure is
release evidence. The only figure that counts is the suite run on the exact
release SHA after the stack is integrated.

`npx vitest run` needs `vitest.setup.ts`, which shims `Promise.try` and
`Uint8Array.prototype.toHex` for `pdfjs-dist@6` on Node 22. Those shims are
test-only. Node in use: v22.23.4.

## Not done, and not claimed

- No deployment, no preview URL, no production cutover.
- No store packaging or submission for any platform.
- The extension has not been loaded in a browser; its runtime behaviour after
  the branding and manifest edits is unverified.
- No work on `pdfFire-app` (mobile), desktop, accounts, billing, entitlements,
  Teams, pricing, localisation beyond the font-coverage reporting above, or the
  cost register.
- Cloudflare and Dodo Payments dashboards were not opened in this session, so
  domain state, merchant approval and live-mode readiness remain unverified.
- Rebrand is partial: the website still carries PDFfire identifiers in places,
  and `pdfFire-app` is untouched. Repository names, bundle IDs and extension
  IDs are deliberately unchanged.

## Deployment and hosting state (checked 2026-10-31)

- `filemelo.com` resolves to Cloudflare but returns HTTP 403 with Cloudflare
  error 1014, so it is not serving the application.
- `pdffire.com` does not resolve. The source still uses it as the canonical
  host (`https://pdffire.com`), which must change before launch.
- The repository contains no deployment configuration: no Vercel, Wrangler,
  Netlify or GitHub Actions workflow. Nothing deploys on merge.
- `callsmasterofficial/pdfFire` is a **public** repository; the extension and
  mobile repositories are private.

## Next task

Both PRs are open and awaiting review. Then pick up
`docs/security-findings.md` in order:

1. **FM-008** — table cell truncation: either wrap cells or report the loss the
   way `textFidelity` reports font coverage. Currently silent.
2. **FM-009** — apply the FM-001 method (claim versus independently verified
   behaviour) to compress, repair, protect/unlock, flatten, sign and metadata
   removal. Expect more false claims; `docs/tool-capability-matrix.md` is the
   place to record the outcome.

Blocked on an owner decision:

- **FM-005** — embedding a Unicode font: needs a licence decision and a view on
  bundle size versus lazily downloaded subsets.
- **FM-010** — positional rather than substring matching when deleting text, so
  identical text elsewhere on the page is left alone.
- Whether to report upgrade telemetry to Vercel via the canary package the
  Next.js upgrade CLI names (see FM-006). Not run.

## Rollback

Nothing is deployed, so rollback is local. To drop the website work:

```bash
git -C pdfFire checkout main
git -C pdfFire branch -D fix/redaction-truth-and-unicode
```

Reverting only the redaction change restores a feature that leaks the text it
claims to remove, so revert the claims with it or leave the branch intact.
