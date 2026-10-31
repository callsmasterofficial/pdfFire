"use client";

import React from "react";
import { RotateCcw } from "lucide-react";

export function RedactFileSummary({
  fileName,
  pageCount,
  sizeBytes,
  onReset,
}: {
  fileName: string;
  pageCount: number;
  sizeBytes: number;
  onReset: () => void;
}) {
  return (
    <div className="flex items-center justify-between p-3.5 bg-card border border-border rounded-xl">
      <div>
        <span className="font-semibold text-sm text-foreground">{fileName}</span>
        <span className="text-xs text-muted-foreground ml-3">
          {pageCount} {pageCount === 1 ? "page" : "pages"} ({(sizeBytes / 1024).toFixed(1)} KB)
        </span>
      </div>
      <button
        type="button"
        onClick={onReset}
        className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 font-mono"
      >
        <RotateCcw className="size-3.5" /> Choose another file
      </button>
    </div>
  );
}
