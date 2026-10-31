import { Money, money } from "./money";

/**
 * The plan catalogue. Prices and limits are data, not scattered constants, so
 * changing a price is one edit here and never a search through the UI.
 *
 * The evidence behind these numbers is in docs/pricing-decision-log.md.
 *
 * `productId` is intentionally nullable. No FileMelo products exist in the
 * payment provider yet, and a placeholder string would let checkout appear to
 * work while pointing at nothing. A null id means "not purchasable yet", and
 * the UI must say so rather than opening a broken checkout.
 */

export type PlanId = "free" | "pro" | "teams";
export type BillingInterval = "monthly" | "annual";

export type PlanPrice = {
  readonly interval: BillingInterval;
  readonly price: Money;
  /** True when the price is charged once per seat rather than per account. */
  readonly perSeat: boolean;
  /** Provider product id, or null while the product does not exist yet. */
  readonly productId: string | null;
};

export type Plan = {
  readonly id: PlanId;
  readonly name: string;
  readonly summary: string;
  readonly prices: readonly PlanPrice[];
  /** Maximum seats, or null for a single-seat plan. */
  readonly maxSeats: number | null;
};

const USD = "USD";

/** Reads a provider product id from the environment, or null when unset. */
function productId(key: string): string | null {
  const value = process.env[key];
  return value && value.length > 0 ? value : null;
}

export const PLANS: Readonly<Record<PlanId, Plan>> = {
  free: {
    id: "free",
    name: "FileMelo Free",
    summary:
      "Every core tool, running in your browser. Documents stay on your device.",
    prices: [
      {
        interval: "monthly",
        price: money(0, USD),
        perSeat: false,
        productId: null,
      },
    ],
    maxSeats: null,
  },
  pro: {
    id: "pro",
    name: "FileMelo Pro",
    summary:
      "Batch workflows, saved presets, larger documents and the desktop builds.",
    prices: [
      {
        interval: "monthly",
        price: money(499, USD),
        perSeat: false,
        productId: productId("NEXT_PUBLIC_DODO_PRODUCT_PRO_MONTHLY"),
      },
      {
        interval: "annual",
        price: money(3999, USD),
        perSeat: false,
        productId: productId("NEXT_PUBLIC_DODO_PRODUCT_PRO_ANNUAL"),
      },
    ],
    maxSeats: null,
  },
  teams: {
    id: "teams",
    name: "FileMelo Teams",
    summary:
      "Everything in Pro for each member, plus shared presets and seat administration.",
    prices: [
      {
        interval: "monthly",
        price: money(799, USD),
        perSeat: true,
        productId: productId("NEXT_PUBLIC_DODO_PRODUCT_TEAMS_MONTHLY"),
      },
      {
        interval: "annual",
        price: money(6999, USD),
        perSeat: true,
        productId: productId("NEXT_PUBLIC_DODO_PRODUCT_TEAMS_ANNUAL"),
      },
    ],
    maxSeats: 250,
  },
};

export const PLAN_ORDER: readonly PlanId[] = ["free", "pro", "teams"];

export function getPlan(id: PlanId): Plan {
  return PLANS[id];
}

export function getPlanPrice(
  id: PlanId,
  interval: BillingInterval,
): PlanPrice | undefined {
  return PLANS[id].prices.find((p) => p.interval === interval);
}

/** True when the plan can actually be bought today. */
export function isPurchasable(id: PlanId, interval: BillingInterval): boolean {
  const price = getPlanPrice(id, interval);
  return price !== undefined && price.productId !== null;
}
