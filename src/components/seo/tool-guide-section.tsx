import React from "react";
import { CheckCircle2, AlertCircle, ShieldCheck } from "lucide-react";
import { ToolSeoData } from "@/lib/seo/types";

interface ToolGuideSectionProps {
  tool: ToolSeoData;
}

export function ToolGuideSection({ tool }: ToolGuideSectionProps) {
  return (
    <section className="w-full mt-12 pt-10 border-t border-border space-y-10">
      {/* How To Instructions */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground mb-4">
          How to {tool.h1}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tool.instructions.map((step) => (
            <div
              key={step.step}
              className="p-4 rounded-xl border border-border bg-surface-secondary/40 shadow-2xs flex flex-col justify-between"
            >
              <div>
                <span className="size-7 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center text-xs font-mono font-bold mb-3">
                  {step.step}
                </span>
                <h3 className="text-sm font-semibold text-foreground mb-1.5">
                  {step.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Features & Limitations Two-Column */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-5 rounded-xl border border-border bg-surface shadow-2xs">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <CheckCircle2 className="size-4 text-success" />
            <span>Key Features & Capabilities</span>
          </h3>
          <ul className="space-y-2 text-xs text-muted-foreground">
            {tool.features.map((feature, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="size-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-5 rounded-xl border border-border bg-surface shadow-2xs">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <AlertCircle className="size-4 text-muted-foreground" />
            <span>Honest Technical Constraints</span>
          </h3>
          <ul className="space-y-2 text-xs text-muted-foreground">
            {tool.limitations.map((limit, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="size-1.5 rounded-full bg-muted-foreground/60 mt-1.5 shrink-0" />
                <span>{limit}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Privacy Guarantee Box */}
      <div className="p-4 sm:p-5 rounded-xl border border-border bg-surface-secondary/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="size-9 rounded-lg bg-success/10 text-success border border-success/20 flex items-center justify-center shrink-0">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-foreground">
              Privacy by Architecture — 100% Client-Side Execution
            </h4>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              All PDF processing is executed locally in your browser memory via WebAssembly and Web Workers. Your files are never uploaded to any remote server.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
