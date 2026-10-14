"use client";

import React from "react";
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Trash2, X } from "lucide-react";
import { AnnotationItem } from "@/types/annotation";

interface AnnotationMoveControlsProps {
  selectedAnnotation: AnnotationItem;
  onMove: (dx: number, dy: number) => void;
  onDelete: (id: string) => void;
  onDeselect: () => void;
}

export function AnnotationMoveControls({
  selectedAnnotation,
  onMove,
  onDelete,
  onDeselect,
}: AnnotationMoveControlsProps) {
  const label =
    selectedAnnotation.type === "text"
      ? `Text: "${selectedAnnotation.text.slice(0, 15)}..."`
      : `${selectedAnnotation.type.toUpperCase()}`;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 p-2 px-3 rounded-xl bg-surface border border-primary/40 shadow-md text-xs animate-in fade-in slide-in-from-top-1">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-primary">{label}</span>
        <span className="text-muted-foreground hidden sm:inline">• Drag note or use arrows to position</span>
      </div>

      <div className="flex items-center gap-1.5">
        <div className="flex items-center rounded-lg border border-border bg-background p-0.5 shadow-2xs">
          <button
            type="button"
            onClick={() => onMove(-10, 0)}
            className="p-1 rounded hover:bg-surface-muted text-muted-foreground hover:text-foreground"
            title="Move Left (← Arrow)"
          >
            <ArrowLeft className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onMove(10, 0)}
            className="p-1 rounded hover:bg-surface-muted text-muted-foreground hover:text-foreground"
            title="Move Right (→ Arrow)"
          >
            <ArrowRight className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onMove(0, 10)}
            className="p-1 rounded hover:bg-surface-muted text-muted-foreground hover:text-foreground"
            title="Move Up (↑ Arrow)"
          >
            <ArrowUp className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onMove(0, -10)}
            className="p-1 rounded hover:bg-surface-muted text-muted-foreground hover:text-foreground"
            title="Move Down (↓ Arrow)"
          >
            <ArrowDown className="size-3.5" />
          </button>
        </div>

        <div className="h-4 w-px bg-border" />

        <button
          type="button"
          onClick={() => onDelete(selectedAnnotation.id)}
          className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
          title="Delete annotation"
        >
          <Trash2 className="size-3.5" />
        </button>

        <button
          type="button"
          onClick={onDeselect}
          className="p-1.5 rounded-lg text-muted-foreground hover:bg-surface-muted transition-colors"
          title="Done / Deselect"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
