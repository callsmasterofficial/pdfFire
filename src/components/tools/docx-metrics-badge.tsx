"use client";

import React from "react";
import { FileText, AlignLeft, Table as TableIcon, Hash } from "lucide-react";

interface DocxMetricsProps {
  paragraphCount: number;
  wordCount: number;
  tableCount: number;
  pageCount?: number;
}

export function DocxMetricsBadge({
  paragraphCount,
  wordCount,
  tableCount,
  pageCount,
}: DocxMetricsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div className="flex items-center gap-2.5 p-3 rounded-xl border border-border/60 bg-muted/20">
        <AlignLeft className="size-4 text-blue-500 shrink-0" />
        <div>
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Paragraphs</p>
          <p className="text-sm font-bold">{paragraphCount.toLocaleString()}</p>
        </div>
      </div>
      <div className="flex items-center gap-2.5 p-3 rounded-xl border border-border/60 bg-muted/20">
        <FileText className="size-4 text-purple-500 shrink-0" />
        <div>
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Words</p>
          <p className="text-sm font-bold">{wordCount.toLocaleString()}</p>
        </div>
      </div>
      <div className="flex items-center gap-2.5 p-3 rounded-xl border border-border/60 bg-muted/20">
        <TableIcon className="size-4 text-emerald-500 shrink-0" />
        <div>
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Tables</p>
          <p className="text-sm font-bold">{tableCount.toLocaleString()}</p>
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
