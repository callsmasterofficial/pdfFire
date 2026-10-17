"use client";

import React from "react";
import { Input } from "@/components/ui/input";

interface SignPlacementControlsProps {
  sigWidth: number;
  onSigWidthChange: (w: number) => void;
  totalPages: number;
  applyToAll: boolean;
  onApplyToAllChange: (apply: boolean) => void;
  includeCaption: boolean;
  onIncludeCaptionChange: (inc: boolean) => void;
  signerName: string;
  onSignerNameChange: (n: string) => void;
  signDate: string;
  onSignDateChange: (d: string) => void;
}

export function SignPlacementControls({
  sigWidth,
  onSigWidthChange,
  totalPages,
  applyToAll,
  onApplyToAllChange,
  includeCaption,
  onIncludeCaptionChange,
  signerName,
  onSignerNameChange,
  signDate,
  onSignDateChange,
}: SignPlacementControlsProps) {
  return (
    <div className="w-full lg:w-72 flex flex-col gap-4 text-xs">
      <div className="p-3.5 rounded-xl border border-border bg-surface flex flex-col gap-3">
        <label className="font-semibold text-foreground">Signature Size</label>
        <input
          type="range"
          min="100"
          max="260"
          value={sigWidth}
          onChange={(e) => onSigWidthChange(Number(e.target.value))}
          className="w-full accent-primary"
        />
        <div className="flex justify-between text-[11px] text-muted-foreground font-mono">
          <span>Compact</span>
          <span>Standard</span>
          <span>Large</span>
        </div>
      </div>

      {totalPages > 1 && (
        <label className="flex items-center gap-2 p-3 rounded-xl border border-border bg-surface cursor-pointer">
          <input
            type="checkbox"
            checked={applyToAll}
            onChange={(e) => onApplyToAllChange(e.target.checked)}
            className="size-4 rounded accent-primary"
          />
          <span className="font-medium text-foreground">
            Apply signature to all {totalPages} pages
          </span>
        </label>
      )}

      <div className="p-3.5 rounded-xl border border-border bg-surface flex flex-col gap-3">
        <label className="flex items-center gap-2 font-semibold text-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={includeCaption}
            onChange={(e) => onIncludeCaptionChange(e.target.checked)}
            className="size-4 rounded accent-primary"
          />
          <span>Stamp Signer & Date Label</span>
        </label>

        {includeCaption && (
          <div className="space-y-2 pt-1">
            <Input
              placeholder="Full Legal Name"
              value={signerName}
              onChange={(e) => onSignerNameChange(e.target.value)}
              className="h-8 text-xs"
            />
            <Input
              type="date"
              value={signDate}
              onChange={(e) => onSignDateChange(e.target.value)}
              className="h-8 text-xs font-mono"
            />
          </div>
        )}
      </div>
    </div>
  );
}
