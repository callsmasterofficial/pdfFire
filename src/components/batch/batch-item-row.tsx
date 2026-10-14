"use client";

import React from "react";
import { GripVertical, FileText, CheckCircle2, AlertCircle, RefreshCw, Trash2, Loader2, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BatchItem } from "@/types/batch";
import { formatFileSize } from "@/lib/pdf/validator";
import type { DraggableSyntheticListeners } from "@dnd-kit/core";

interface BatchItemRowProps {
  item: BatchItem;
  dragHandleProps?: DraggableSyntheticListeners;
  isProcessingQueue: boolean;
  onRetry: (id: string) => void;
  onRemove: (id: string) => void;
}

export function BatchItemRow({
  item,
  dragHandleProps,
  isProcessingQueue,
  onRetry,
  onRemove,
}: BatchItemRowProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-border bg-surface shadow-2xs hover:border-primary/40 transition-colors">
      <div className="flex items-center gap-2.5 overflow-hidden flex-1 min-w-0">
        <div
          {...dragHandleProps}
          className="cursor-grab active:cursor-grabbing text-muted-foreground/60 hover:text-foreground shrink-0 touch-none"
          title="Drag to reorder queue"
          aria-label="Drag to reorder"
        >
          <GripVertical className="size-4" />
        </div>

        <FileText className="size-4 text-primary shrink-0" />

        <div className="truncate flex-1">
          <p className="text-xs font-semibold text-foreground truncate">{item.file.name}</p>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
            <span>{formatFileSize(item.file.size)}</span>
            {item.error && <span className="text-destructive font-medium">• {item.error}</span>}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
        {/* Status Indicators */}
        {item.status === "queued" && (
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-surface-secondary text-muted-foreground border border-border">
            Queued
          </span>
        )}

        {item.status === "processing" && (
          <div className="flex items-center gap-1.5 text-xs text-primary font-medium">
            <Loader2 className="size-3.5 animate-spin" />
            <span>{item.progress}%</span>
          </div>
        )}

        {item.status === "done" && (
          <div className="flex items-center gap-1 text-xs text-success font-medium">
            <CheckCircle2 className="size-3.5" />
            <span>Done</span>
          </div>
        )}

        {item.status === "cancelled" && (
          <div className="flex items-center gap-1 text-xs text-warning font-medium">
            <Ban className="size-3.5" />
            <span>Cancelled</span>
          </div>
        )}

        {item.status === "error" && (
          <div className="flex items-center gap-1 text-xs text-destructive font-medium">
            <AlertCircle className="size-3.5" />
            <span>Failed</span>
          </div>
        )}

        {/* Row Actions */}
        {(item.status === "error" || item.status === "cancelled") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRetry(item.id)}
            disabled={isProcessingQueue}
            className="size-7 p-0"
            title="Retry this file"
          >
            <RefreshCw className="size-3.5" />
          </Button>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(item.id)}
          disabled={isProcessingQueue && item.status === "processing"}
          className="size-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          title="Remove from batch"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
