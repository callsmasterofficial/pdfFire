import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ShieldCheck } from "lucide-react";
import { getCanonicalUrl } from "@/lib/seo/site-config";
import { PLAN_ORDER, getPlan } from "@/lib/billing/plans";
import { PlanCard } from "@/components/pricing/plan-card";
import { featuresFor } from "@/components/pricing/plan-features";

export const metadata: Metadata = {
  title: "Pricing — FileMelo Free, Pro and Teams",
  description:
    "Compare FileMelo Free, Pro and Teams. Every tool runs on your device; paid plans add batch workflows, saved presets, desktop builds and seat administration.",
  alternates: { canonical: getCanonicalUrl("/pricing") },
};

export default function PricingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <main className="flex-1 max-w-6xl mx-auto px-4 py-12 sm:py-16 w-full">
        <div className="mb-10 text-center">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Pay for capability, <span className="text-primary">not for privacy.</span>
          </h1>
          <p className="mt-3 text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Every tool processes your documents in your own browser on every
            plan, including the free one. Nothing is uploaded, and no output is
            degraded to sell you an upgrade.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {PLAN_ORDER.map((id) => (
            <PlanCard
              key={id}
              plan={getPlan(id)}
              interval={id === "free" ? "monthly" : "annual"}
              highlight={id === "pro"}
              features={featuresFor(id)}
            />
          ))}
        </div>

        <div className="mt-10 p-5 rounded-2xl border border-border bg-surface-secondary/40">
          <div className="flex items-start gap-3">
            <ShieldCheck className="size-5 text-primary shrink-0 mt-0.5" />
            <div className="text-xs text-muted-foreground leading-relaxed space-y-2">
              <p>
                <strong className="text-foreground">
                  Pro and Teams are not open for purchase yet.
                </strong>{" "}
                The prices above are the launch prices and the plans are built,
                but checkout is not live. Nothing here takes a payment, and no
                plan auto-renews into something you did not choose.
              </p>
              <p>
                Prices are shown per year. Pro is also available monthly, and
                the annual price is a real discount on twelve monthly payments
                rather than a comparison with a price nobody was charged.
              </p>
              <p>
                Prices on the iOS and Android apps come from each store&rsquo;s
                own localized tiers and may differ from these.{" "}
                <Link href="/privacy" className="text-primary hover:underline">
                  How we handle your data
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
