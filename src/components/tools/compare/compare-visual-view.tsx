"use client";

import React, { useEffect, useRef, useState } from "react";
import { getPdfjs, getLocalCmapAndFontConfig } from "@/lib/pdf/pdfjs-init";
import { renderPageToCanvas } from "@/lib/pdf/renderer";
import { computeVisualDiff, VisualDiffResult } from "@/lib/pdf/operations/compare";
import { Layers, Loader2 } from "lucide-react";

interface CompareVisualViewProps {
  fileA: File | Uint8Array;
  fileB: File | Uint8Array;
  pageNumber: number;
}

export function CompareVisualView({ fileA, fileB, pageNumber }: CompareVisualViewProps) {
  const [isRendering, setIsRendering] = useState(false);
  const [diffStats, setDiffStats] = useState<VisualDiffResult | null>(null);
  const [sliderPos, setSliderPos] = useState(50); // 0 = Doc A, 100 = Doc B / Diff

  const canvasARef = useRef<HTMLCanvasElement>(null);
  const canvasBRef = useRef<HTMLCanvasElement>(null);
  const diffDisplayRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let isCancelled = false;

    async function renderVisualComparison() {
      setIsRendering(true);
      setDiffStats(null);

      try {
        const toUint8 = async (inp: File | Uint8Array): Promise<Uint8Array> => {
          if (inp instanceof File) return new Uint8Array(await inp.arrayBuffer());
          return inp;
        };

        const [bytesA, bytesB] = await Promise.all([toUint8(fileA), toUint8(fileB)]);

        const pdfjs = await getPdfjs();
        const fontConfig = getLocalCmapAndFontConfig();

        const [docA, docB] = await Promise.all([
          pdfjs.getDocument({ data: bytesA, ...fontConfig }).promise,
          pdfjs.getDocument({ data: bytesB, ...fontConfig }).promise,
        ]);

        if (isCancelled) return;

        const pA = Math.min(pageNumber, docA.numPages);
        const pB = Math.min(pageNumber, docB.numPages);

        const [pageProxyA, pageProxyB] = await Promise.all([
          docA.getPage(pA),
          docB.getPage(pB),
        ]);

        if (isCancelled || !canvasARef.current || !canvasBRef.current) return;

        const taskA = renderPageToCanvas(pageProxyA, canvasARef.current, { scale: 0.9 });
        const taskB = renderPageToCanvas(pageProxyB, canvasBRef.current, { scale: 0.9 });
        await Promise.all([taskA.promise, taskB.promise]);

        if (isCancelled) return;

        // Compute pixel diff
        const result = computeVisualDiff(canvasARef.current, canvasBRef.current);
        setDiffStats(result);

        if (diffDisplayRef.current) {
          diffDisplayRef.current.width = result.diffCanvas.width;
          diffDisplayRef.current.height = result.diffCanvas.height;
          diffDisplayRef.current.style.width = canvasARef.current.style.width;
          diffDisplayRef.current.style.height = canvasARef.current.style.height;
          const ctx = diffDisplayRef.current.getContext("2d");
          ctx?.drawImage(result.diffCanvas, 0, 0);
        }
      } catch (err) {
        console.error("Visual diff render error:", err);
      } finally {
        if (!isCancelled) setIsRendering(false);
      }
    }

    renderVisualComparison();
    return () => { isCancelled = true; };
  }, [fileA, fileB, pageNumber]);

  return (
    <div className="space-y-4">
      {/* Visual Diff HUD */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-surface-elevated/60 border border-border text-xs">
        <div className="flex items-center gap-2">
          <Layers className="size-4 text-primary" />
          <span className="font-semibold text-foreground">Pixel Difference Overlay</span>
          {diffStats && (
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-mono text-[11px]">
              {diffStats.diffPercent}% changed pixels
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-[11px]">Diff Opacity:</span>
          <input
            type="range"
            min="0"
            max="100"
            value={sliderPos}
            onChange={(e) => setSliderPos(Number(e.target.value))}
            className="w-24 accent-primary cursor-pointer"
          />
          <span className="font-mono text-[11px] text-foreground w-8">{sliderPos}%</span>
        </div>
      </div>

      {isRendering && (
        <div className="py-12 flex flex-col items-center justify-center gap-2">
          <Loader2 className="size-6 animate-spin text-primary" />
          <span className="text-xs text-muted-foreground">Rendering canvas comparison...</span>
        </div>
      )}

      {/* Canvases View */}
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${isRendering ? "opacity-30" : "opacity-100"}`}>
        {/* Document A Canvas */}
        <div className="flex flex-col items-center rounded-xl border border-border bg-background p-3 shadow-2xs">
          <span className="text-[11px] font-mono text-muted-foreground mb-2">Original (Doc A)</span>
          <div className="relative border border-border/60 shadow-xs max-w-full overflow-hidden rounded-sm">
            <canvas ref={canvasARef} className="max-w-full h-auto block" />
          </div>
        </div>

        {/* Diff Overlay Canvas */}
        <div className="flex flex-col items-center rounded-xl border border-border bg-background p-3 shadow-2xs">
          <span className="text-[11px] font-mono text-muted-foreground mb-2">
            Visual Diff Heatmap ({diffStats?.diffPercent || 0}% change)
          </span>
          <div className="relative border border-border/60 shadow-xs max-w-full overflow-hidden rounded-sm">
            <canvas
              ref={diffDisplayRef}
              style={{ opacity: sliderPos / 100 }}
              className="max-w-full h-auto block transition-opacity duration-150"
            />
            {/* Hidden canvas B used for pixel computation */}
            <canvas ref={canvasBRef} className="hidden" />
          </div>
        </div>
      </div>
    </div>
  );
}
