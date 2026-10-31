import { PlanId } from "@/lib/billing/plans";
import { entitlementsFor, Limit } from "@/lib/billing/entitlements";

/**
 * Turns the entitlement table into the lines a visitor reads, so the page and
 * the enforcement can never drift apart: change a limit in entitlements.ts and
 * this page changes with it.
 */

function cap(value: Limit, unit: string): string {
  return value === null ? `Unlimited ${unit}` : `${value} ${unit}`;
}

export function featuresFor(
  plan: PlanId,
): readonly { label: string; included: boolean }[] {
  const e = entitlementsFor(plan);
  return [
    { label: "All 37 tools, processed on your device", included: true },
    { label: "No document ever leaves your device", included: true },
    { label: cap(e.batchQueueSize, "files per batch"), included: true },
    { label: `Documents up to ${cap(e.maxFileSizeMb, "MB").replace("Unlimited MB", "any size")}`, included: true },
    { label: cap(e.savedPresets, "saved presets"), included: true },
    { label: cap(e.ocrLanguagePacks, "OCR language packs"), included: true },
    { label: "macOS and Windows desktop builds", included: e.desktopBuilds },
    { label: "Presets shared across your organization", included: e.sharedPresets },
    { label: "Seat administration and org consent records", included: e.seatAdministration },
  ];
}
