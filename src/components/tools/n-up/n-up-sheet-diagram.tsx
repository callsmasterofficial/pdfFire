import React from "react";
import { NUpOptions } from "@/lib/pdf/operations/n-up";

interface NUpSheetDiagramProps {
  options: NUpOptions;
  totalPages: number;
}

export function NUpSheetDiagram({ options, totalPages }: NUpSheetDiagramProps) {
  const n = options.pagesPerSheet;
  const isLandscape = options.orientation === "landscape"
    ? true
    : options.orientation === "portrait"
    ? false
    : n === 2;

  const cols = n === 2 ? (isLandscape ? 2 : 1)
    : n === 6 ? (isLandscape ? 3 : 2)
    : n === 9 ? 3
    : n === 16 ? 4
    : 2; // n === 4

  const rows = Math.ceil(n / cols);
  const isVertical = options.pageOrder === "vertical";

  const cells = Array.from({ length: n }).map((_, cIdx) => {
    const col = isVertical ? Math.floor(cIdx / rows) : cIdx % cols;
    const row = isVertical ? cIdx % rows : Math.floor(cIdx / cols);
    const displayIndex = isVertical ? (col * rows + row + 1) : (row * cols + col + 1);
    const hasSource = options.repeatSinglePage && totalPages === 1
      ? 1
      : displayIndex <= totalPages ? displayIndex : null;

    return { col, row, displayIndex, hasSource };
  });

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-muted/40 rounded-xl border border-border">
      <div className="flex items-center justify-between w-full mb-3 text-xs text-muted-foreground font-mono">
        <span>Sheet Simulation (1 of {Math.ceil(Math.max(1, totalPages) / n)})</span>
        <span>{isLandscape ? "Landscape" : "Portrait"} • {cols}×{rows} Grid</span>
      </div>

      <div
        className={`relative border-2 border-dashed border-primary/40 bg-card rounded-lg shadow-sm p-3 transition-all flex flex-col justify-between ${
          isLandscape ? "w-64 h-44" : "w-44 h-60"
        }`}
      >
        <div
          className="grid gap-2 w-full h-full"
          style={{
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
          }}
        >
          {cells.map((cell, idx) => (
            <div
              key={idx}
              className={`flex flex-col items-center justify-center rounded border transition-all text-xs font-semibold ${
                options.drawBorders ? "border-primary/50 shadow-[0_1px_2px_rgba(0,0,0,0.05)]" : "border-border/60"
              } ${
                cell.hasSource
                  ? "bg-primary/10 text-primary border-primary/40"
                  : "bg-muted/30 text-muted-foreground/40 border-dashed"
              }`}
            >
              <span className="font-mono text-sm">
                {cell.hasSource ? `P.${cell.hasSource}` : "—"}
              </span>
            </div>
          ))}
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground mt-3 text-center">
        {options.pageOrder === "vertical"
          ? "Vertical Order: Top-to-bottom, then left-to-right"
          : "Horizontal Order: Left-to-right, then top-to-bottom"}
      </p>
    </div>
  );
}
