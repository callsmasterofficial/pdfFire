# Continuation checkpoint

Resume point for the FileMelo work. Update this after each verified milestone.

Last updated: 2026-10-31.

## Where the work is

Rebuilt from live GitHub state and git ancestry on 2026-10-31, not from the
previous contents of this file, which claimed nothing had merged.

Website `main` is `8db8410`.

Merged to website `main`, in the order it happened:

| PR | Branch | What |
| --- | --- | --- |
| #10 | `fix/production-dependency-audit` | production audit remediation (into #2's branch) |
| #9 | `release/ci-gates-2026-10-31` | quality-gate CI workflow (into #2's branch) |
| #2 | `chore/next-security-upgrade` | Next.js 16.4.3 for the published advisory |
| #1 | `fix/redaction-truth-and-unicode` | redaction leak, Unicode loss, pagination loss |
| #11 | `ci/validate-retargeted-prs` | revalidate stacked PRs when their base moves |
| #3 | `fix/pii-redaction-geometry` | PII box geometry |
| #7 | `fix/redaction-positional-matching` | positional redaction and exact font metrics |

Still open on the website:

| PR | Branch | Base | State |
| --- | --- | --- | --- |
| #4 | `fix/table-cell-truncation` | `main` | retargeted from #1's branch; being integrated |
| #5 | `audit/security-tool-claims` | `main` | conflicts with `main` |
| #6 | `feat/legacy-pdf-decryption` | `audit/security-tool-claims` | waits on #5 |
| #8 | `feat/unicode-language-packs` | `main` | retargeted from #1's branch; conflicts |

Other repositories:

- `pdfFire-extension` `main` is `36c86b8`; PRs #1 (branding, resource exposure)
  and #2 (CI) are merged.
- `pdfFire-app` has PR #1 open, a CI workflow whose production dependency audit
  fails. That failure is real and must be fixed before the branch is treated as
  release-ready.

A merge is not a deployment. Nothing has been deployed, submitted to a store,
or made publicly live, and that is verified separately from GitHub state.

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
