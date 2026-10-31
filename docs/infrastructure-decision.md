# Infrastructure decision: does FileMelo need AWS?

**No.** Not now, and nothing in the current product points at it. This records
what that conclusion rests on, so it can be re-tested rather than re-argued.

Written 2026-10-31. Figures checked against provider documentation on that date;
re-check before relying on them, because quotas change.

## 1. What the current hosting already supports

`filemelo.com`, `www.filemelo.com` and `filemelo.pages.dev` are served by
Cloudflare Pages project `filemelo` as a static export — 467 files, 23 MB,
deployed from `main`. Static asset requests on Pages are unmetered, including
the 9.1 MB of self-hosted Noto fonts, of which the 8.3 MB Simplified Chinese
pack is fetched only when a document needs it.

Every document operation runs in the visitor's browser. That is the product's
central claim and also the reason the hosting bill is what it is: there is no
conversion server, no document storage, and no per-page cloud OCR. A thousand
merges cost the same as none.

So the free tier is not a temporary arrangement we are hiding inside. For the
free tools it is a correct fit for the architecture.

**What it cannot do.** A static export has no trusted server. There is nowhere
to keep a Dodo API key, nowhere to verify a webhook signature, and no way to
decide whether a given person has paid. Those are the only capabilities the
product is missing, and they are small.

## 2. What actually needs a server, and why client code cannot replace it

| Capability | Why it cannot be client-side |
| --- | --- |
| Checkout creation | The price and product must be chosen by something the customer cannot edit. A client that posts its own price is a discount generator. |
| Webhook receipt | The provider signs over the raw request body with a shared secret. Putting that secret in a page publishes it. |
| Entitlement record | "Has this person paid" has to survive a cleared browser and be the same answer on a second device. |
| Organizations and seats | Seat counts are shared state between people. There is no client-only version of shared state. |
| Consent and audit records | They have to be readable later by someone other than the person who created them. |

That is the whole list. It is a control plane measured in hundreds of rows, not
a document pipeline.

## 3. The lowest-cost deployment that does it

Cloudflare Pages Functions, in the project that already exists, with D1 for
storage. No new provider, no new account, no new bill.

Free-plan headroom, from Cloudflare's own limits pages:

| Limit | Free plan | What FileMelo would use |
| --- | --- | --- |
| Function requests | 100,000 / day | checkout creation, webhook delivery, entitlement checks — a few per paying customer per day |
| CPU time | 10 ms per request | HMAC verification and a D1 write; the expensive work is the network wait, which is not counted |
| Memory | 128 MB per isolate | far beyond a JSON request |
| D1 rows read | 5,000,000 / day | an entitlement lookup is one indexed row |
| D1 rows written | 100,000 / day | a webhook event and a subscription update |
| D1 storage | 5 GB | an account row is bytes; 5 GB is more accounts than this product will have for a long time |
| Cron Triggers | 5 per account | one, for reconciliation against provider state |

The binding constraint is **10 ms of CPU per request**, and it is worth naming
rather than glossing: it rules out doing anything computational in a handler.
Signature verification and a database write fit comfortably; generating a PDF
server-side would not. That is consistent with the architecture anyway —
documents never reach the server.

**SDK compatibility, checked rather than assumed.** `dodopayments@2.59.0` has
exactly one dependency, `standardwebhooks@1.1.1`, which itself depends only on
`fast-sha256` and `@stablelib/base64`. Both are pure JavaScript with no Node
built-ins, so webhook verification runs on the Workers runtime. The verification
in this repository does not use the SDK at all — it uses WebCrypto directly, so
there is nothing to be compatible with.

**What this costs.** Nothing, at this scale. If the free tier is exceeded, the
Workers Paid plan is $5/month and includes 25 billion D1 row reads and 50
million writes per month. That is the entire upgrade path, and it is a decision
for a day when there are enough paying customers to have caused it.

## 4. Is AWS necessary?

No. No capability in sections 2 or 3 is missing from the existing provider, and
the one hard limit — 10 ms CPU — is not reached by a control plane that stores
rows and verifies signatures.

To be concrete about what would change the answer. AWS, or any other
always-on host, becomes worth proposing when one of these is measured, not
anticipated:

- A feature genuinely requires server-side document processing — for example
  OCR too heavy for a phone, offered as an explicit opt-in upload. That breaks
  the privacy claim, so it is a product decision before it is an infrastructure
  one, and the smallest form would be a single container, not a fleet.
- Sustained traffic puts function invocations past the paid plan's included
  amounts by enough that per-request pricing loses to a reserved instance.
- A customer contract requires data residency Cloudflare cannot satisfy.

None of these is true today. If one becomes true, the answer should name the
specific service, the region, the monthly and per-usage cost, where the data
sits, who operates it, and the no-AWS alternative it was chosen over.

**The PDF workload is not a reason.** It never touches a server. Neither is
familiarity with AWS, and neither is an existing instance belonging to another
project — reusing one would mix this product's billing records into another
system's blast radius, which is a worse outcome than a second $5 bill.

## 5. What this needs from the owner

Nothing to buy. Two things to do, when the time comes:

1. Create the D1 database and bind it to the Pages project. Free, one command,
   recorded in `docs/billing-operations.md`.
2. Set the Dodo API key and webhook signing secret as Pages secrets, not as
   `NEXT_PUBLIC_` variables. They must never reach the bundle.

Until the Dodo product-information hold clears, neither secret exists yet, and
the code is written and tested against synthetic fixtures in the meantime.
