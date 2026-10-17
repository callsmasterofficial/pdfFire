"use client";

import React, { useRef } from "react";
import { Move, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SignPreviewCanvasProps {
  signatureDataUrl: string;
  posX: number;
  posY: number;
  sigWidth: number;
  onPositionChange: (x: number, y: number) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (p: number) => void;
  signerName?: string;
  signDate?: string;
}

export function SignPreviewCanvas({
  signatureDataUrl,
  posX,
  posY,
  sigWidth,
  onPositionChange,
  currentPage,
  totalPages,
  onPageChange,
  signerName,
  signDate,
}: SignPreviewCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clampedX = Math.max(5, Math.min(85, ((e.clientX - rect.left) / rect.width) * 100));
    const clampedY = Math.max(5, Math.min(85, ((e.clientY - rect.top) / rect.height) * 100));
    onPositionChange(clampedX, clampedY);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  return (
    <div className="flex-1 w-full flex flex-col items-center">
      <div
        ref={containerRef}
        className="relative w-full max-w-sm aspect-[1/1.4] bg-surface rounded-xl border border-border shadow-md overflow-hidden select-none"
      >
        {/* Document simulation mock lines */}
        <div className="p-8 space-y-4 opacity-20 pointer-events-none">
          <div className="h-4 bg-foreground rounded w-1/3" />
          <div className="h-2.5 bg-foreground rounded w-full" />
          <div className="h-2.5 bg-foreground rounded w-5/6" />
          <div className="h-2.5 bg-foreground rounded w-4/6" />
          <div className="h-20 bg-foreground/10 rounded w-full my-6" />
          <div className="h-2.5 bg-foreground rounded w-full" />
          <div className="h-2.5 bg-foreground rounded w-3/4" />
        </div>

        {/* Draggable signature overlay stamp */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          style={{ left: `${posX}%`, top: `${posY}%`, width: `${sigWidth}px` }}
          className="absolute cursor-grab active:cursor-grabbing p-1.5 rounded-lg border-2 border-primary/70 bg-primary/10 backdrop-blur-2xs shadow-sm touch-none"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={signatureDataUrl} alt="Signature" className="w-full pointer-events-none select-none" />
          {(signerName || signDate) && (
            <div className="text-[9px] text-foreground font-mono truncate text-center mt-0.5">
              {signerName && <span>{signerName} • </span>}
              {signDate}
            </div>
          )}
          <div className="absolute -top-2.5 -right-2.5 size-5 rounded-full bg-primary text-white flex items-center justify-center text-[10px] shadow-xs">
            <Move className="size-2.5" />
          </div>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-3 mt-3 text-xs">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            className="h-7 px-2"
          >
            <ChevronLeft className="size-3.5" />
          </Button>
          <span className="font-mono text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            className="h-7 px-2"
          >
            <ChevronRight className="size-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
