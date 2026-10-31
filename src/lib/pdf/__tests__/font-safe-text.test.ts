import { describe, expect, it } from "vitest";
import { toFileSlug } from "../text/font-safe-text";

describe("toFileSlug", () => {
  it("keeps the document's own script", () => {
    expect(toFileSlug("Déjà Vu Rapport")).toBe("déjà-vu-rapport");
    expect(toFileSlug("予算 2026")).toBe("予算-2026");
  });

  it("falls back when nothing usable remains", () => {
    expect(toFileSlug("!!! ---", "spreadsheet")).toBe("spreadsheet");
  });
});
