"use client";

import React from "react";
import { CheckCircle2, AlertCircle, Clock, Ban } from "lucide-react";
import { BatchSummary } from "@/types/batch";

interface BatchSummaryCardProps {
  summary: BatchSummary;
}

export function BatchSummaryCard({ summary }: BatchSummaryCardProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl border border-border bg-surface-secondary/40 text-xs">
      <div className="flex items-center gap-2">
        <Clock className="size-4 text-muted-foreground shrink-0" />
        <div>
          <p className="text-[10px] text-muted-foreground uppercase font-semibold">Total Queued</p>
          <p className="font-mono font-bold text-foreground">{summary.total}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <CheckCircle2 className="size-4 text-success shrink-0" />
        <div>
          <p className="text-[10px] text-muted-foreground uppercase font-semibold">Completed</p>
          <p className="font-mono font-bold text-success">{summary.completed}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <AlertCircle className="size-4 text-destructive shrink-0" />
        <div>
          <p className="text-[10px] text-muted-foreground uppercase font-semibold">Failed</p>
          <p className="font-mono font-bold text-destructive">{summary.failed}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Ban className="size-4 text-warning shrink-0" />
        <div>
          <p className="text-[10px] text-muted-foreground uppercase font-semibold">Cancelled</p>
          <p className="font-mono font-bold text-warning">{summary.cancelled}</p>
        </div>
      </div>
    </div>
  );
}
