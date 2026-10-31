# Billing operations

What exists, what is deliberately switched off, and the exact steps to turn it
on once Dodo clears the product-information hold.

Written 2026-10-31.

## State today

| Piece | State |
| --- | --- |
| Plan catalogue and limits | implemented, tested (`src/lib/billing/`) |
| `/pricing` comparison page | live, and says purchase is not open |
| Account / organization / seat schema | written, not deployed (`migrations/0001_accounts.sql`) |
| Webhook receiver | written, tested against synthetic deliveries (`functions/api/billing/webhook.ts`) |
| Entitlement resolution | written, tested (`src/lib/billing/server/entitlement.ts`) |
| D1 database | **not created** |
| Dodo products | **do not exist** |
| API key, webhook secret | **do not exist** |
| Checkout | not reachable; `isPurchasable()` is false for every paid plan |

The tests are **synthetic**. They sign fixtures with a test secret and verify
them with the same code the edge runs. That proves the verifier rejects
tampering, replay, a wrong secret and out-of-order delivery. It proves nothing
about Dodo's real payloads, and no real payment has been taken.

## The one external block

Dodo's Product Information form is **On hold**. Personal, business and bank
verification are all approved. The stated reason was that the website was not
publicly accessible; it now is. The owner will ask Dodo to re-review.

Everything above was written without that. What it blocks is specifically:
creating products, issuing an API key, and registering a webhook endpoint.

## Turning it on

### 1. Create the database

```bash
npx wrangler d1 create filemelo-accounts
```

Add the returned id to `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "filemelo-accounts"
database_id = "<id from the command above>"
```

Then apply the schema:

```bash
npx wrangler d1 migrations apply filemelo-accounts --remote
```

### 2. Create the products

Four, in **test mode first**, under the existing Callsmaster Services LLP
business. Do not touch the three InspectDock products.

| Product | Price | Recurrence |
| --- | --- | --- |
| FileMelo Pro Monthly | USD 4.99 | monthly |
| FileMelo Pro Annual | USD 39.99 | yearly |
| FileMelo Teams Monthly | USD 7.99 per seat | monthly, seat-based |
| FileMelo Teams Annual | USD 69.99 per seat | yearly, seat-based |

Check whether Dodo's seat-based billing counts the first seat in the base
price. If it does, the Teams quantity must exclude it or every organization is
charged for one seat twice.

### 3. Set the secrets

```bash
npx wrangler pages secret put DODO_API_KEY --project-name filemelo
npx wrangler pages secret put DODO_WEBHOOK_SECRET --project-name filemelo
```

Never as `NEXT_PUBLIC_*`. Those are inlined into the browser bundle, and a
leaked signing secret lets anyone forge an entitlement.

The four product ids are **not** secret and go in `wrangler.toml` as plain
variables: `DODO_PRODUCT_PRO_MONTHLY`, `DODO_PRODUCT_PRO_ANNUAL`,
`DODO_PRODUCT_TEAMS_MONTHLY`, `DODO_PRODUCT_TEAMS_ANNUAL`. The same ids also go
in the build environment as `NEXT_PUBLIC_DODO_PRODUCT_*`, which is what flips
`isPurchasable()` and makes `/pricing` show a real button. Setting those before
the server side works would put a live-looking checkout in front of a backend
that cannot honour it — set them last.

### 4. Register the webhook

Endpoint `https://filemelo.com/api/billing/webhook`. Subscribe to the
subscription lifecycle events the receiver maps:

`subscription.active`, `subscription.renewed`, `subscription.plan_changed`,
`subscription.on_hold`, `subscription.paused`, `subscription.cancelled`,
`subscription.expired`, `subscription.failed`.

An event type the receiver does not map is stored and ignored, not dropped, so
subscribing to more than this is safe. A product id it does not know is
recorded as an error on the event row rather than guessed at.

### 5. Verify before enabling live

- Send a test delivery; it should return 202 and leave a row in
  `webhook_events` with `processed_at` set.
- Replay the same delivery; it should return 200 `duplicate` and change nothing.
- Alter one byte of the body; it should return 400.
- Run a sandbox subscription through active, renewal, cancellation and
  expiry, and check the entitlement at each step.
- Confirm no secret appears in `out/`: `grep -ri dodo out/ | grep -v product`.

Only then switch to live keys, and only once the paid features actually work.

## Things that would be wrong to do

- Creating FileMelo products under the InspectDock brand to get around the
  hold.
- Treating a successful checkout redirect as proof of payment. The redirect is
  a navigation; the webhook is the fact.
- Shipping a placeholder product id so the UI looks finished. `null` is why
  `/pricing` is honest today.
- Re-serialising the webhook body before verifying it. The signature covers the
  bytes that arrived.
