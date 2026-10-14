"use client";

import React from "react";
import { DocumentComparisonResult } from "@/lib/pdf/operations/compare";
import { PlusCircle, MinusCircle, FileDiff, Eye, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CompareSummaryBarProps {
  comparison: DocumentComparisonResult;
  currentPage: number;
  onPageChange: (page: number) => void;
  viewMode: "text" | "visual";
  onViewModeChange: (mode: "text" | "visual") => void;
}

export function CompareSummaryBar({
  comparison,
  currentPage,
  onPageChange,
  viewMode,
  onViewModeChange,
}: CompareSummaryBarProps) {
  const simPercent = Math.round(comparison.overallSimilarity * 100);

  return (
    <div className="flex flex-col gap-4 p-4 rounded-xl border border-border bg-surface-elevated/50 shadow-2xs">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Similarity & Metrics badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold bg-primary/10 text-primary border border-primary/20">
            <FileDiff className="size-3.5" />
            <span>{simPercent}% Match</span>
          </div>

          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">
            <PlusCircle className="size-3.5" />
            <span>+{comparison.totalAddedWords} words</span>
          </div>

          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-medium">
            <MinusCircle className="size-3.5" />
            <span>-{comparison.totalRemovedWords} words</span>
          </div>

          <span className="text-muted-foreground/60 hidden sm:inline">|</span>
          <span className="text-muted-foreground">
            {comparison.changedPagesCount} of {comparison.maxPages} pages changed
          </span>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center rounded-lg border border-border p-0.5 bg-background text-xs">
          <button
            type="button"
            onClick={() => onViewModeChange("text")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all ${
              viewMode === "text"
                ? "bg-primary text-primary-foreground font-medium shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Layers className="size-3.5" />
            <span>Text Diff</span>
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("visual")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all ${
              viewMode === "visual"
                ? "bg-primary text-primary-foreground font-medium shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Eye className="size-3.5" />
            <span>Visual Pixel Diff</span>
          </button>
        </div>
      </div>

      {/* Page Navigation Tabs */}
      {comparison.maxPages > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 border-t border-border/60">
          <span className="text-xs font-medium text-muted-foreground shrink-0">Pages:</span>
          {comparison.pages.map((p) => {
            const isActive = p.pageNumber === currentPage;
            return (
              <Button
                key={p.pageNumber}
                type="button"
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(p.pageNumber)}
                className={`h-7 px-2.5 text-xs shrink-0 ${
                  p.hasDifference && !isActive ? "border-amber-500/50 text-amber-600 dark:text-amber-400" : ""
                }`}
              >
                Page {p.pageNumber}
                {p.hasDifference && <span className="ml-1.5 size-1.5 rounded-full bg-amber-500" />}
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
}
