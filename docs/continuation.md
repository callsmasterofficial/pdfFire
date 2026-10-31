# Continuation checkpoint

Resume point for the FileMelo work. Update this after each verified milestone.

Last updated: 2026-10-31.

## Where the work is

| Repository | Branch | Head | Pushed |
| --- | --- | --- | --- |
| `callsmasterofficial/pdfFire` | `fix/redaction-truth-and-unicode` | `f1c5bf2` | [PR #1](https://github.com/callsmasterofficial/pdfFire/pull/1) |
| `callsmasterofficial/pdfFire` | `fix/pii-redaction-geometry` | `a55948b` | [PR #3](https://github.com/callsmasterofficial/pdfFire/pull/3) (stacked on #1) |
| `callsmasterofficial/pdfFire` | `chore/next-security-upgrade` | `b5170e0` | [PR #2](https://github.com/callsmasterofficial/pdfFire/pull/2) (draft) |
| `callsmasterofficial/pdfFire-extension` | `fix/brand-and-attack-surface` | `41a2c85` | [PR #1](https://github.com/callsmasterofficial/pdfFire-extension/pull/1) |
| `callsmasterofficial/pdfFire-app` | — | untouched | n/a |

Both branches are cut from `main`. Nothing has been merged, deployed or
submitted to any store.

### Commits

**pdfFire** (website/PWA)

1. `91907a8` — redaction removes covered text and is verified on export; false
   security claims corrected.
2. `76f7dd9` — converters stop replacing non-ASCII text with `?`.
3. `68b1a9d` — overflow content draws on the current page instead of a stale one.
4. `f1c5bf2` — security findings, capability matrix and this checkpoint.

**pdfFire** (`chore/next-security-upgrade`, cut separately from `origin/main`)

1. `b5170e0` — Next.js 16.4.0 → 16.4.3 for the published advisory (FM-006).
   Touches only `package.json`, `package-lock.json` and `next.config.ts`, so it
   is disjoint from the fix branch and merge order does not matter.

**pdfFire-extension**

1. `41a2c85` — competitor references removed, stale FreePDF branding replaced,
   `web_accessible_resources` dropped.

## Verified state

Run from `pdfFire/`:

```bash
npm ci && npx vitest run && npx tsc --noEmit && npx eslint && npx next build
```

- Vitest: **148 passed / 148**, 29 files on `fix/pii-redaction-geometry`
  (140 in 28 files on `fix/redaction-truth-and-unicode`). Baseline on `main`
  was 111 in 24 files; 37 tests were added in total.
- `tsc --noEmit`: clean.
- `eslint`: clean, 0 warnings.
- `next build`: succeeds, 48 routes. On this branch it still halts once per
  invocation with the Next.js advisory notice and completes on retry; that is
  fixed on `chore/next-security-upgrade` (FM-006), not here.

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
