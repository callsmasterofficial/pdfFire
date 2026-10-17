"use client";

import React, { useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { renderPageToCanvas, ActiveRenderTask } from "@/lib/pdf/renderer";
import { Loader2, AlertCircle } from "lucide-react";

interface PDFCanvasViewProps {
  pdfDoc: PDFDocumentProxy;
  pageNumber: number;
  scale: number;
  rotation: number;
}

export function PDFCanvasView({
  pdfDoc,
  pageNumber,
  scale,
  rotation,
}: PDFCanvasViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [renderError, setRenderError] = useState<string | null>(null);

  useEffect(() => {
    let activeTask: ActiveRenderTask | null = null;
    let isCancelled = false;

    const render = async () => {
      if (!canvasRef.current) return;
      setIsLoading(true);
      setRenderError(null);

      try {
        const page = await pdfDoc.getPage(pageNumber);
        if (isCancelled) return;

        activeTask = renderPageToCanvas(page, canvasRef.current, {
          scale,
          rotation,
        });

        await activeTask.promise;
        if (!isCancelled) {
          setIsLoading(false);
        }
      } catch (err: unknown) {
        if (!isCancelled) {
          const error = err as Error;
          if (error.name !== "RenderingCancelledException") {
            setRenderError(error.message || "Failed to render page.");
          }
          setIsLoading(false);
        }
      }
    };

    render();

    return () => {
      isCancelled = true;
      if (activeTask) {
        activeTask.cancel();
      }
    };
  }, [pdfDoc, pageNumber, scale, rotation]);

  return (
    <div className="flex-1 overflow-auto flex items-center justify-center p-4 sm:p-8 bg-surface-secondary/20 relative min-h-105">
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/40 backdrop-blur-2xs z-10">
          <Loader2 className="size-8 animate-spin text-primary mb-2" />
          <span className="text-xs text-muted-foreground font-mono">
            Rendering Page {pageNumber}...
          </span>
        </div>
      )}

      {renderError ? (
        <div className="flex flex-col items-center justify-center p-6 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive max-w-md text-center">
          <AlertCircle className="size-8 mb-2" />
          <p className="text-sm font-semibold">Render Error</p>
          <p className="text-xs mt-1 text-destructive/80">{renderError}</p>
        </div>
      ) : (
        <div className="relative shadow-md rounded-sm overflow-hidden bg-white border border-border/80 transition-transform duration-100 ease-out">
          <canvas ref={canvasRef} className="block" />
        </div>
      )}
    </div>
  );
}
