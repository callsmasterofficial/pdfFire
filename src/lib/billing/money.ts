/**
 * Money handling for checkout amounts.
 *
 * Amounts are integer minor units throughout. A price is never a float: 0.1 +
 * 0.2 is not 0.3, and a payment authority cannot be built on that. Minor-unit
 * exponents vary by currency, so the exponent is looked up rather than assumed
 * to be 2.
 */

/** Currencies whose smallest unit is the unit itself (no decimal places). */
const ZERO_DECIMAL = new Set([
  "BIF", "CLP", "DJF", "GNF", "JPY", "KMF", "KRW", "MGA",
  "PYG", "RWF", "UGX", "VND", "VUV", "XAF", "XOF", "XPF",
]);

/** Currencies with three decimal places. */
const THREE_DECIMAL = new Set(["BHD", "IQD", "JOD", "KWD", "LYD", "OMR", "TND"]);

export type Money = {
  /** Integer minor units, e.g. 499 for USD 4.99 or 500 for JPY 500. */
  readonly amountMinor: number;
  /** ISO 4217 code, uppercase. */
  readonly currency: string;
};

export function minorUnitExponent(currency: string): number {
  const code = currency.toUpperCase();
  if (ZERO_DECIMAL.has(code)) return 0;
  if (THREE_DECIMAL.has(code)) return 3;
  return 2;
}

export function money(amountMinor: number, currency: string): Money {
  if (!Number.isInteger(amountMinor)) {
    throw new Error(`Amount must be integer minor units, got ${amountMinor}`);
  }
  if (!/^[A-Za-z]{3}$/.test(currency)) {
    throw new Error(`Not an ISO 4217 currency code: ${currency}`);
  }
  return { amountMinor, currency: currency.toUpperCase() };
}

/** Human-readable amount, for display only — never for arithmetic. */
export function formatMoney(value: Money, locale = "en-US"): string {
  const exponent = minorUnitExponent(value.currency);
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: value.currency,
    minimumFractionDigits: exponent,
    maximumFractionDigits: exponent,
  }).format(value.amountMinor / 10 ** exponent);
}

export function addMoney(a: Money, b: Money): Money {
  assertSameCurrency(a, b);
  return money(a.amountMinor + b.amountMinor, a.currency);
}

/** Multiplies by a whole quantity, such as a seat count. */
export function multiplyMoney(value: Money, quantity: number): Money {
  if (!Number.isInteger(quantity) || quantity < 0) {
    throw new Error(`Quantity must be a non-negative integer, got ${quantity}`);
  }
  return money(value.amountMinor * quantity, value.currency);
}

/**
 * Percentage saved by taking `annual` over twelve months of `monthly`,
 * rounded to the nearest whole percent. Returns 0 when the annual price is no
 * cheaper, so a comparison table can never advertise a negative "saving".
 */
export function annualSavingPercent(monthly: Money, annual: Money): number {
  assertSameCurrency(monthly, annual);
  const twelveMonths = monthly.amountMinor * 12;
  if (twelveMonths <= 0 || annual.amountMinor >= twelveMonths) return 0;
  return Math.round(((twelveMonths - annual.amountMinor) / twelveMonths) * 100);
}

function assertSameCurrency(a: Money, b: Money): void {
  if (a.currency !== b.currency) {
    throw new Error(`Currency mismatch: ${a.currency} vs ${b.currency}`);
  }
}
