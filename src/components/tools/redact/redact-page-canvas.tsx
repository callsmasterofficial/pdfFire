"use client";

import React, { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { getPdfjs, getLocalCmapAndFontConfig } from "@/lib/pdf/pdfjs-init";
import { renderPageToCanvas } from "@/lib/pdf/renderer";
import { RedactionArea } from "@/lib/pdf/operations/redact";

interface RedactPageCanvasProps {
  pdfBytes: Uint8Array;
  currentPage: number;
  totalPages: number;
  onPageChange: (p: number) => void;
  redactions: RedactionArea[];
  onAddRedaction: (r: RedactionArea) => void;
  onRemoveRedaction: (id: string) => void;
  fillColor: NonNullable<RedactionArea["fillColor"]>;
  overlayText: string;
}

export function RedactPageCanvas({
  pdfBytes,
  currentPage,
  totalPages,
  onPageChange,
  redactions,
  onAddRedaction,
  onRemoveRedaction,
  fillColor,
  overlayText,
}: RedactPageCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [pageSize, setPageSize] = useState({ width: 595, height: 842 });
  const [drawingStart, setDrawingStart] = useState<{ x: number; y: number } | null>(null);
  const [currentBox, setCurrentBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  useEffect(() => {
    let cancel = false;
    const render = async () => {
      try {
        const pdfjs = await getPdfjs();
        const fontConfig = getLocalCmapAndFontConfig();
        const doc = await pdfjs.getDocument({ data: pdfBytes, ...fontConfig }).promise;
        const page = await doc.getPage(currentPage);
        if (cancel || !canvasRef.current) return;

        setPageSize({ width: page.view[2] - page.view[0], height: page.view[3] - page.view[1] });
        const task = renderPageToCanvas(page, canvasRef.current, { scale: 1.5 });
        await task.promise;
      } catch (err) {
        console.error("Failed to render page for redaction:", err);
      }
    };
    render();
    return () => { cancel = true; };
  }, [pdfBytes, currentPage]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setDrawingStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!drawingStart || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const curX = e.clientX - rect.left;
    const curY = e.clientY - rect.top;
    setCurrentBox({
      x: Math.min(drawingStart.x, curX),
      y: Math.min(drawingStart.y, curY),
      w: Math.abs(curX - drawingStart.x),
      h: Math.abs(curY - drawingStart.y),
    });
  };

  const handleMouseUp = () => {
    if (drawingStart && currentBox && currentBox.w > 5 && currentBox.h > 5 && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const scaleX = pageSize.width / rect.width;
      const scaleY = pageSize.height / rect.height;

      const pdfX = currentBox.x * scaleX;
      const pdfY = pageSize.height - (currentBox.y + currentBox.h) * scaleY;
      const pdfW = currentBox.w * scaleX;
      const pdfH = currentBox.h * scaleY;

      onAddRedaction({
        id: `manual-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        pageNumber: currentPage,
        x: pdfX,
        y: pdfY,
        width: pdfW,
        height: pdfH,
        fillColor,
        overlayText,
      });
    }
    setDrawingStart(null);
    setCurrentBox(null);
  };

  const pageRedactions = redactions.filter((r) => r.pageNumber === currentPage);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center justify-between w-full max-w-lg px-2">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="p-1 rounded-lg border border-border bg-card hover:bg-muted disabled:opacity-40"
        >
          <ChevronLeft className="size-4" />
        </button>
        <span className="text-xs font-mono font-medium text-foreground">
          Page {currentPage} of {totalPages} (Click & drag to draw redaction box)
        </span>
        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="p-1 rounded-lg border border-border bg-card hover:bg-muted disabled:opacity-40"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="relative border-2 border-border rounded-lg shadow-md cursor-crosshair overflow-hidden select-none bg-card"
        style={{ width: "min(100%, 500px)", aspectRatio: `${pageSize.width} / ${pageSize.height}` }}
      >
        <canvas ref={canvasRef} className="w-full h-full object-contain pointer-events-none" />

        {/* Existing Redaction Overlays */}
        {pageRedactions.map((r) => {
            const left = (r.x / pageSize.width) * 100;
            const top = ((pageSize.height - r.y - r.height) / pageSize.height) * 100;
            const width = (r.width / pageSize.width) * 100;
            const height = (r.height / pageSize.height) * 100;

            return (
              <div
                key={r.id}
                style={{ left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%` }}
                className={`absolute flex items-center justify-center text-[10px] font-bold group border border-destructive/80 transition-all ${
                  r.fillColor === "white"
                    ? "bg-white text-black"
                    : r.fillColor === "charcoal"
                    ? "bg-neutral-800 text-white"
                    : "bg-black text-white"
                }`}
              >
                <span className="truncate px-0.5">{r.overlayText || ""}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveRedaction(r.id);
                  }}
                  className="absolute -top-2 -right-2 size-4 bg-destructive text-destructive-foreground rounded-full hidden group-hover:flex items-center justify-center shadow"
                >
                  <X className="size-2.5" />
                </button>
              </div>
            );
          })}

        {/* Current Dragging Box */}
        {currentBox && (
          <div
            style={{ left: currentBox.x, top: currentBox.y, width: currentBox.w, height: currentBox.h }}
            className="absolute border-2 border-dashed border-destructive bg-destructive/20 pointer-events-none"
          />
        )}
      </div>
    </div>
  );
}
