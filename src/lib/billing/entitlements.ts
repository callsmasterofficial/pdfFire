import { PlanId } from "./plans";

/**
 * What each plan may actually do.
 *
 * Two rules shape this table. Free stays genuinely useful — no core tool is
 * taken away and no output is degraded to manufacture an upgrade. And every
 * limit is a number a caller reads, never an `if (plan === "pro")` buried in a
 * component, so a limit change cannot leave one screen behind.
 */

export type EntitlementKey =
  | "batchQueueSize"
  | "maxFileSizeMb"
  | "savedPresets"
  | "ocrLanguagePacks"
  | "desktopBuilds"
  | "sharedPresets"
  | "seatAdministration";

/** A numeric cap, or null for "no cap". */
export type Limit = number | null;

export type Entitlements = {
  readonly batchQueueSize: Limit;
  readonly maxFileSizeMb: Limit;
  readonly savedPresets: Limit;
  readonly ocrLanguagePacks: Limit;
  readonly desktopBuilds: boolean;
  readonly sharedPresets: boolean;
  readonly seatAdministration: boolean;
};

const FREE: Entitlements = {
  batchQueueSize: 20,
  maxFileSizeMb: 100,
  savedPresets: 3,
  ocrLanguagePacks: 2,
  desktopBuilds: false,
  sharedPresets: false,
  seatAdministration: false,
};

const PRO: Entitlements = {
  batchQueueSize: 500,
  maxFileSizeMb: 1024,
  savedPresets: null,
  ocrLanguagePacks: null,
  desktopBuilds: true,
  sharedPresets: false,
  seatAdministration: false,
};

const TEAMS: Entitlements = {
  ...PRO,
  sharedPresets: true,
  seatAdministration: true,
};

const BY_PLAN: Readonly<Record<PlanId, Entitlements>> = {
  free: FREE,
  pro: PRO,
  teams: TEAMS,
};

export function entitlementsFor(plan: PlanId): Entitlements {
  return BY_PLAN[plan];
}

/** True when the plan has the named boolean capability. */
export function can(
  plan: PlanId,
  key: "desktopBuilds" | "sharedPresets" | "seatAdministration",
): boolean {
  return BY_PLAN[plan][key];
}

/** The cap for a numeric entitlement, or null when uncapped. */
export function limitFor(
  plan: PlanId,
  key: "batchQueueSize" | "maxFileSizeMb" | "savedPresets" | "ocrLanguagePacks",
): Limit {
  return BY_PLAN[plan][key];
}

/** True when `requested` fits inside the plan's cap for `key`. */
export function withinLimit(
  plan: PlanId,
  key: "batchQueueSize" | "maxFileSizeMb" | "savedPresets" | "ocrLanguagePacks",
  requested: number,
): boolean {
  const cap = limitFor(plan, key);
  return cap === null || requested <= cap;
}
