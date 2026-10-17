"use client";

import React, { useRef, useState, useCallback } from "react";
import { RotateCcw, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SignCanvasPadProps {
  onSignatureChange: (dataUrl: string | null) => void;
}

const INK_COLORS = [
  { name: "Charcoal", value: "#171614" },
  { name: "Navy", value: "#1E3A8A" },
  { name: "Crimson", value: "#991B1B" },
];

export function SignCanvasPad({ onSignatureChange }: SignCanvasPadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokeColor, setStrokeColor] = useState(INK_COLORS[0].value);
  const lineWidth = 3;
  const [history, setHistory] = useState<ImageData[]>([]);
  const [hasStrokes, setHasStrokes] = useState(false);

  const exportSignature = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onSignatureChange(canvas.toDataURL("image/png"));
  }, [onSignatureChange]);

  const saveHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const state = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => [...prev.slice(-10), state]);
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    saveHistory();
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    setIsDrawing(true);
    setHasStrokes(true);
    canvas.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    setIsDrawing(false);
    canvasRef.current?.releasePointerCapture(e.pointerId);
    exportSignature();
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHistory([]);
    setHasStrokes(false);
    onSignatureChange(null);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prev = history[history.length - 1];
    ctx.putImageData(prev, 0, 0);
    setHistory((h) => h.slice(0, -1));
    exportSignature();
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="relative border-2 border-dashed border-border rounded-xl bg-surface p-2 overflow-hidden shadow-xs">
        <canvas
          ref={canvasRef}
          width={560}
          height={200}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="w-full h-44 cursor-crosshair touch-none rounded-lg"
        />
        {!hasStrokes && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-muted-foreground/40 font-mono text-sm">
            Draw your signature here with stylus or mouse...
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-muted-foreground">Ink:</span>
          {INK_COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setStrokeColor(c.value)}
              className="size-6 rounded-full border border-border flex items-center justify-center transition-transform hover:scale-110"
              style={{ backgroundColor: c.value }}
              title={c.name}
            >
              {strokeColor === c.value && <Check className="size-3 text-white" />}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleUndo}
            disabled={history.length === 0}
            className="h-7 text-xs gap-1"
          >
            <RotateCcw className="size-3" /> Undo
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClear}
            disabled={!hasStrokes}
            className="h-7 text-xs gap-1 text-destructive hover:text-destructive"
          >
            <Trash2 className="size-3" /> Clear
          </Button>
        </div>
      </div>
    </div>
  );
}
