"use client";

import React from "react";
import { PageComparison } from "@/lib/pdf/operations/compare";
import { DiffToken } from "@/lib/pdf/operations/diff-algorithm";

interface CompareTextViewProps {
  pageComp: PageComparison | undefined;
  docAName: string;
  docBName: string;
}

export function CompareTextView({
  pageComp,
  docAName,
  docBName,
}: CompareTextViewProps) {
  if (!pageComp) {
    return <div className="p-8 text-center text-xs text-muted-foreground">No page selected.</div>;
  }

  const tokens = pageComp.diff.tokens;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Document A pane (Original) */}
        <div className="flex flex-col rounded-xl border border-border bg-background overflow-hidden">
          <div className="px-4 py-2.5 bg-surface-elevated/70 border-b border-border flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground truncate max-w-[200px]">
              {docAName}
            </span>
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
              Original • Page {pageComp.pageNumber}
            </span>
          </div>

          <div className="p-4 text-xs font-mono leading-relaxed whitespace-pre-wrap max-h-[460px] overflow-y-auto">
            {tokens.length === 0 ? (
              <span className="text-muted-foreground italic">No text on this page.</span>
            ) : (
              tokens.map((token: DiffToken, idx: number) => {
                if (token.type === "added") {
                  return null; // Don't show added text in Document A
                }
                if (token.type === "removed") {
                  return (
                    <mark
                      key={idx}
                      className="bg-rose-500/20 text-rose-700 dark:text-rose-300 line-through rounded-xs px-0.5"
                    >
                      {token.value}
                    </mark>
                  );
                }
                return <span key={idx}>{token.value}</span>;
              })
            )}
          </div>
        </div>

        {/* Document B pane (Revised) */}
        <div className="flex flex-col rounded-xl border border-border bg-background overflow-hidden">
          <div className="px-4 py-2.5 bg-surface-elevated/70 border-b border-border flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground truncate max-w-[200px]">
              {docBName}
            </span>
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
              Revised • Page {pageComp.pageNumber}
            </span>
          </div>

          <div className="p-4 text-xs font-mono leading-relaxed whitespace-pre-wrap max-h-[460px] overflow-y-auto">
            {tokens.length === 0 ? (
              <span className="text-muted-foreground italic">No text on this page.</span>
            ) : (
              tokens.map((token: DiffToken, idx: number) => {
                if (token.type === "removed") {
                  return null; // Don't show removed text in Document B
                }
                if (token.type === "added") {
                  return (
                    <mark
                      key={idx}
                      className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-semibold rounded-xs px-0.5"
                    >
                      {token.value}
                    </mark>
                  );
                }
                return <span key={idx}>{token.value}</span>;
              })
            )}
          </div>
        </div>
      </div>

      {/* Unified Changelog Summary */}
      <div className="rounded-xl border border-border bg-surface p-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
          Page {pageComp.pageNumber} Unified Diff
        </h4>
        <div className="text-xs font-mono leading-relaxed p-3 rounded-lg bg-background border border-border/80 whitespace-pre-wrap max-h-48 overflow-y-auto">
          {tokens.map((token: DiffToken, idx: number) => {
            if (token.type === "removed") {
              return (
                <span
                  key={idx}
                  className="bg-rose-500/20 text-rose-700 dark:text-rose-400 line-through rounded-xs px-0.5"
                >
                  {token.value}
                </span>
              );
            }
            if (token.type === "added") {
              return (
                <span
                  key={idx}
                  className="bg-emerald-500/25 text-emerald-700 dark:text-emerald-400 font-bold rounded-xs px-0.5"
                >
                  {token.value}
                </span>
              );
            }
            return <span key={idx}>{token.value}</span>;
          })}
        </div>
      </div>
    </div>
  );
}
