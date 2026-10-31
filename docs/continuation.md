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

All website PRs #1 to #11 and the integration PRs #13 to #15 are merged. The
four converter migrations that #8 deferred are done in this change, so no
converter is left on the WinAnsi sanitiser.

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

Release candidate: website `main` at
`415d2a468233c996c70743d6286f9e6ed43c58a0`.

Run from `pdfFire/`, which is what the CI workflow runs:

```bash
npm ci && npm test && npx tsc --noEmit && npm run lint && npm run build && npm audit --omit=dev --audit-level=high
```

Results on that exact SHA, from a clean `node_modules` and `.next`:

| Gate | Result |
| --- | --- |
| Vitest | 205 passed / 205, 37 files |
| `tsc --noEmit` | clean |
| ESLint | clean, 0 warnings |
| Production build | succeeds |
| `npm audit --omit=dev --audit-level=high` | passes |

GitHub Actions "Web quality and security gates" is also green on `main` at
`415d2a4`, so the gate result is reproduced in CI and not only locally.

Per-branch test counts are not additive and no historical figure is release
evidence. The figure above is the suite run on the release SHA itself.

## Verified live and hosting state

Checked directly, not carried over from an earlier session:

- `filemelo.com` and `www.filemelo.com` return HTTP 403 from Cloudflare with
  body `error code: 1014`. That is Cloudflare's CNAME cross-user error: the
  hostname resolves to Cloudflare (172.67.186.35, 104.21.19.118) but the zone
  is not serving this account's content. It is a DNS/zone configuration problem
  to fix in the dashboard, not a missing build.
- `pdffire.com` does not resolve at all, while the source still uses
  `https://pdffire.com` as its canonical host. That must change before launch.
- No deployment provider is configured in the repository: there is no Vercel,
  Wrangler or Netlify configuration and no deploy workflow. The only workflow is
  the quality gate, so a merge to `main` publishes nothing.
- Browser 1 is connected and reachable for the authorized Cloudflare and Dodo
  dashboards. The built-in browser pane has no session and redirects to the
  Cloudflare login, so dashboard work must go through Browser 1.

So: the code is integrated, gated and release-tested; nothing is deployed,
submitted, approved or publicly live.

## Cloudflare: attempted, blocked on sign-in

Attempted on 2026-10-31 through Browser 1, which is connected and was selected
for the attempt. The zone's DNS page redirected to the Cloudflare login, which
offered a chooser of saved profiles rather than an authenticated session.

So the session is signed out, not merely unreachable. Completing it means
entering a password or finishing an authentication flow, which is not something
to do on the owner's behalf. Most of the offered profiles belong to unrelated
businesses and it is not evident which owns the FileMelo zone, so picking one
would sign in to an unrelated account.

**To unblock:** sign in to Cloudflare in Browser 1 on the account that owns
`filemelo.com`, and confirm which account that is.

**What the fix will be.** `error code: 1014` is Cloudflare's CNAME cross-user
error: a proxied CNAME in this zone points at a hostname inside a *different*
Cloudflare account's zone, which has not allowed it. The repair is to replace
that record with one pointing at this project's own origin. That cannot be
chosen until the hosting target exists, which is the next decision below.

## Next phase

1. **Hosting.** Nothing deploys today and no provider is configured. The app
   uses `cacheComponents` and `partialPrefetching`, so it needs a server
   runtime and cannot simply be exported as static files. Decide between a
   Cloudflare Workers deployment via OpenNext and another provider, then
   configure it, before the DNS record can point anywhere useful.
2. **Cloudflare DNS**, once signed in and the origin exists: fix the 1014,
   choose apex versus www, and set the redirect for the other.
3. **Dodo Payments**: inspect the FileMelo business and products, then build
   accounts and entitlements against sandbox before any live offer.
4. **Extension**: load it unpacked and exercise it. Its runtime has never been
   tested, only its manifest and syntax.
5. **Mobile PR #1**: fix the genuine production dependency audit failure.

### Done since the last checkpoint

- The canonical host is `filemelo.com`, not the unresolvable `pdffire.com`, and
  `SITE_CONFIG` is FileMelo rather than PDFfire. Without this, repairing DNS
  would have served a site whose canonical links, sitemap and robots.txt all
  pointed at a dead domain.
