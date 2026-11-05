# Continuation checkpoint

Resume point for the FileMelo work. Update this after each verified milestone.

Last updated: 2026-11-05.


## Checkpoint — 5 November 2026

### Landed

**Mobile Unlock removes real passwords.** `pdfFire-app` #12 merged to main at
`3fff308`. The website's security handler is copied across — seven files, only
the import paths differ — rather than reimplemented. Unlock's password field
was being collected and discarded; it is now passed through. The Protect field
was prefilled with `password123`, harmless while Protect drew a banner and a
real hazard once it encrypts, so the default is empty.

**The cross-repository drift check is effective, not a skip.** It previously
ran in CI where no website checkout existed, so it skipped and reported
success — a green tick that verified nothing. CI now checks out the website
(it is public, so the default token suffices) at `main`, deliberately not at
the ported commit, which would make the comparison tautological.
`--require-source` makes an unreachable source a failure. The manifest also
records each local copy's own hash, so an edit made here is caught even with
no website available. All four paths were exercised, not just the passing one.

Verified in the CI log rather than inferred from a green tick:
`crypto-sync: 7 ported files match their recorded hashes and rebuild from
pdfFire at .../.website-for-crypto-check`, and `Tests 30 passed (30)` across
4 files. The `npm test` gate is on main.

**The crypto runs on real Hermes.** Galaxy Z Flip 5 (SM-F731U, Android 13,
arm64-v8a), Hermes 260318099.0.5, 6 of 6 checks passed, package
`com.filemelo.app`. `subtleCryptoPresent=false` is the line that matters: the
whole compatibility layer rests on Hermes having no WebCrypto, taken from
documentation until now and measured on the shipping engine here.

First device costs (debug build, so an upper bound): encrypt 2,907 ms for 3
pages, decrypt 965 ms, reject a wrong password 1,579 ms. The rejection is slow
because key derivation happens before the password is known to be wrong, so
the UI needs progress rather than appearing stalled. Details in
`pdfFire-app/docs/hermes-device-crypto-2026-11-05.md`.

### Also landed

- **`pdfFire` #30 — the five missing OCR languages.** The picker offered six
  and only English was committed, so every other choice failed at the moment
  of use. All five come from tessdata_fast, matching the English pack
  byte-for-byte in provenance; 9.4 MB total. Verified by recognising text, not
  by a 200: spa 95%, fra 94%, deu 95%, chi_sim 86%, jpn 92%, every expected
  term recovered. Recorded sizes were wrong by up to 4x (Chinese "~10 MB" is
  2.4 MB) and now carry exact bytes and a hash. Two tests make the original
  state unreachable.

- **`pdfFire` #33 — CJK PDFs rendered as `! " #`.** See below. #31, which
  only recorded the defect, was closed: two of its conclusions were wrong.

### Fixed: CJK PDFs rendered as `! " #`

Every CJK document carried an embedded font viewers could not use — MuPDF drew
nothing, CoreGraphics drew `! " #`, its fallback mapping glyph indices 1, 2, 3
onto ASCII. Two faults in `@pdf-lib/fontkit`, both answered by the shipped font
rather than by our code:

- **CFF outlines cannot be subset at all.** What `encodeStream()` produces is
  not a parseable font. Noto Sans SC was the only CFF font we shipped.
- **Short-format `loca` truncates odd offsets.** Offsets are stored halved, so
  a glyph with odd-length data leaves the next at an unrepresentable offset and
  everything after it reads from the wrong place. 15,684 of 31,036 glyphs had
  odd lengths — about half, which is why about half of any CJK document was
  destroyed.

`scripts/prepare-cjk-font.py` builds the pack with TrueType outlines and every
glyph padded to an even length, byte-reproducibly. Both engines now render
correctly; subsetted output is 4,571 bytes for three lines. Larger on disk
(10.6 MB vs 8.3 MB) and ~900 KB *smaller* gzipped, which is what users
download.

Nothing caught it because the ToUnicode CMap is written separately from the
outlines, so extraction kept returning the right characters and every test
asserted on extracted text. `font-subset-integrity.test.ts` decodes outlines
instead, and was confirmed to fail on the old font before being trusted on the
new one. Full account in `docs/cjk-subset-defect-2026-11-05.md`.

### Verified state of the world

- **Deployed 5 November**, `npm run deploy` from `main` at `f9ed3fa`,
  deployment `51d5d66a`, 229 of 485 files changed. Verified by byte size
  against the committed files rather than by status code:

  | asset | bytes | |
  |---|---|---|
  | `eng.traineddata` | 4,113,088 | matches |
  | `spa.traineddata` | 2,294,433 | matches |
  | `fra.traineddata` | 1,130,365 | matches |
  | `deu.traineddata` | 1,525,436 | matches |
  | `chi_sim.traineddata` | 2,469,156 | matches |
  | `jpn.traineddata` | 2,471,260 | matches |
  | `NotoSansSC-Regular.ttf` | 10,611,296 | matches |

  The live font was downloaded and re-checked, not just sized: TrueType
  outlines, 31,036 glyphs, **zero odd offsets**. The fixed font is what users
  get.

  `NotoSansSC-Regular.otf` briefly still answered 200 after the deploy. That
  was an edge-cache entry with a four-hour TTL — a cache-busted request and the
  deployment URL both return 404, and nothing references it any more.
- Archive `FileMelo-ClaudeCode-FULL-20261102-210332.zip` hashes to
  `7e6a95f4e3322fe6092e83784ac504807c8c9f755d47f0c29484354b5707b851`, matching
  the brief. Only one copy is on disk; no `(1).zip` alongside it.
- iPhone 17 Pro Max is paired and available (`061B21AD-B08B-5260-A640-82E9350B91B0`).
  The build still needs a FileMelo provisioning profile — an account action,
  and not a blocker for Android, which is why Android ran first.

### Next

1. Mobile Unicode and shaping — still unaddressed. The website's font packs
   are now known-good; mobile has no equivalent.
2. Redaction, forms, comparison and extraction remain relabelled, not
   implemented, on mobile.
3. Competitor pricing, then the paid chain: auth, checkout, entitlements,
   Teams.
4. Safari on Apple platforms and Firefox Android.
5. iOS provisioning profile, which is the only thing blocking device testing
   on the paired iPhone.

### Lessons that cost time today

- `&` inside a backgrounded command detaches it: the harness tracks the
  wrapper, which returns instantly and looks like a finished build.
- A test that asserts on extracted text cannot see a broken rendering. The
  CJK defect shipped because every check read the text layer, which stays
  correct while the glyph outlines are destroyed.
- A harness bug is as likely as a product bug. Three verdicts were wrong
  because of the harness, not the code: PyMuPDF's `insert_text` mapped CJK
  glyphs incorrectly, and a stream walker skipped every other stream because
  `at = end + 1` re-matches inside `endstream`. **Look at the artifact before
  trusting a measurement of it** — counting dark pixels said the CJK page had
  ink; looking at it showed the wrong characters.


## Checkpoint — 3 November 2026

**Deployed and live.** `npm run deploy` ran from `main` at `0053c75`;
deployment `5663c26e`, 232 files changed of 480. `/tesseract/worker.min.js`,
`/tesseract/lang/eng.traineddata` and the core wasm all return 200 from
`filemelo.com` with correct types. OCR no longer reaches a CDN — verified by
recognition, not reachability: the bundled engine reads "FILEMELO OCR 2026"
from a rendered page at 93% confidence with no network.

**Identifiers settled.** `com.filemelo.app` on both platforms
(`pdfFire-app` #10), chosen after checking that nothing was registered
anywhere. `expo prebuild` no longer invents `com.thethaitourism.filemelo`.
Reasoning and the namespace reservations are in `pdfFire-app`
`docs/app-identifiers.md`.

**History reconciled.** `docs/history-reconciliation.md` indexes the owner's
export — which turned out to be this session's own transcript, recovering the
FM-001…FM-013 ledger. All thirteen are closed. The consequential one: FM-011
and FM-012 mean **this repository already performs genuine AES-256 decryption
and RC4/AES-128 encryption**, so mobile's missing security tools are a porting
problem, not a research one.

### Blocked on something external

- **iOS device install** — the build reaches code signing and stops at
  "No profiles for 'com.filemelo.app' were found" (xcodebuild 65). No Apple ID
  is signed in to Xcode, so automatic signing cannot register the App ID, and
  the iPhone is in none of the installed profiles. Needs a sign-in on team
  `SU7HQP4GZA` or a portal registration of the App ID plus UDID
  `00008150-001579C21A84401C`.
- **Selling anything** — billing core, webhook and entitlement logic are built
  and tested, but there is no checkout, no accounts and no feature gating.
  Dodo approval unblocks one link of four.

### Next, in order of value

1. Port the website's real encryption, decryption and redaction to mobile.
   The implementations exist here; this is adaptation, not research.
2. Accounts, checkout and entitlement enforcement, so Pro can be sold.
3. Desktop installers and release metadata; Safari and Firefox Android.

### Operational notes worth keeping

- `expo run:ios --device` wants the **hardware UDID**, not the CoreDevice id
  `devicectl` prints.
- A debugging port can be taken by another session's browser. Check it is free
  and refuse to attach to any target that is not your own app — see the
  incident recorded in `history-reconciliation.md`.
- Deploys are manual and always were: CI gates quality, `npm run deploy`
  publishes. A merge is not a deployment.


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
  `/fonts/NotoSansSC-Regular.otf` each return 200. (That OTF was replaced on
  5 November by `NotoSansSC-Regular.ttf`; the OTF could not be subsetted, so
  CJK PDFs rendered as `! " #`. See `cjk-subset-defect-2026-11-05.md`.)
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
