"use client";

import React from "react";
import { Lock, ShieldCheck } from "lucide-react";
import { SecurityInspectionResult } from "@/lib/pdf/operations";

interface SecurityStatusCardProps {
  status: SecurityInspectionResult | null;
  fileName: string;
}

export function SecurityStatusCard({ status, fileName }: SecurityStatusCardProps) {
  if (!status) return null;

  if (status.isEncrypted) {
    return (
      <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200 flex items-start gap-3">
        <Lock className="size-5 shrink-0 text-amber-500 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-xs">Password Protection Detected</p>
          <p className="text-[11px] opacity-80 leading-relaxed">
            &ldquo;{fileName}&rdquo; is encrypted. Enter the document password below to unlock and export a clean unencrypted copy locally.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200 flex items-start gap-3">
      <ShieldCheck className="size-5 shrink-0 text-emerald-500 mt-0.5" />
      <div className="space-y-1">
        <p className="font-semibold text-xs">Standard Unencrypted Document</p>
        <p className="text-[11px] opacity-80 leading-relaxed">
          This document is not protected by an open password ({status.pageCount ? `${status.pageCount} pages` : "ready"}).
        </p>
      </div>
    </div>
  );
}
