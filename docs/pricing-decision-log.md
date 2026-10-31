# Pricing decision log

Launch pricing for FileMelo Pro and FileMelo Teams, with the evidence it rests
on. Prices live in `src/lib/billing/plans.ts` and are configurable; this file
records *why* those numbers were chosen so a later change is a decision rather
than a guess.

Researched 2026-10-31.

## Competitor evidence

Figures are what each source states for an individual paid plan, converted to a
monthly-equivalent where the plan is billed annually. Third-party aggregators
disagree with each other, so a vendor's own page is preferred and the
aggregator range is kept where it is all that exists.

| Product | Monthly | Annual, per month | Team / org | Source |
| --- | --- | --- | --- | --- |
| iLovePDF Premium | $9.00 | ~$5.00 ($60/yr) | Business: custom, ~$15/seat | ilovepdf.com/pricing, aggregators |
| iLovePDF Premium (IN storefront) | ₹500 | ₹242 (₹2,900/yr) | — | ilovepdf.com/pricing, fetched from an IN exit |
| Smallpdf Pro | ~$15.00 | ~$9–10 | Teams ~$12/seat monthly, ~$8/seat annual | aggregators |
| Sejda | $7.50 web monthly | ~$5.25 ($63/yr desktop+web) | — | aggregators |
| PDF24 | free | free | — | vendor positioning |
| Stirling PDF | free, self-hosted | free | — | open source |

Two things stand out. The paid middle of this market sits between $5 and $9 a
month at annual billing, and the credible free competitors (PDF24, Stirling)
are the ones that process locally or on your own hardware — which is FileMelo's
own position, so "free and private" is table stakes here, not a differentiator
to charge for.

## What FileMelo actually costs to run

Documents are processed in the browser. The marginal cost of a Pro user
running a thousand merges is zero: no conversion server, no document storage,
no per-page cloud OCR. What the paid tiers cost us is static bandwidth on
Cloudflare Pages (free tier today), bounded account/entitlement endpoints, and
payment-provider fees.

That changes what a defensible price looks like. We are not recovering a
per-document cost, so the price has to be justified by capability — batch
workflows, saved presets, larger tested workloads, desktop builds, and
organization management — not by a usage meter we invented.

## Chosen launch prices

| Plan | Monthly | Annual | Annual per month | Saving |
| --- | --- | --- | --- | --- |
| Free | $0 | $0 | — | — |
| Pro | $4.99 | $39.99 | $3.33 | 33% |
| Teams | $7.99 per seat | $69.99 per seat | $5.83 | 27% |

Reasoning:

- **Pro at $4.99** undercuts iLovePDF's $9 monthly and Smallpdf's ~$15 while
  sitting above the $0 of the local-processing competitors. It is a price a
  single person pays without a procurement conversation.
- **The annual saving is real and stated honestly.** $39.99 is 33% off twelve
  months at $4.99 ($59.88). No struck-through "was" price that never existed.
- **Teams at $7.99 per seat** is below Smallpdf's $12 per seat monthly, and the
  premium over Pro buys organization management — shared presets, seat
  administration, and org-level consent records — not a feature taken away
  from Pro.
- **No lifetime tier at launch.** A lifetime price on a product with ongoing
  engine, font and platform maintenance is a promise we would have to break.

### Deliberately not decided here

- **Store prices.** iOS and Google Play prices come from each store's localized
  product tiers, after its commission, not from converting these numbers at a
  spot rate. They are set when those listings are created.
- **Regional pricing.** iLovePDF's Indian storefront is roughly 40% below its
  USD price, so a single global price leaves money on the table in some markets
  and prices us out of others. Adaptive currency is a provider capability to
  verify against the account before promising it, not a conversion to hardcode.

## Provider state at the time of this decision

Checked in the Dodo Payments dashboard on 2026-10-31, test mode, business
Callsmaster Services LLP:

- Personal, Business and Bank verification are **Approved**.
- **Product Information is On hold**, with Dodo's stated reason being that the
  website was not yet publicly accessible. That is no longer true as of this
  date; `filemelo.com` serves 200. Clearing the hold needs the owner to contact
  `support@dodopayments.com` for a re-review.
- There are no FileMelo products. The three existing products belong to
  InspectDock and are left untouched.
- There are no API keys and no webhook endpoints.

So FileMelo billing is **not live and not sandbox-configured**; what exists so
far is the plan model in code, which is deliberately independent of the
provider.
