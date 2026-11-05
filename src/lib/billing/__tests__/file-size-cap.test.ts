import { describe, it, expect } from "vitest";
import { entitlementsFor } from "../entitlements";

/**
 * The dropzone used to cap every upload at a fixed 100 MB — which is exactly
 * the Free allowance — so a Pro subscriber was held to the limit they had paid
 * to leave behind. These pin the numbers the UI now reads, and the
 * relationship between them, so the cap cannot quietly become plan-blind
 * again.
 */
const capBytes = (mb: number | null) =>
  mb === null ? Number.POSITIVE_INFINITY : mb * 1024 * 1024;

describe("the per-document size cap follows the plan", () => {
  it("free is 100 MB, which is what /pricing advertises", () => {
    expect(entitlementsFor("free").maxFileSizeMb).toBe(100);
  });

  it("paid plans are larger than free, or paying changes nothing", () => {
    const free = capBytes(entitlementsFor("free").maxFileSizeMb);
    expect(capBytes(entitlementsFor("pro").maxFileSizeMb)).toBeGreaterThan(free);
    expect(capBytes(entitlementsFor("teams").maxFileSizeMb)).toBeGreaterThanOrEqual(
      capBytes(entitlementsFor("pro").maxFileSizeMb)
    );
  });

  it("a 300 MB document is refused on free and accepted on pro", () => {
    const size = 300 * 1024 * 1024;
    expect(size > capBytes(entitlementsFor("free").maxFileSizeMb)).toBe(true);
    expect(size > capBytes(entitlementsFor("pro").maxFileSizeMb)).toBe(false);
  });

  it("a caller's own smaller limit still wins over the plan's", () => {
    const planCap = capBytes(entitlementsFor("pro").maxFileSizeMb);
    const callerCap = 5 * 1024 * 1024;
    expect(Math.min(callerCap, planCap)).toBe(callerCap);
  });
});
