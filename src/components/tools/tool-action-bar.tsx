"use client";

import React from "react";
import { Download, Loader2, RefreshCw, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ToolActionBarProps {
  actionLabel: string;
  isProcessing: boolean;
  canExecute: boolean;
  isDone: boolean;
  resultFileName?: string;
  onExecute: () => void;
  onDownload: () => void;
  onReset: () => void;
  className?: string;
}

export function ToolActionBar({
  actionLabel,
  isProcessing,
  canExecute,
  isDone,
  resultFileName,
  onExecute,
  onDownload,
  onReset,
  className = "",
}: ToolActionBarProps) {
  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 mt-6 border-t border-border ${className}`}>
      <div className="flex items-center gap-2">
        {isDone ? (
          <div className="flex items-center gap-2 text-xs text-success font-medium">
            <CheckCircle2 className="size-4" />
            <span>Ready for download: {resultFileName}</span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">
            No server processing — output generated in browser memory.
          </span>
        )}
      </div>

      <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={onReset}
          disabled={isProcessing}
          className="gap-1.5"
        >
          <RefreshCw className="size-3.5" />
          <span>Reset</span>
        </Button>

        {isDone ? (
          <Button
            variant="default"
            size="sm"
            onClick={onDownload}
            className="gap-1.5 bg-primary text-primary-foreground shadow-xs"
          >
            <Download className="size-3.5" />
            <span>Download Output</span>
          </Button>
        ) : (
          <Button
            variant="default"
            size="sm"
            onClick={onExecute}
            disabled={!canExecute || isProcessing}
            className="gap-1.5"
          >
            {isProcessing && <Loader2 className="size-3.5 animate-spin" />}
            <span>{isProcessing ? "Processing..." : actionLabel}</span>
          </Button>
        )}
      </div>
    </div>
  );
}
