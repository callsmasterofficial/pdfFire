import { PlanId, BillingInterval } from "../plans";

/**
 * Turning a provider event into the subscription state it implies.
 *
 * Kept separate from storage and from HTTP so the hard part — which event
 * wins — can be tested without a database or a request.
 */

export type SubscriptionStatus =
  | "active" | "trialing" | "past_due" | "paused"
  | "cancelled" | "expired" | "pending";

export type SubscriptionState = {
  readonly providerCustomerId: string;
  readonly providerProductId: string;
  readonly plan: PlanId;
  readonly interval: BillingInterval;
  readonly status: SubscriptionStatus;
  readonly quantity: number;
  readonly currentPeriodEnd: number | null;
  readonly cancelAt: number | null;
  /** The provider's own ordering for this record. */
  readonly providerUpdatedAt: number;
};

/** A paid plan is only granted by these. A checkout redirect is not an event. */
const ENTITLING: ReadonlySet<SubscriptionStatus> = new Set(["active", "trialing"]);

export function grantsAccess(state: Pick<SubscriptionState, "status">): boolean {
  return ENTITLING.has(state.status);
}

/**
 * Decides whether an incoming state should replace what is stored.
 *
 * Webhook delivery is not ordered. A renewal and a cancellation can arrive
 * backwards, and a retry of an old delivery can arrive days later. Taking the
 * newest *delivery* would then revoke a live subscription, so the provider's
 * own timestamp decides, and an equal timestamp loses — a redelivery of the
 * same event must not rewrite anything.
 */
export function shouldApply(
  stored: Pick<SubscriptionState, "providerUpdatedAt"> | null,
  incoming: Pick<SubscriptionState, "providerUpdatedAt">,
): boolean {
  if (!stored) return true;
  return incoming.providerUpdatedAt > stored.providerUpdatedAt;
}

export type ProviderEvent = {
  type: string;
  data: Record<string, unknown>;
};

export class UnmappedProductError extends Error {
  constructor(readonly productId: string) {
    super(`No FileMelo plan is mapped to product ${productId}`);
    this.name = "UnmappedProductError";
  }
}

/** Maps a provider product id onto a plan. Built from the environment at the
 *  edge, so an unknown product is rejected rather than guessed at. */
export type ProductMap = ReadonlyMap<string, { plan: PlanId; interval: BillingInterval }>;

const STATUS_BY_EVENT: Readonly<Record<string, SubscriptionStatus>> = {
  "subscription.active": "active",
  "subscription.renewed": "active",
  "subscription.plan_changed": "active",
  "subscription.on_hold": "past_due",
  "subscription.paused": "paused",
  "subscription.cancelled": "cancelled",
  "subscription.expired": "expired",
  "subscription.failed": "past_due",
};

function readNumber(source: Record<string, unknown>, key: string): number | null {
  const value = source[key];
  if (typeof value === "number" && Number.isFinite(value)) return Math.floor(value);
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) return Math.floor(parsed / 1000);
  }
  return null;
}

/**
 * Reads a subscription event. Returns null for events that are not about
 * subscription state (a payment succeeding does not by itself change what a
 * customer may do — the subscription event does).
 */
export function readSubscriptionEvent(
  event: ProviderEvent, products: ProductMap, receivedAt: number,
): SubscriptionState | null {
  const status = STATUS_BY_EVENT[event.type];
  if (!status) return null;

  const data = event.data;
  const productId = String(data.product_id ?? "");
  const customerId = String(
    (data.customer as Record<string, unknown> | undefined)?.customer_id ?? data.customer_id ?? "",
  );
  if (!productId || !customerId) {
    throw new Error(`${event.type} is missing product_id or customer_id`);
  }
  const mapped = products.get(productId);
  if (!mapped) throw new UnmappedProductError(productId);

  const quantity = typeof data.quantity === "number" && data.quantity > 0
    ? Math.floor(data.quantity) : 1;

  return {
    providerCustomerId: customerId,
    providerProductId: productId,
    plan: mapped.plan,
    interval: mapped.interval,
    status,
    quantity,
    currentPeriodEnd: readNumber(data, "next_billing_date") ?? readNumber(data, "current_period_end"),
    cancelAt: readNumber(data, "cancel_at_next_billing_date") ?? readNumber(data, "cancelled_at"),
    providerUpdatedAt: readNumber(data, "updated_at") ?? receivedAt,
  };
}
