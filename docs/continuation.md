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

Checked directly on 2026-10-31, not carried over from an earlier session:

- **The site is publicly live.** `https://filemelo.com/`,
  `https://www.filemelo.com/` and `https://filemelo.pages.dev/` all return
  HTTP 200. The apex serves `<title>FileMelo — Private PDF Tools</title>` with
  `rel="canonical" href="https://filemelo.com"`. `/tool/merge`, `/tool/redact`,
  `/about`, `/sitemap.xml`, `/robots.txt` and
  `/fonts/NotoSansSC-Regular.otf` each return 200.
- Hosting is Cloudflare Pages, project `filemelo`, production branch `main`,
  deployed from `main` at `224f853` as a static export of `out/` (467 files,
  23 MB). Both custom domains are attached to the project; the apex shows
  **Active** with SSL enabled and `www` was still showing **Initializing** at
  the time of the check even though it already served 200.
- `wrangler.toml` and `npm run deploy` are committed, so the deploy target now
  lives in the repository rather than in one operator's shell history. CI still
  only gates quality; publishing is a deliberate `npm run deploy`, not an
  automatic consequence of merging.
- `pdffire.com` does not resolve. Nothing in the source references it any more.

### Why `error code: 1014` happened, for the record

The apex and `www` were proxied CNAMEs pointing at `filemelo.pages.dev`, but
**no Pages project named `filemelo` existed** — the account held only
`inspectdock` and `status-page`, and `filemelo.pages.dev` was NXDOMAIN. So the
diagnosis "a CNAME into another account's zone" was wrong in its cause though
right in its symptom: the target simply did not exist. The DNS records needed
no change at all. Creating the project and attaching the domains was the whole
fix, and the confirm step showed the existing and new records to be identical
for both hostnames.

`npx wrangler@4 pages project create filemelo --production-branch main` fails
on wrangler 4.156 by delegating to Workers; `--force` is required.

So: the code is integrated, gated, release-tested and **publicly live on
`filemelo.com`**. Nothing is submitted to a store or approved.

## Next phase

1. **Dodo Payments**: inspect the FileMelo business and products, then build
   accounts and entitlements against sandbox before any live offer.
2. **Extension**: load it unpacked and exercise it. Its runtime has never been
   tested, only its manifest and syntax.
3. **Mobile PR #1**: fix the genuine production dependency audit failure.
4. **Store packaging and submissions**, once the runtime above is exercised.

### Done since the last checkpoint

- The canonical host is `filemelo.com`, not the unresolvable `pdffire.com`, and
  `SITE_CONFIG` is FileMelo rather than PDFfire. Without this, repairing DNS
  would have served a site whose canonical links, sitemap and robots.txt all
  pointed at a dead domain.
- The Cloudflare Pages project `filemelo` now exists and serves the site on
  both custom domains. The earlier 1014 was a missing deploy target, not a
  broken DNS record, so no DNS record was changed.
