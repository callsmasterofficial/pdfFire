import { describe, it, expect } from "vitest";
import {
  groupSubscriptions,
  type SubscriptionRow,
} from "../load-subscriptions";
import { resolveEntitlement } from "../entitlement";

/**
 * The query returns a person's own subscription and those of every
 * organization they belong to, flattened. Getting the split wrong would either
 * hand a member their organization's plan when they have left it, or deny a
 * Teams seat to someone who never paid personally — the whole point of seats.
 */
const row = (over: Partial<SubscriptionRow> = {}): SubscriptionRow => ({
  provider_customer_id: "cus_1",
  provider_product_id: "prod_1",
  plan: "pro",
  interval: "monthly",
  status: "active",
  quantity: 1,
  current_period_end: Date.now() + 86_400_000,
  cancel_at: null,
  provider_updated_at: 1,
  scope: "personal",
  ...over,
});

describe("grouping an account's subscriptions", () => {
  it("gives free when there are none", () => {
    const resolved = resolveEntitlement(groupSubscriptions([]), Date.now());
    expect(resolved.plan).toBe("free");
    expect(resolved.reason).toBe("no active subscription");
  });

  it("reads a personal subscription", () => {
    const grouped = groupSubscriptions([row()]);
    expect(grouped.personal?.plan).toBe("pro");
    expect(grouped.organization).toEqual([]);
    expect(resolveEntitlement(grouped, Date.now()).plan).toBe("pro");
  });

  it("entitles a member through their organization alone", () => {
    const grouped = groupSubscriptions([
      row({ scope: "organization", plan: "teams", quantity: 5 }),
    ]);
    expect(grouped.personal).toBeNull();
    const resolved = resolveEntitlement(grouped, Date.now());
    expect(resolved.plan).toBe("teams");
    expect(resolved.seats).toBe(5);
  });

  it("prefers Teams over a personal Pro", () => {
    const grouped = groupSubscriptions([
      row({ scope: "personal", plan: "pro" }),
      row({ scope: "organization", plan: "teams", quantity: 3 }),
    ]);
    expect(resolveEntitlement(grouped, Date.now()).plan).toBe("teams");
  });

  it("does not entitle on an expired period", () => {
    const grouped = groupSubscriptions([
      row({ status: "cancelled", current_period_end: Date.now() - 1000 }),
    ]);
    expect(resolveEntitlement(grouped, Date.now()).plan).toBe("free");
  });

  it("still entitles a cancelled subscription inside its paid period", () => {
    const grouped = groupSubscriptions([
      row({ status: "cancelled", current_period_end: Date.now() + 60_000 }),
    ]);
    expect(resolveEntitlement(grouped, Date.now()).plan).toBe("pro");
  });
});
