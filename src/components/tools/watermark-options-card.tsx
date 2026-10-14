"use client";

import React from "react";

export interface WatermarkFormState {
  text: string;
  fontSize: number;
  opacity: number;
  rotationDegrees: number;
  colorHex: string;
}

interface WatermarkOptionsCardProps {
  state: WatermarkFormState;
  onChange: (updates: Partial<WatermarkFormState>) => void;
}

const PRESET_TEXTS = ["CONFIDENTIAL", "DRAFT", "DO NOT COPY", "INTERNAL USE", "SAMPLE"];
const COLOR_OPTIONS = [
  { label: "Muted Gray", value: "#999999" },
  { label: "Alert Red", value: "#dc2626" },
  { label: "Slate Blue", value: "#2563eb" },
  { label: "Amber", value: "#d97706" },
];

export function WatermarkOptionsCard({ state, onChange }: WatermarkOptionsCardProps) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
      <div className="space-y-2">
        <label className="text-xs font-semibold text-foreground">Watermark Text</label>
        <input
          type="text"
          value={state.text}
          onChange={(e) => onChange({ text: e.target.value })}
          placeholder="e.g. CONFIDENTIAL"
          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <div className="flex flex-wrap gap-1.5 pt-1">
          {PRESET_TEXTS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onChange({ text: t })}
              className="px-2 py-0.5 rounded text-[11px] bg-surface-muted hover:bg-border text-muted-foreground border border-border/60 transition-colors"
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground">
            Opacity ({Math.round(state.opacity * 100)}%)
          </label>
          <input
            type="range"
            min="0.05"
            max="0.80"
            step="0.05"
            value={state.opacity}
            onChange={(e) => onChange({ opacity: parseFloat(e.target.value) })}
            className="w-full accent-primary"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground">Rotation</label>
          <select
            value={state.rotationDegrees}
            onChange={(e) => onChange({ rotationDegrees: parseInt(e.target.value) })}
            className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background text-xs text-foreground"
          >
            <option value="45">45° (Diagonal Up)</option>
            <option value="-45">-45° (Diagonal Down)</option>
            <option value="0">0° (Horizontal)</option>
            <option value="90">90° (Vertical)</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground">Color</label>
          <div className="flex items-center gap-2 pt-1">
            {COLOR_OPTIONS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => onChange({ colorHex: c.value })}
                className={`size-6 rounded-full border-2 transition-transform ${
                  state.colorHex === c.value ? "scale-110 border-primary" : "border-transparent"
                }`}
                style={{ backgroundColor: c.value }}
                title={c.label}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
