import React from "react";
import { CropResizeOptions } from "@/lib/pdf/operations/crop";

interface CropVisualPreviewProps {
  options: CropResizeOptions;
  pageWidth: number;
  pageHeight: number;
}

export function CropVisualPreview({ options, pageWidth, pageHeight }: CropVisualPreviewProps) {
  const isLandscape = pageWidth > pageHeight;
  const aspect = pageWidth / pageHeight;

  // Compute preview box dimensions
  const previewHeight = 220;
  const previewWidth = Math.round(previewHeight * Math.min(Math.max(aspect, 0.6), 1.6));

  const { top = 0, bottom = 0, left = 0, right = 0 } = options.cropMargins || {};
  const cropLeftPct = (left / pageWidth) * 100;
  const cropRightPct = (right / pageWidth) * 100;
  const cropTopPct = (top / pageHeight) * 100;
  const cropBottomPct = (bottom / pageHeight) * 100;

  return (
    <div className="flex flex-col items-center justify-center p-5 bg-muted/30 rounded-xl border border-border">
      <div className="flex items-center justify-between w-full mb-3 text-xs text-muted-foreground font-mono">
        <span>Live Canvas Simulation</span>
        <span>
          {Math.round(pageWidth)} × {Math.round(pageHeight)} pt ({isLandscape ? "Landscape" : "Portrait"})
        </span>
      </div>

      <div
        className="relative bg-card border-2 border-border rounded shadow-md overflow-hidden transition-all flex items-center justify-center"
        style={{ width: previewWidth, height: previewHeight }}
      >
        {options.mode === "crop" && (
          <>
            {/* Shaded margin overlays */}
            <div
              className="absolute top-0 left-0 right-0 bg-destructive/15 border-b border-destructive/40 transition-all pointer-events-none"
              style={{ height: `${cropTopPct}%` }}
            />
            <div
              className="absolute bottom-0 left-0 right-0 bg-destructive/15 border-t border-destructive/40 transition-all pointer-events-none"
              style={{ height: `${cropBottomPct}%` }}
            />
            <div
              className="absolute top-0 bottom-0 left-0 bg-destructive/15 border-r border-destructive/40 transition-all pointer-events-none"
              style={{ width: `${cropLeftPct}%` }}
            />
            <div
              className="absolute top-0 bottom-0 right-0 bg-destructive/15 border-l border-destructive/40 transition-all pointer-events-none"
              style={{ width: `${cropRightPct}%` }}
            />

            {/* Remaining active page content zone */}
            <div
              className="absolute border border-dashed border-primary bg-primary/5 flex items-center justify-center text-xs font-semibold text-primary"
              style={{
                top: `${cropTopPct}%`,
                bottom: `${cropBottomPct}%`,
                left: `${cropLeftPct}%`,
                right: `${cropRightPct}%`,
              }}
            >
              Active Area
            </div>
          </>
        )}

        {options.mode === "resize_standard" && (
          <div className="text-center p-4">
            <span className="text-xs uppercase font-bold tracking-wider text-primary block">
              Resize to {options.standardSize || "A4"}
            </span>
            <span className="text-[11px] text-muted-foreground mt-1 block">
              Content scaled & centered to fit standard paper dimensions.
            </span>
          </div>
        )}

        {options.mode === "scale_factor" && (
          <div className="text-center p-4">
            <span className="text-xl font-black text-primary block">
              {Math.round((options.scaleFactor ?? 1) * 100)}%
            </span>
            <span className="text-[11px] text-muted-foreground mt-1 block">
              Uniform canvas & vector scale multiplier
            </span>
          </div>
        )}
      </div>

      <p className="text-[11px] text-muted-foreground mt-3 text-center">
        {options.mode === "crop"
          ? `Trimmed Margins: Top: ${top}pt, Bottom: ${bottom}pt, Left: ${left}pt, Right: ${right}pt`
          : options.mode === "resize_standard"
          ? `Target Format: ${options.standardSize || "A4"}`
          : `Scaling factor: ${(options.scaleFactor ?? 1) * 100}%`}
      </p>
    </div>
  );
}
