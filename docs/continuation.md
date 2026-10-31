# Continuation checkpoint

Resume point for the FileMelo work. Update this after each verified milestone.

Last updated: 2026-10-31.

## Where the work is

Rebuilt from live GitHub state and git ancestry. Every version of this section
written on a branch is stale about whatever merged after it, so it is rebuilt
rather than merged.

Website `main` is `1c9984c`.

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
| #17, #18 | integration follow-ups |
| #19 | static export and the Cloudflare Pages target |
| #20 | FileMelo rename finished, pricing and the entitlement model |
| #21 | cross-repository checkpoint refresh |
| #22 | billing control plane and the infrastructure/AWS decision |

All website PRs #1 to #11 and the integration PRs #13 to #15 are merged. The
four converter migrations that #8 deferred are done in this change, so no
converter is left on the WinAnsi sanitiser.

Other repositories:

- `pdfFire-extension` `main` is `be90f99`; PRs #1, #2, #4 and #5 are merged.
  The tools are run by a 17-assertion smoke harness, and the extension is
  captured for real in Chrome, Edge, Opera and Firefox — installed, from its
  own origin, at each store's accepted screenshot size. Listings cover 55/55/30/1
  locales. See `store/README.md` there.
- `pdfFire-app` PR #1 is open and no longer draft. The production dependency
  audit that was failing now passes, and the app is renamed to FileMelo.

A merge is not a deployment, and a deployment is not a store submission. The
website **is** publicly live; nothing is submitted to a store or approved.

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

## Billing: built in code, blocked at the provider

The plan model, the entitlement table and the `/pricing` comparison are live.
The provider side is not, and the block is a specific one.

Dodo Payments, inspected 2026-10-31 in test mode, business **Callsmaster
Services LLP**:

- Personal, Business and Bank verification: **Approved**.
- Product Information: **On hold**. Dodo's own stated reason is that the
  website was not yet publicly accessible. That reason no longer holds —
  `filemelo.com` serves 200 — and the form says to email
  `support@dodopayments.com` for a re-review.
- No FileMelo products. The three products there are InspectDock's and were
  left untouched, per the brief's rule about not altering another brand's
  setup.
- No API keys. No webhook endpoints.

**What unblocks it:** the owner asking Dodo to re-review the product
information now that the site is live. That is a message sent on their behalf
to an external party, so it waits for them. Everything downstream — sandbox
products, checkout, the customer portal, webhooks — is configuration against
an account that is not yet cleared to carry FileMelo products, so it is not
work that can be usefully done first.

Meanwhile `isPurchasable()` returns false for every paid plan, because the
product ids are null, and `/pricing` says so plainly rather than offering a
checkout that would point at nothing.

## Next phase

1. **Dodo product information**: owner to request a re-review. Then create the
   four sandbox products, set `DODO_API_KEY` and `DODO_WEBHOOK_SECRET` as Pages
   secrets, create the D1 database, and set the `NEXT_PUBLIC_DODO_PRODUCT_*`
   ids **last** — `docs/billing-operations.md` has the commands and says why
   that order matters.
2. **Browser-store submissions.** The packs are complete in
   `pdfFire-extension/store/`: real screenshots per browser at each store's
   size, listings in each store's accepted locales, and per-store checklists.
   What remains is owner-only — category, licence, a support URL, and the
   uploads themselves. Edge accepts at most six screenshots per language; seven
   are captured, so trim before upload.
3. **Native store identifiers.** `pdfFire-app` has no `ios.bundleIdentifier`
   and no `android.package`, so neither store build is possible yet.
4. **Android device QA.** iOS is done: the app was built and run on an
   iPhone 15 Pro simulator on SDK 58, and JPG to PDF was exercised end to end
   — native photo picker, `expo-file-system/legacy`, `pdf-lib`, written to
   disk, output verified as a 1-page A4 PDF. Android has not been run.
5. **Native-language review** of the store copy. 55 locales are drafted and
   none is reviewed; every record says so in its own status field.

### Done since the last checkpoint

- The canonical host is `filemelo.com`, not the unresolvable `pdffire.com`, and
  `SITE_CONFIG` is FileMelo rather than PDFfire. Without this, repairing DNS
  would have served a site whose canonical links, sitemap and robots.txt all
  pointed at a dead domain.
- The Cloudflare Pages project `filemelo` now exists and serves the site on
  both custom domains. The earlier 1014 was a missing deploy target, not a
  broken DNS record, so no DNS record was changed.
- The rename is finished. 79 references to the old brand survived into the live
  site, two of them invisible to a text search because the wordmark is split
  across elements. The Open Graph card had the old name set in type and was
  regenerated.
- Pro and Teams exist as a priced, limited, tested plan model with the evidence
  in `docs/pricing-decision-log.md` — but no checkout, and the page says so.
- The extension's tools have been run rather than assumed to work, including a
  check that its metadata cleaner removes the XMP packet and not merely the
  Info dictionary.
- `pdfFire-app` passes its production audit, and its brand matches the product.
- The billing control plane exists and is tested, without a provider. Schema,
  webhook receiver, signature verification and entitlement resolution are
  written and covered by 43 synthetic tests; `isPurchasable()` is still false
  and `/pricing` still says purchase is not open.
- `docs/infrastructure-decision.md` answers the AWS question: no, with the
  Cloudflare limits it rests on and the conditions that would change it.
- The extension has been captured for real in all four target browsers, which
  found two runtime bugs that source review had not.
- `pdfFire-app` is on Expo SDK 58. The `zod` override is gone rather than
  carried forward, because `@expo/cli@58` dropped the dependency it existed
  for — which is what that repository's `docs/dependency-audit.md` said should
  happen. Twelve moderate advisories remain in Expo's build tooling and are
  left deliberately; pinning them would be a new override of the kind this
  change just retired.
- **Do not let `expo prebuild` choose the bundle identifier.** On this machine
  it invented `com.thethaitourism.filemelo`, from an unrelated project's
  namespace, on both prebuild runs. The value is permanent once it reaches App
  Store Connect.
- **A brand rename needs a rendered check, not a grep.** Three codebases have
  now hidden the old wordmark by splitting it across two elements — the
  website twice (`PDF<span>fire</span>`), and the mobile header
  (`<Text>pdf</Text><Text>Fire</Text>`). The brand name never appears as a
  single token, so no search finds it. Each was caught by looking at a
  screenshot.
- `pod install` needs a UTF-8 locale on this machine: CocoaPods 1.17 on Ruby
  4.0 throws `Unicode Normalization not appropriate for ASCII-8BIT` otherwise,
  and `expo run:ios` re-runs it, so the locale has to be set for the whole
  command.
