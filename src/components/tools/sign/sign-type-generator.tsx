"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Check } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SignTypeGeneratorProps {
  onSignatureChange: (dataUrl: string | null) => void;
}

const INK_COLORS = [
  { name: "Charcoal", value: "#171614" },
  { name: "Navy", value: "#1E3A8A" },
  { name: "Crimson", value: "#991B1B" },
];

const STYLES = [
  { id: "script", label: "Classic Script", font: "italic 36px 'Times New Roman', serif" },
  { id: "fluent", label: "Fluent Brush", font: "italic 38px 'Georgia', serif" },
  { id: "formal", label: "Formal Calligraphy", font: "italic 34px 'Palatino', serif" },
  { id: "modern", label: "Modern Flow", font: "italic 34px 'Courier New', monospace" },
];

export function SignTypeGenerator({ onSignatureChange }: SignTypeGeneratorProps) {
  const [typedText, setTypedText] = useState("Alex Morgan");
  const [selectedStyle, setSelectedStyle] = useState(STYLES[0].id);
  const [inkColor, setInkColor] = useState(INK_COLORS[0].value);

  const generateSignatureImage = useCallback(
    (text: string, styleId: string, color: string) => {
      if (!text.trim()) {
        onSignatureChange(null);
        return;
      }
      const style = STYLES.find((s) => s.id === styleId) || STYLES[0];
      const canvas = document.createElement("canvas");
      canvas.width = 500;
      canvas.height = 140;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = color;
      ctx.font = style.font;
      ctx.textBaseline = "middle";

      const textMetrics = ctx.measureText(text);
      const startX = Math.max(20, (canvas.width - textMetrics.width) / 2);
      ctx.fillText(text, startX, 70);

      // Subtle underline stroke on script style
      if (styleId === "fluent" || styleId === "script") {
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.moveTo(startX - 10, 95);
        ctx.lineTo(startX + textMetrics.width + 15, 95);
        ctx.stroke();
      }

      onSignatureChange(canvas.toDataURL("image/png"));
    },
    [onSignatureChange]
  );

  useEffect(() => {
    generateSignatureImage(typedText, selectedStyle, inkColor);
  }, [typedText, selectedStyle, inkColor, generateSignatureImage]);

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-foreground">Type your name or initials</label>
        <Input
          value={typedText}
          onChange={(e) => setTypedText(e.target.value)}
          placeholder="e.g. Alex Morgan"
          maxLength={40}
          className="h-10 text-sm font-medium bg-surface"
        />
      </div>

      <div className="flex items-center gap-2 text-xs">
        <span className="font-semibold text-muted-foreground">Ink Color:</span>
        {INK_COLORS.map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => setInkColor(c.value)}
            className="size-6 rounded-full border border-border flex items-center justify-center transition-transform hover:scale-110"
            style={{ backgroundColor: c.value }}
          >
            {inkColor === c.value && <Check className="size-3 text-white" />}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {STYLES.map((style) => (
          <button
            key={style.id}
            type="button"
            onClick={() => setSelectedStyle(style.id)}
            className={`p-4 rounded-xl border text-center transition-all flex flex-col items-center justify-center min-h-[90px] ${
              selectedStyle === style.id
                ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                : "border-border bg-surface hover:border-foreground/30"
            }`}
          >
            <span
              className="text-xl leading-tight truncate max-w-full px-2"
              style={{
                fontFamily: style.font.split("'")[1],
                fontStyle: "italic",
                color: inkColor,
              }}
            >
              {typedText.trim() || "Signature"}
            </span>
            <span className="text-[10px] text-muted-foreground mt-2 font-mono uppercase tracking-wider">
              {style.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
