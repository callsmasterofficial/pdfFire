import { describe, it, expect } from "vitest";
import {
  money, formatMoney, multiplyMoney, addMoney,
  annualSavingPercent, minorUnitExponent,
} from "../money";
import {
  PLANS, PLAN_ORDER, getPlanPrice, isPurchasable,
} from "../plans";
import {
  entitlementsFor, can, limitFor, withinLimit,
} from "../entitlements";

describe("money", () => {
  it("knows which currencies are not two-decimal", () => {
    expect(minorUnitExponent("USD")).toBe(2);
    expect(minorUnitExponent("jpy")).toBe(0);
    expect(minorUnitExponent("KWD")).toBe(3);
  });

  it("formats each of those correctly", () => {
    expect(formatMoney(money(499, "USD"))).toBe("$4.99");
    expect(formatMoney(money(500, "JPY"), "en-US")).toBe("¥500");
    expect(formatMoney(money(4999, "KWD"), "en-US")).toContain("4.999");
  });

  it("refuses a fractional minor-unit amount", () => {
    expect(() => money(4.99, "USD")).toThrow(/integer minor units/);
  });

  it("refuses a currency code that is not three letters", () => {
    expect(() => money(100, "DOLLARS")).toThrow(/ISO 4217/);
  });

  it("adds without floating-point drift", () => {
    // 0.1 + 0.2 in floats is 0.30000000000000004; in minor units it is 30.
    const total = addMoney(money(10, "USD"), money(20, "USD"));
    expect(total.amountMinor).toBe(30);
  });

  it("refuses to add across currencies", () => {
    expect(() => addMoney(money(100, "USD"), money(100, "EUR")))
      .toThrow(/Currency mismatch/);
  });

  it("multiplies by a seat count", () => {
    expect(multiplyMoney(money(799, "USD"), 7).amountMinor).toBe(5593);
    expect(() => multiplyMoney(money(799, "USD"), 1.5)).toThrow();
  });

  it("reports an annual saving only when the annual price is cheaper", () => {
    expect(annualSavingPercent(money(499, "USD"), money(3999, "USD"))).toBe(33);
    // An annual price above twelve months must never advertise a saving.
    expect(annualSavingPercent(money(499, "USD"), money(9999, "USD"))).toBe(0);
    expect(annualSavingPercent(money(0, "USD"), money(0, "USD"))).toBe(0);
  });
});

describe("plans", () => {
  it("prices Pro and Teams as the decision log records", () => {
    expect(getPlanPrice("pro", "monthly")!.price.amountMinor).toBe(499);
    expect(getPlanPrice("pro", "annual")!.price.amountMinor).toBe(3999);
    expect(getPlanPrice("teams", "monthly")!.price.amountMinor).toBe(799);
    expect(getPlanPrice("teams", "annual")!.price.amountMinor).toBe(6999);
  });

  it("advertises the saving the decision log claims", () => {
    const pro = PLANS.pro;
    const monthly = pro.prices.find((p) => p.interval === "monthly")!.price;
    const annual = pro.prices.find((p) => p.interval === "annual")!.price;
    expect(annualSavingPercent(monthly, annual)).toBe(33);
  });

  it("charges Teams per seat and Pro per account", () => {
    expect(getPlanPrice("teams", "monthly")!.perSeat).toBe(true);
    expect(getPlanPrice("pro", "monthly")!.perSeat).toBe(false);
  });

  it("keeps Teams above Pro at both intervals", () => {
    for (const interval of ["monthly", "annual"] as const) {
      expect(getPlanPrice("teams", interval)!.price.amountMinor)
        .toBeGreaterThan(getPlanPrice("pro", interval)!.price.amountMinor);
    }
  });

  it("is not purchasable while no provider product exists", () => {
    // No FileMelo products have been created, so every paid plan must report
    // itself unbuyable rather than opening a checkout that points at nothing.
    expect(isPurchasable("pro", "monthly")).toBe(false);
    expect(isPurchasable("teams", "annual")).toBe(false);
  });

  it("orders the plans cheapest first", () => {
    expect(PLAN_ORDER).toEqual(["free", "pro", "teams"]);
  });
});

describe("entitlements", () => {
  it("leaves Free genuinely usable", () => {
    const free = entitlementsFor("free");
    expect(free.batchQueueSize).toBeGreaterThan(1);
    expect(free.maxFileSizeMb).toBeGreaterThanOrEqual(100);
    expect(free.savedPresets).toBeGreaterThan(0);
  });

  it("never gives a cheaper plan more than a dearer one", () => {
    const keys = ["batchQueueSize", "maxFileSizeMb", "savedPresets",
      "ocrLanguagePacks"] as const;
    for (const key of keys) {
      const free = limitFor("free", key);
      const pro = limitFor("pro", key);
      // null means uncapped, which is always at least as generous.
      if (pro !== null && free !== null) expect(pro).toBeGreaterThanOrEqual(free);
      expect(limitFor("teams", key)).toEqual(pro);
    }
  });

  it("gates only the capabilities each plan pays for", () => {
    expect(can("free", "desktopBuilds")).toBe(false);
    expect(can("pro", "desktopBuilds")).toBe(true);
    expect(can("pro", "seatAdministration")).toBe(false);
    expect(can("teams", "seatAdministration")).toBe(true);
    expect(can("teams", "sharedPresets")).toBe(true);
  });

  it("treats an uncapped limit as always within bounds", () => {
    expect(withinLimit("free", "batchQueueSize", 21)).toBe(false);
    expect(withinLimit("free", "batchQueueSize", 20)).toBe(true);
    expect(withinLimit("pro", "savedPresets", 10_000)).toBe(true);
  });
});
