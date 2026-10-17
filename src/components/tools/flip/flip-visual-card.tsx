import React from "react";
import { FlipOptions } from "@/lib/pdf/operations/flip";

interface FlipVisualCardProps {
  options: FlipOptions;
}

export function FlipVisualCard({ options }: FlipVisualCardProps) {
  const transformStyle =
    options.direction === "horizontal"
      ? "scaleX(-1)"
      : options.direction === "vertical"
      ? "scaleY(-1)"
      : "scaleX(-1) scaleY(-1)";

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-muted/30 rounded-xl border border-border">
      <div className="flex items-center justify-between w-full mb-4 text-xs text-muted-foreground font-mono">
        <span>Orientation Simulation</span>
        <span className="capitalize">{options.direction} Flip</span>
      </div>

      <div className="flex items-center justify-center gap-6">
        {/* Original */}
        <div className="flex flex-col items-center">
          <span className="text-[11px] text-muted-foreground mb-2">Original</span>
          <div className="w-28 h-36 bg-card border-2 border-border rounded-lg shadow-sm p-3 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-muted-foreground">TOP</span>
              <div className="size-2 rounded-full bg-primary/40" />
            </div>
            <div className="text-3xl font-black text-foreground text-center font-serif">
              R
            </div>
            <div className="text-[10px] text-muted-foreground text-right font-mono">
              P. 1
            </div>
          </div>
        </div>

        {/* Arrow */}
        <div className="text-primary font-bold text-lg">→</div>

        {/* Flipped Result */}
        <div className="flex flex-col items-center">
          <span className="text-[11px] text-primary font-semibold mb-2">Flipped</span>
          <div
            className="w-28 h-36 bg-card border-2 border-primary/60 rounded-lg shadow-md p-3 flex flex-col justify-between transition-transform duration-300"
            style={{ transform: transformStyle }}
          >
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-muted-foreground">TOP</span>
              <div className="size-2 rounded-full bg-primary/40" />
            </div>
            <div className="text-3xl font-black text-foreground text-center font-serif">
              R
            </div>
            <div className="text-[10px] text-muted-foreground text-right font-mono">
              P. 1
            </div>
          </div>
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground mt-4 text-center">
        {options.direction === "horizontal"
          ? "Horizontal Mirror: Flips left-to-right (ideal for iron-on transfers & back-lit signs)."
          : options.direction === "vertical"
          ? "Vertical Flip: Flips top-to-bottom upside down."
          : "Both Axes: Completely mirrors horizontally and vertically (180° mirror)."}
      </p>
    </div>
  );
}
