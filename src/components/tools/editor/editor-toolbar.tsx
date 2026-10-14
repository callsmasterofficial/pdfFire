"use client";

import React from "react";
import { MousePointer, Type, Square, Circle, PenTool, Undo2, Redo2, ChevronLeft, ChevronRight } from "lucide-react";
import { EditorToolType } from "@/types/annotation";

export interface EditorSettings {
  activeTool: EditorToolType;
  colorHex: string;
  strokeWidth: number;
  fontSize: number;
}

interface EditorToolbarProps {
  settings: EditorSettings;
  onSettingsChange: (updates: Partial<EditorSettings>) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

const TOOLS: { type: EditorToolType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { type: "select", label: "Select & Move", icon: MousePointer },
  { type: "text", label: "Text", icon: Type },
  { type: "rectangle", label: "Rectangle", icon: Square },
  { type: "circle", label: "Circle", icon: Circle },
  { type: "drawing", label: "Pencil", icon: PenTool },
];

const COLORS = ["#1e293b", "#dc2626", "#c85a32", "#2563eb", "#16a34a"];

export function EditorToolbar({
  settings,
  onSettingsChange,
  currentPage,
  totalPages,
  onPageChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}: EditorToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-border bg-surface shadow-2xs">
      <div className="flex items-center gap-1.5">
        {TOOLS.map((t) => {
          const Icon = t.icon;
          const isActive = settings.activeTool === t.type;
          return (
            <button
              key={t.type}
              type="button"
              onClick={() => onSettingsChange({ activeTool: t.type })}
              className={`p-2 rounded-lg border text-xs flex items-center gap-1.5 transition-all ${
                isActive
                  ? "border-primary bg-primary/10 text-primary font-semibold"
                  : "border-transparent text-muted-foreground hover:bg-surface-muted"
              }`}
              title={t.label}
            >
              <Icon className="size-4" />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onSettingsChange({ colorHex: c })}
              className={`size-5 rounded-full border-2 transition-transform ${
                settings.colorHex === c ? "scale-125 border-primary" : "border-transparent"
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        <div className="h-4 w-px bg-border mx-1" />

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="size-4" />
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="size-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="p-1 rounded hover:bg-surface-muted disabled:opacity-30"
        >
          <ChevronLeft className="size-4" />
        </button>
        <span>
          Page {currentPage} / {Math.max(1, totalPages)}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="p-1 rounded hover:bg-surface-muted disabled:opacity-30"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}
