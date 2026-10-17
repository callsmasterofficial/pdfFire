"use client";

import React from "react";
import { Sparkles, Shield, Cpu, Zap } from "lucide-react";
import { TOOL_ITEMS } from "@/lib/tools-data";

export function DashboardHero() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card via-card to-primary/5 p-6 sm:p-8">
      {/* Decorative gradient blur */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

      <div className="relative z-10 max-w-2xl space-y-3">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/15 text-primary border border-primary/25">
          <Sparkles className="size-3.5" />
          <span>Local In-Memory Studio</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          Tools Directory & Workspace
        </h1>

        <p className="text-sm text-muted-foreground leading-relaxed">
          Access all {TOOL_ITEMS.length} high-performance PDF utilities. Files never leave your browser:
          manipulation, conversions, OCR, and AI summarization run 100% locally on your device.
        </p>

        {/* Feature badges */}
        <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-muted-foreground font-medium">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/60">
            <Shield className="size-3.5 text-success" />
            <span>Zero Server Uploads</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/60">
            <Cpu className="size-3.5 text-primary" />
            <span>WebAssembly & Web Workers</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/60">
            <Zap className="size-3.5 text-amber-500" />
            <span>Instant Client Processing</span>
          </span>
        </div>
      </div>
    </div>
  );
}
