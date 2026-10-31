import { PlanId } from "../plans";
import { Entitlements, entitlementsFor } from "../entitlements";
import { SubscriptionState, grantsAccess } from "./webhook-state";

/**
 * Resolving what a person may actually do.
 *
 * The client already has the same entitlement table, and that is fine: it
 * decides what the UI offers, not what has been paid for. This resolves the
 * question on the server from stored subscription state, which is the only
 * answer that survives a cleared browser or a second device.
 */

export type Resolved = {
  readonly plan: PlanId;
  readonly entitlements: Entitlements;
  /** Why this plan, in words a support reply can quote. */
  readonly reason: string;
  /** When the client should ask again. */
  readonly expiresAt: number | null;
  readonly seats: number;
};

export type AccountSubscriptions = {
  /** The person's own subscription, if any. */
  readonly personal: SubscriptionState | null;
  /** Subscriptions of organizations they are a member of. */
  readonly organization: readonly SubscriptionState[];
};

const FREE: Omit<Resolved, "reason"> = {
  plan: "free",
  entitlements: entitlementsFor("free"),
  expiresAt: null,
  seats: 1,
};

/**
 * Teams beats Pro, Pro beats Free, and an expired anything beats nothing.
 *
 * A cancelled subscription still entitles until its period ends — the customer
 * paid for that period. Revoking at the moment of cancellation would be taking
 * back time already bought, which is the kind of thing that generates refunds.
 */
export function resolveEntitlement(
  subscriptions: AccountSubscriptions, now: number,
): Resolved {
  const live = [
    ...(subscriptions.personal ? [subscriptions.personal] : []),
    ...subscriptions.organization,
  ].filter((s) => entitlesAt(s, now));

  if (live.length === 0) return { ...FREE, reason: "no active subscription" };

  const teams = live.find((s) => s.plan === "teams");
  if (teams) {
    return {
      plan: "teams",
      entitlements: entitlementsFor("teams"),
      reason: `organization subscription is ${teams.status}`,
      expiresAt: teams.currentPeriodEnd,
      seats: teams.quantity,
    };
  }
  const pro = live[0];
  return {
    plan: "pro",
    entitlements: entitlementsFor("pro"),
    reason: `subscription is ${pro.status}`,
    expiresAt: pro.currentPeriodEnd,
    seats: 1,
  };
}

/** True when this subscription grants access at `now`. */
export function entitlesAt(state: SubscriptionState, now: number): boolean {
  if (grantsAccess(state)) return true;
  // Cancelled but paid through the end of the period.
  if (state.status === "cancelled" && state.currentPeriodEnd !== null) {
    return now < state.currentPeriodEnd;
  }
  return false;
}

/** True when a Teams organization has more members than it has paid seats. */
export function seatsExceeded(seatsPaid: number, memberCount: number): boolean {
  return memberCount > seatsPaid;
}
