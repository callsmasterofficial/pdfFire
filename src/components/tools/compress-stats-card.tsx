"use client";

import React from "react";
import { CheckCircle2, AlertCircle, ArrowDownRight, ShieldCheck } from "lucide-react";
import { formatFileSize } from "@/lib/pdf/validator";
import { CompressPdfResult } from "@/lib/pdf/operations/compress";

interface CompressStatsCardProps {
  result: CompressPdfResult;
}

export function CompressStatsCard({ result }: CompressStatsCardProps) {
  const { originalSizeBytes, compressedSizeBytes, savedBytes, percentageSaved, isSmaller } = result;

  return (
    <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isSmaller ? (
            <CheckCircle2 className="size-5 text-emerald-500" />
          ) : (
            <AlertCircle className="size-5 text-amber-500" />
          )}
          <h3 className="text-sm font-semibold text-foreground">
            {isSmaller ? "Optimization Results" : "Document Already Optimized"}
          </h3>
        </div>
        <span
          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
            isSmaller
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
              : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
          }`}
        >
          {isSmaller ? `-${percentageSaved}% Reduction` : "0% Reduction"}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="p-3 rounded-lg bg-surface-muted border border-border">
          <span className="text-[11px] text-muted-foreground block">Original Size</span>
          <span className="text-sm font-bold text-foreground mt-0.5 block">
            {formatFileSize(originalSizeBytes)}
          </span>
        </div>

        <div className="p-3 rounded-lg bg-surface-muted border border-border">
          <span className="text-[11px] text-muted-foreground block">Optimized Size</span>
          <span className="text-sm font-bold text-foreground mt-0.5 block">
            {formatFileSize(compressedSizeBytes)}
          </span>
        </div>

        <div className="p-3 rounded-lg bg-surface-muted border border-border col-span-2 sm:col-span-1">
          <span className="text-[11px] text-muted-foreground block">Space Saved</span>
          <div className="flex items-center gap-1 mt-0.5">
            {isSmaller && <ArrowDownRight className="size-3.5 text-emerald-500" />}
            <span className="text-sm font-bold text-foreground">
              {isSmaller ? formatFileSize(savedBytes) : "0 B"}
            </span>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
        <ShieldCheck className="size-3.5 text-primary shrink-0" />
        <span>
          {isSmaller
            ? "Streams compressed losslessly. Document contents never left your device."
            : "This PDF already uses maximum stream compression; original fidelity is preserved."}
        </span>
      </p>
    </div>
  );
}
