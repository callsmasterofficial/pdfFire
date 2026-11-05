/**
 * Reads an account's subscriptions out of D1, ready for `resolveEntitlement`.
 *
 * Both the person's own subscription and those of every organization they
 * belong to, because a Teams seat entitles a member who never paid anything
 * themselves.
 *
 * Shaped as a plain query so it can be tested against a real database rather
 * than a mock of one.
 */
import type { SubscriptionState } from "./webhook-state";
import type { AccountSubscriptions } from "./entitlement";
import type { BillingInterval, PlanId } from "../plans";

export interface SubscriptionRow {
  provider_customer_id: string;
  provider_product_id: string;
  plan: string;
  interval: string;
  status: string;
  quantity: number;
  current_period_end: number | null;
  cancel_at: number | null;
  provider_updated_at: number;
  scope: "personal" | "organization";
}

export const ACCOUNT_SUBSCRIPTIONS_SQL = `
  SELECT provider_customer_id, provider_product_id, plan, interval, status,
         quantity, current_period_end, cancel_at, provider_updated_at,
         'personal' AS scope
    FROM subscriptions
   WHERE account_id = ?1
  UNION ALL
  SELECT s.provider_customer_id, s.provider_product_id, s.plan, s.interval,
         s.status, s.quantity, s.current_period_end, s.cancel_at,
         s.provider_updated_at, 'organization' AS scope
    FROM subscriptions s
    JOIN memberships m ON m.organization_id = s.organization_id
   WHERE m.account_id = ?1
`;

function toState(row: SubscriptionRow): SubscriptionState {
  return {
    providerCustomerId: row.provider_customer_id,
    providerProductId: row.provider_product_id,
    plan: row.plan as PlanId,
    interval: row.interval as BillingInterval,
    status: row.status as SubscriptionState["status"],
    quantity: row.quantity,
    currentPeriodEnd: row.current_period_end,
    cancelAt: row.cancel_at,
    providerUpdatedAt: row.provider_updated_at,
  };
}

/** Splits the rows the query returns into the shape the resolver expects. */
export function groupSubscriptions(rows: readonly SubscriptionRow[]): AccountSubscriptions {
  const personal = rows.find((r) => r.scope === "personal");
  return {
    personal: personal ? toState(personal) : null,
    organization: rows.filter((r) => r.scope === "organization").map(toState),
  };
}
