import React from "react";
import { Check, Minus } from "lucide-react";
import { Plan, BillingInterval, getPlanPrice, isPurchasable } from "@/lib/billing/plans";
import { formatMoney, annualSavingPercent } from "@/lib/billing/money";

type PlanCardProps = {
  plan: Plan;
  interval: BillingInterval;
  highlight?: boolean;
  features: readonly { label: string; included: boolean }[];
};

export function PlanCard({ plan, interval, highlight, features }: PlanCardProps) {
  // Free has no annual price; fall back to its single entry.
  const price = getPlanPrice(plan.id, interval) ?? plan.prices[0];
  const monthly = getPlanPrice(plan.id, "monthly");
  const annual = getPlanPrice(plan.id, "annual");
  const saving =
    monthly && annual ? annualSavingPercent(monthly.price, annual.price) : 0;

  const isFree = price.price.amountMinor === 0;
  const purchasable = isPurchasable(plan.id, price.interval);

  return (
    <div
      className={`flex flex-col p-6 rounded-2xl border bg-surface shadow-2xs ${
        highlight ? "border-primary ring-1 ring-primary/30" : "border-border"
      }`}
    >
      <h2 className="text-base font-bold text-foreground">{plan.name}</h2>
      <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed min-h-10">
        {plan.summary}
      </p>

      <div className="mt-5 flex items-baseline gap-1.5">
        <span className="text-3xl font-extrabold tracking-tight text-foreground">
          {formatMoney(price.price)}
        </span>
        {!isFree && (
          <span className="text-xs text-muted-foreground">
            {price.perSeat ? "per seat, " : ""}
            {price.interval === "annual" ? "per year" : "per month"}
          </span>
        )}
      </div>

      {!isFree && price.interval === "annual" && saving > 0 && (
        <p className="mt-1.5 text-xs font-semibold text-success">
          Saves {saving}% against twelve months at the monthly price.
        </p>
      )}

      <ul className="mt-5 space-y-2 flex-1">
        {features.map((feature) => (
          <li key={feature.label} className="flex items-start gap-2 text-xs">
            {feature.included ? (
              <Check className="size-3.5 text-success shrink-0 mt-0.5" />
            ) : (
              <Minus className="size-3.5 text-muted-foreground shrink-0 mt-0.5" />
            )}
            <span
              className={
                feature.included ? "text-foreground" : "text-muted-foreground"
              }
            >
              {feature.label}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-6">
        {isFree ? (
          <span className="block w-full text-center px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-bold">
            Already yours — no account needed
          </span>
        ) : purchasable ? (
          <span className="block w-full text-center px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-bold">
            Choose {plan.name}
          </span>
        ) : (
          /* Honest unavailability: no checkout exists yet, so do not pretend. */
          <span className="block w-full text-center px-4 py-2.5 rounded-xl border border-border text-muted-foreground text-xs font-semibold">
            Not open for purchase yet
          </span>
        )}
      </div>
    </div>
  );
}
