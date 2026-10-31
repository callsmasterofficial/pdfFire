import { describe, it, expect } from "vitest";
import {
  verifyWebhook, signWebhook, readWebhookHeaders,
} from "../webhook-signature";
import {
  readSubscriptionEvent, shouldApply, grantsAccess, UnmappedProductError,
  type ProductMap, type SubscriptionState,
} from "../webhook-state";
import { resolveEntitlement, entitlesAt, seatsExceeded } from "../entitlement";

const SECRET = "whsec_" + btoa("a-test-signing-secret-not-a-real-one");
const PRODUCTS: ProductMap = new Map([
  ["pdt_pro_monthly", { plan: "pro", interval: "monthly" }],
  ["pdt_pro_annual", { plan: "pro", interval: "annual" }],
  ["pdt_teams_monthly", { plan: "teams", interval: "monthly" }],
]);

async function delivery(body: unknown, opts: { id?: string; timestamp?: number; secret?: string } = {}) {
  const raw = JSON.stringify(body);
  const id = opts.id ?? "evt_" + Math.random().toString(36).slice(2);
  const timestamp = opts.timestamp ?? Math.floor(Date.now() / 1000);
  const signature = await signWebhook(raw, id, timestamp, opts.secret ?? SECRET);
  return { raw, headers: { id, timestamp: String(timestamp), signature } };
}

const subscriptionEvent = (over: Record<string, unknown> = {}) => ({
  type: "subscription.active",
  data: {
    product_id: "pdt_pro_monthly",
    customer: { customer_id: "cus_1" },
    quantity: 1,
    next_billing_date: 2_000_000_000,
    updated_at: 1_700_000_000,
    ...over,
  },
});

describe("webhook signature", () => {
  it("accepts a correctly signed delivery", async () => {
    const d = await delivery(subscriptionEvent());
    expect((await verifyWebhook(d.raw, d.headers, SECRET)).ok).toBe(true);
  });

  it("rejects a tampered body even by one field", async () => {
    const d = await delivery(subscriptionEvent());
    const tampered = d.raw.replace("cus_1", "cus_2");
    expect(tampered).not.toBe(d.raw);
    expect(await verifyWebhook(tampered, d.headers, SECRET))
      .toEqual({ ok: false, reason: "no-matching-signature" });
  });

  it("rejects a signature made with a different secret", async () => {
    const d = await delivery(subscriptionEvent(), { secret: "whsec_" + btoa("someone-elses-secret") });
    expect(await verifyWebhook(d.raw, d.headers, SECRET))
      .toEqual({ ok: false, reason: "no-matching-signature" });
  });

  it("rejects a replay from outside the tolerance window", async () => {
    const now = Math.floor(Date.now() / 1000);
    const d = await delivery(subscriptionEvent(), { timestamp: now - 3600 });
    expect(await verifyWebhook(d.raw, d.headers, SECRET, now))
      .toEqual({ ok: false, reason: "timestamp-outside-tolerance" });
  });

  it("rejects a future timestamp too, not only an old one", async () => {
    const now = Math.floor(Date.now() / 1000);
    const d = await delivery(subscriptionEvent(), { timestamp: now + 3600 });
    expect(await verifyWebhook(d.raw, d.headers, SECRET, now))
      .toEqual({ ok: false, reason: "timestamp-outside-tolerance" });
  });

  it("will not verify a delivery missing any required header", async () => {
    const d = await delivery(subscriptionEvent());
    for (const drop of ["id", "timestamp", "signature"] as const) {
      expect(await verifyWebhook(d.raw, { ...d.headers, [drop]: null }, SECRET))
        .toEqual({ ok: false, reason: "missing-headers" });
    }
  });

  it("accepts any one of several signatures, so a secret can be rotated", async () => {
    const d = await delivery(subscriptionEvent());
    const stale = await signWebhook(d.raw, d.headers.id, Number(d.headers.timestamp),
      "whsec_" + btoa("the-previous-secret"));
    expect((await verifyWebhook(d.raw, { ...d.headers, signature: `${stale} ${d.headers.signature}` }, SECRET)).ok)
      .toBe(true);
  });

  it("reads either the webhook- or svix- header spelling", () => {
    expect(readWebhookHeaders(new Headers({
      "svix-id": "a", "svix-timestamp": "1", "svix-signature": "v1,x",
    }))).toEqual({ id: "a", timestamp: "1", signature: "v1,x" });
    expect(readWebhookHeaders(new Headers({
      "webhook-id": "b", "webhook-timestamp": "2", "webhook-signature": "v1,y",
    }))).toEqual({ id: "b", timestamp: "2", signature: "v1,y" });
  });

  it("refuses a secret that is not base64 instead of treating it as bytes", async () => {
    const d = await delivery(subscriptionEvent());
    expect(await verifyWebhook(d.raw, d.headers, "whsec_!!!not base64!!!"))
      .toEqual({ ok: false, reason: "bad-secret" });
  });
});

describe("event mapping", () => {
  it("maps each lifecycle event to the status it implies", () => {
    const cases: Record<string, string> = {
      "subscription.active": "active",
      "subscription.renewed": "active",
      "subscription.on_hold": "past_due",
      "subscription.paused": "paused",
      "subscription.cancelled": "cancelled",
      "subscription.expired": "expired",
      "subscription.failed": "past_due",
    };
    for (const [type, status] of Object.entries(cases)) {
      expect(readSubscriptionEvent({ ...subscriptionEvent(), type }, PRODUCTS, 0)?.status, type)
        .toBe(status);
    }
  });

  it("ignores events that are not about subscription state", () => {
    expect(readSubscriptionEvent({ type: "payment.succeeded", data: {} }, PRODUCTS, 0)).toBeNull();
  });

  it("refuses a product it has no mapping for", () => {
    expect(() => readSubscriptionEvent(subscriptionEvent({ product_id: "pdt_not_ours" }), PRODUCTS, 0))
      .toThrow(UnmappedProductError);
  });

  it("carries the seat quantity for Teams", () => {
    const state = readSubscriptionEvent(
      subscriptionEvent({ product_id: "pdt_teams_monthly", quantity: 12 }), PRODUCTS, 0)!;
    expect(state.plan).toBe("teams");
    expect(state.quantity).toBe(12);
  });

  it("falls back to receipt time when the provider sends no updated_at", () => {
    expect(readSubscriptionEvent(subscriptionEvent({ updated_at: undefined }), PRODUCTS, 1234)!
      .providerUpdatedAt).toBe(1234);
  });

  it("only treats active and trialing as entitling", () => {
    expect(grantsAccess({ status: "active" })).toBe(true);
    expect(grantsAccess({ status: "trialing" })).toBe(true);
    for (const status of ["past_due", "paused", "cancelled", "expired", "pending"] as const) {
      expect(grantsAccess({ status })).toBe(false);
    }
  });
});

describe("out-of-order delivery", () => {
  const at = (providerUpdatedAt: number) => ({ providerUpdatedAt });
  it("applies a newer provider state", () => expect(shouldApply(at(100), at(200))).toBe(true));
  it("ignores an older one, so a late cancellation cannot revoke a renewal",
    () => expect(shouldApply(at(200), at(100))).toBe(false));
  it("ignores a redelivery of the same state", () => expect(shouldApply(at(200), at(200))).toBe(false));
  it("applies the first state it ever sees", () => expect(shouldApply(null, at(1))).toBe(true));
});

describe("entitlement resolution", () => {
  const sub = (over: Partial<SubscriptionState> = {}): SubscriptionState => ({
    providerCustomerId: "cus_1", providerProductId: "pdt_pro_monthly",
    plan: "pro", interval: "monthly", status: "active", quantity: 1,
    currentPeriodEnd: 2000, cancelAt: null, providerUpdatedAt: 1, ...over,
  });

  it("gives Free when nothing is active", () => {
    const r = resolveEntitlement({ personal: null, organization: [] }, 1000);
    expect(r.plan).toBe("free");
    expect(r.entitlements.desktopBuilds).toBe(false);
  });

  it("gives Pro for an active personal subscription", () => {
    const r = resolveEntitlement({ personal: sub(), organization: [] }, 1000);
    expect(r.plan).toBe("pro");
    expect(r.entitlements.savedPresets).toBeNull();
  });

  it("prefers Teams over Pro when someone has both", () => {
    const r = resolveEntitlement({
      personal: sub(), organization: [sub({ plan: "teams", quantity: 9 })],
    }, 1000);
    expect(r.plan).toBe("teams");
    expect(r.seats).toBe(9);
    expect(r.entitlements.seatAdministration).toBe(true);
  });

  it("keeps a cancelled subscription until the period it paid for ends", () => {
    const cancelled = sub({ status: "cancelled", currentPeriodEnd: 2000 });
    expect(entitlesAt(cancelled, 1999)).toBe(true);
    expect(entitlesAt(cancelled, 2000)).toBe(false);
    expect(resolveEntitlement({ personal: cancelled, organization: [] }, 1999).plan).toBe("pro");
    expect(resolveEntitlement({ personal: cancelled, organization: [] }, 2001).plan).toBe("free");
  });

  it("does not entitle on past_due", () => {
    expect(entitlesAt(sub({ status: "past_due" }), 1000)).toBe(false);
  });

  it("knows when an organization has more members than paid seats", () => {
    expect(seatsExceeded(5, 5)).toBe(false);
    expect(seatsExceeded(5, 6)).toBe(true);
  });
});
