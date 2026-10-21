"use client";

import React from "react";
import { Sheet, Layers, Grid3X3, Hash } from "lucide-react";

interface XlsxMetricsProps {
  sheetCount: number;
  rowCount: number;
  cellCount: number;
  pageCount?: number;
}

export function XlsxMetricsBadge({
  sheetCount,
  rowCount,
  cellCount,
  pageCount,
}: XlsxMetricsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div className="flex items-center gap-2.5 p-3 rounded-xl border border-border/60 bg-muted/20">
        <Sheet className="size-4 text-emerald-500 shrink-0" />
        <div>
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Sheets</p>
          <p className="text-sm font-bold">{sheetCount.toLocaleString()}</p>
        </div>
      </div>
      <div className="flex items-center gap-2.5 p-3 rounded-xl border border-border/60 bg-muted/20">
        <Layers className="size-4 text-blue-500 shrink-0" />
        <div>
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Rows</p>
          <p className="text-sm font-bold">{rowCount.toLocaleString()}</p>
        </div>
      </div>
      <div className="flex items-center gap-2.5 p-3 rounded-xl border border-border/60 bg-muted/20">
        <Grid3X3 className="size-4 text-purple-500 shrink-0" />
        <div>
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Cells</p>
          <p className="text-sm font-bold">{cellCount.toLocaleString()}</p>
        </div>
      </div>
      <div className="flex items-center gap-2.5 p-3 rounded-xl border border-border/60 bg-muted/20">
        <Hash className="size-4 text-amber-500 shrink-0" />
        <div>
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">PDF Pages</p>
          <p className="text-sm font-bold">{pageCount ?? "—"}</p>
        </div>
      </div>
    </div>
  );
}
