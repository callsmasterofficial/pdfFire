"use client";

import React from "react";
import { AlertTriangle, FileWarning, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PDFPreviewError } from "@/types/pdf";

interface PDFPreviewErrorProps {
  error: PDFPreviewError;
  fileName?: string;
  onRetry: () => void;
  onReset: () => void;
}

export function PDFPreviewErrorDisplay({
  error,
  fileName,
  onRetry,
  onReset,
}: PDFPreviewErrorProps) {
  const isCorrupted = error.type === "corrupted";

  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 max-w-lg mx-auto my-6 bg-surface rounded-2xl border border-destructive/20 shadow-xs text-center">
      <div className="size-14 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-4">
        {isCorrupted ? (
          <FileWarning className="size-7" />
        ) : (
          <AlertTriangle className="size-7" />
        )}
      </div>

      <h3 className="text-lg font-bold text-foreground">
        {isCorrupted ? "Corrupted or Invalid PDF" : "Unable to Preview Document"}
      </h3>

      {fileName && (
        <p className="text-xs font-mono text-muted-foreground mt-1 mb-2">
          {fileName}
        </p>
      )}

      <p className="text-sm text-muted-foreground mb-4 max-w-md">
        {error.message}
      </p>

      {error.details && (
        <pre className="text-[11px] font-mono p-3 rounded-lg bg-surface-secondary border border-border text-muted-foreground text-left w-full mb-6 overflow-x-auto max-h-24">
          {error.details}
        </pre>
      )}

      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={onRetry} className="gap-1.5">
          <RefreshCw className="size-3.5" />
          <span>Retry</span>
        </Button>
        <Button variant="default" size="sm" onClick={onReset}>
          Select Another File
        </Button>
      </div>
    </div>
  );
}
