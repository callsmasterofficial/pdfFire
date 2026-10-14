"use client";

import React, { useState } from "react";
import { DocumentSummaryResult } from "@/lib/ai/types";

interface SummaryContentTabsProps {
  summary: DocumentSummaryResult;
}

export function SummaryContentTabs({ summary }: SummaryContentTabsProps) {
  const [activeTab, setActiveTab] = useState<"summary" | "takeaways" | "entities">("summary");

  return (
    <div className="space-y-4">
      <div className="flex border-b border-border/60 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("summary")}
          className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all ${
            activeTab === "summary"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Executive Summary
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("takeaways")}
          className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all ${
            activeTab === "takeaways"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Key Takeaways ({summary.keyTakeaways.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("entities")}
          className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all ${
            activeTab === "entities"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Entities & Numbers ({summary.entities.length})
        </button>
      </div>

      {activeTab === "summary" && (
        <div className="p-4 rounded-xl border border-border/70 bg-muted/20 text-xs text-foreground/90 leading-relaxed font-sans select-all whitespace-pre-wrap">
          {summary.executiveSummary}
        </div>
      )}

      {activeTab === "takeaways" && (
        <div className="space-y-2">
          {summary.keyTakeaways.map((takeaway, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl border border-border/50 bg-muted/20 text-xs flex items-start gap-2.5"
            >
              <span className="size-5 rounded-full bg-primary/10 text-primary font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <p className="leading-relaxed text-foreground/90">{takeaway}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === "entities" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
          {summary.entities.length === 0 ? (
            <div className="col-span-2 p-6 text-center text-xs text-muted-foreground">
              No dates, amounts, or email entities identified in this document.
            </div>
          ) : (
            summary.entities.map((ent, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-lg border border-border/50 bg-muted/20 flex flex-col gap-0.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-primary">{ent.value}</span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                    {ent.type}
                  </span>
                </div>
                {ent.context && (
                  <p className="text-[11px] text-muted-foreground truncate">{ent.context}</p>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
