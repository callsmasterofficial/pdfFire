import React from "react";
import { Trash2 } from "lucide-react";
import { RedactionArea } from "@/lib/pdf/operations/redact";

interface RedactControlsProps {
  fillColor: NonNullable<RedactionArea["fillColor"]>;
  onColorChange: (c: NonNullable<RedactionArea["fillColor"]>) => void;
  overlayText: string;
  onTextChange: (t: string) => void;
  redactionCount: number;
  onClearAll: () => void;
}

export function RedactControls({
  fillColor,
  onColorChange,
  overlayText,
  onTextChange,
  redactionCount,
  onClearAll,
}: RedactControlsProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-card border border-border rounded-xl">
      <div className="flex flex-wrap items-center gap-4">
        {/* Fill Color */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-foreground">Fill:</span>
          <div className="flex gap-1.5">
            {[
              { id: "black", label: "Black", bg: "bg-black text-white" },
              { id: "charcoal", label: "Charcoal", bg: "bg-neutral-800 text-white" },
              { id: "white", label: "White", bg: "bg-white text-black border border-border" },
            ].map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => onColorChange(c.id as NonNullable<RedactionArea["fillColor"]>)}
                className={`text-xs px-2.5 py-1 rounded-md transition-all font-medium ${c.bg} ${
                  fillColor === c.id ? "ring-2 ring-primary ring-offset-1" : "opacity-70 hover:opacity-100"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Overlay Label */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-foreground">Label:</span>
          <input
            type="text"
            value={overlayText}
            onChange={(e) => onTextChange(e.target.value)}
            placeholder="e.g. [REDACTED]"
            className="text-xs bg-background border border-border rounded-md px-2.5 py-1 text-foreground focus:ring-2 focus:ring-primary focus:outline-none w-32"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs font-mono font-medium text-muted-foreground">
          {redactionCount} {redactionCount === 1 ? "zone" : "zones"} marked
        </span>
        {redactionCount > 0 && (
          <button
            type="button"
            onClick={onClearAll}
            className="text-xs text-destructive hover:underline inline-flex items-center gap-1 font-mono"
          >
            <Trash2 className="size-3" /> Clear all
          </button>
        )}
      </div>
    </div>
  );
}
