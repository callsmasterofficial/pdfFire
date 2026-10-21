"use client";

import React from "react";
import { Code2, FileText, Table as TableIcon, Hash } from "lucide-react";

interface HtmlMetricsProps {
  elementCount: number;
  wordCount: number;
  tableCount: number;
  pageCount?: number;
}

export function HtmlMetricsBadge({
  elementCount,
  wordCount,
  tableCount,
  pageCount,
}: HtmlMetricsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div className="flex items-center gap-2.5 p-3 rounded-xl border border-border/60 bg-muted/20">
        <Code2 className="size-4 text-orange-500 shrink-0" />
        <div>
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Elements</p>
          <p className="text-sm font-bold">{elementCount.toLocaleString()}</p>
        </div>
      </div>
      <div className="flex items-center gap-2.5 p-3 rounded-xl border border-border/60 bg-muted/20">
        <FileText className="size-4 text-blue-500 shrink-0" />
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
