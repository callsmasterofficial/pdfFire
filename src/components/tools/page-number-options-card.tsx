"use client";

import React from "react";
import { NumberingPosition, PageNumberingOptions } from "@/lib/pdf/operations/page-numbering";

export interface PageNumberFormState {
  position: NumberingPosition;
  format: NonNullable<PageNumberingOptions["format"]>;
  startNumber: number;
  skipFirstPage: boolean;
  headerText: string;
  footerText: string;
}

interface PageNumberOptionsCardProps {
  state: PageNumberFormState;
  onChange: (updates: Partial<PageNumberFormState>) => void;
}

const POSITIONS: { id: NumberingPosition; label: string }[] = [
  { id: "top-left", label: "Top Left" },
  { id: "top-center", label: "Top Center" },
  { id: "top-right", label: "Top Right" },
  { id: "bottom-left", label: "Bottom Left" },
  { id: "bottom-center", label: "Bottom Center" },
  { id: "bottom-right", label: "Bottom Right" },
];

export function PageNumberOptionsCard({ state, onChange }: PageNumberOptionsCardProps) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
      <div>
        <label className="text-xs font-semibold text-foreground block mb-2">
          Position on Page
        </label>
        <div className="grid grid-cols-3 gap-2">
          {POSITIONS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onChange({ position: p.id })}
              className={`py-2 px-2.5 rounded-lg border text-xs font-medium transition-all ${
                state.position === p.id
                  ? "border-primary bg-primary/10 text-primary font-semibold"
                  : "border-border bg-surface-muted text-muted-foreground hover:bg-border/60"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground">Numbering Style</label>
          <select
            value={state.format}
            onChange={(e) =>
              onChange({ format: e.target.value as PageNumberFormState["format"] })
            }
            className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background text-xs text-foreground"
          >
            <option value="page-of-total">Page 1 of 10</option>
            <option value="page-only">Page 1</option>
            <option value="numbers-only">1 / 10</option>
            <option value="number-only">1</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground">Starting Number</label>
          <input
            type="number"
            min="1"
            value={state.startNumber}
            onChange={(e) => onChange({ startNumber: Math.max(1, parseInt(e.target.value) || 1) })}
            className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background text-xs text-foreground"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <input
          id="skip-first"
          type="checkbox"
          checked={state.skipFirstPage}
          onChange={(e) => onChange({ skipFirstPage: e.target.checked })}
          className="rounded border-border accent-primary size-4"
        />
        <label htmlFor="skip-first" className="text-xs text-foreground select-none cursor-pointer">
          Skip first page (exclude cover page from numbering)
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Header Text (Optional)</label>
          <input
            type="text"
            placeholder="e.g. Confidential Report"
            value={state.headerText}
            onChange={(e) => onChange({ headerText: e.target.value })}
            className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background text-xs text-foreground"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Footer Text (Optional)</label>
          <input
            type="text"
            placeholder="e.g. Copyright © 2026"
            value={state.footerText}
            onChange={(e) => onChange({ footerText: e.target.value })}
            className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background text-xs text-foreground"
          />
        </div>
      </div>
    </div>
  );
}
