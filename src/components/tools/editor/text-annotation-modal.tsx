"use client";

import React, { useState, useEffect, useRef } from "react";
import { Type, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TextAnnotationModalProps {
  isOpen: boolean;
  initialColor?: string;
  initialFontSize?: number;
  onConfirm: (text: string, fontSize: number, colorHex: string) => void;
  onClose: () => void;
}

const PRESETS = ["Review Note", "Approved", "Confidential", "Draft", "Important"];
const COLORS = ["#1e293b", "#dc2626", "#c85a32", "#2563eb", "#16a34a"];
const FONT_SIZES = [14, 16, 20, 24, 32];

export function TextAnnotationModal({
  isOpen,
  initialColor = "#dc2626",
  initialFontSize = 16,
  onConfirm,
  onClose,
}: TextAnnotationModalProps) {
  const [text, setText] = useState("");
  const [color, setColor] = useState(initialColor);
  const [fontSize, setFontSize] = useState(initialFontSize);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setText("");
      setColor(initialColor);
      setFontSize(initialFontSize);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, initialColor, initialFontSize]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isOpen && e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (text.trim()) onConfirm(text.trim(), fontSize, color);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="w-full max-w-md bg-surface border border-border rounded-2xl shadow-xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Type className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Add Text Note</h3>
              <p className="text-[11px] text-muted-foreground">Type text to place at chosen coordinates</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-muted"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter note or label..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setText(p)}
                  className="px-2 py-0.5 rounded text-[11px] bg-surface-muted hover:bg-border text-muted-foreground border border-border/50 transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 pt-1">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">Font Size</label>
              <div className="flex items-center gap-1">
                {FONT_SIZES.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setFontSize(size)}
                    className={`px-2 py-1 rounded text-xs transition-colors ${
                      fontSize === size
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "bg-surface-muted text-muted-foreground hover:bg-border"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">Color</label>
              <div className="flex items-center gap-1.5 pt-0.5">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`size-5 rounded-full border-2 transition-transform ${
                      color === c ? "scale-125 border-primary" : "border-transparent"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              size="sm"
              disabled={!text.trim()}
              className="bg-primary text-primary-foreground shadow-xs"
            >
              Insert Note
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
