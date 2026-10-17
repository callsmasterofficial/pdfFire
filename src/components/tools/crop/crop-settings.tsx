import React from "react";
import { CropResizeOptions } from "@/lib/pdf/operations/crop";

interface CropSettingsProps {
  options: CropResizeOptions;
  onChange: (options: CropResizeOptions) => void;
  totalPages: number;
}

const SCALE_PRESETS = [0.5, 0.75, 1.25, 1.5, 2.0];

export function CropSettings({ options, onChange, totalPages }: CropSettingsProps) {
  const update = (patch: Partial<CropResizeOptions>) => onChange({ ...options, ...patch });

  const updateMargin = (edge: "top" | "bottom" | "left" | "right", value: number) => {
    update({
      cropMargins: {
        top: options.cropMargins?.top ?? 0,
        bottom: options.cropMargins?.bottom ?? 0,
        left: options.cropMargins?.left ?? 0,
        right: options.cropMargins?.right ?? 0,
        [edge]: Math.max(0, value),
      },
    });
  };

  const applyPreset = (pts: number) => {
    update({ cropMargins: { top: pts, bottom: pts, left: pts, right: pts } });
  };

  return (
    <div className="space-y-5 bg-card p-5 rounded-xl border border-border">
      {/* Mode Tabs */}
      <div className="flex rounded-lg border border-border overflow-hidden p-0.5 bg-muted/40">
        {[
          { key: "crop", label: "Trim Margins" },
          { key: "resize_standard", label: "Standard Paper" },
          { key: "scale_factor", label: "Scale Factor" },
        ].map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => update({ mode: m.key as CropResizeOptions["mode"] })}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
              options.mode === m.key
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Mode 1: Crop Margins */}
      {options.mode === "crop" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-foreground">Trim Presets</label>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => applyPreset(28)}
                className="text-[11px] px-2 py-1 rounded bg-muted hover:bg-muted/80 text-foreground"
              >
                10mm
              </button>
              <button
                type="button"
                onClick={() => applyPreset(36)}
                className="text-[11px] px-2 py-1 rounded bg-muted hover:bg-muted/80 text-foreground"
              >
                0.5 in
              </button>
              <button
                type="button"
                onClick={() => applyPreset(0)}
                className="text-[11px] px-2 py-1 rounded bg-muted hover:bg-muted/80 text-foreground"
              >
                Reset
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Top (pt)", edge: "top" },
              { label: "Bottom (pt)", edge: "bottom" },
              { label: "Left (pt)", edge: "left" },
              { label: "Right (pt)", edge: "right" },
            ].map(({ label, edge }) => (
              <div key={edge}>
                <span className="text-[11px] text-muted-foreground block mb-1">{label}</span>
                <input
                  type="number"
                  min="0"
                  step="5"
                  value={options.cropMargins?.[edge as keyof NonNullable<CropResizeOptions["cropMargins"]>] ?? 0}
                  onChange={(e) =>
                    updateMargin(edge as "top" | "bottom" | "left" | "right", Number(e.target.value))
                  }
                  className="w-full text-sm bg-background border border-border rounded-lg px-2.5 py-1.5 text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mode 2: Standard Paper */}
      {options.mode === "resize_standard" && (
        <div>
          <label className="text-xs font-semibold text-foreground block mb-1.5">Target Paper Standard</label>
          <select
            value={options.standardSize || "A4"}
            onChange={(e) => update({ standardSize: e.target.value as CropResizeOptions["standardSize"] })}
            className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
          >
            <option value="A4">A4 (210 × 297 mm)</option>
            <option value="LETTER">US Letter (8.5 × 11 in)</option>
            <option value="A3">A3 (297 × 420 mm)</option>
            <option value="A5">A5 (148 × 210 mm)</option>
          </select>
        </div>
      )}

      {/* Mode 3: Scale Factor */}
      {options.mode === "scale_factor" && (
        <div>
          <label className="text-xs font-semibold text-foreground block mb-2">Scale Multiplier</label>
          <div className="grid grid-cols-5 gap-1.5">
            {SCALE_PRESETS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => update({ scaleFactor: f })}
                className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                  (options.scaleFactor ?? 1) === f
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/40 hover:bg-muted text-foreground border-border"
                }`}
              >
                {Math.round(f * 100)}%
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Page Scope */}
      <div>
        <label className="text-xs font-semibold text-foreground block mb-1.5">Apply to Pages ({totalPages})</label>
        <select
          value={options.pageScope || "all"}
          onChange={(e) => update({ pageScope: e.target.value as CropResizeOptions["pageScope"] })}
          className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
        >
          <option value="all">All Pages ({totalPages})</option>
          <option value="odd">Odd Pages Only (1, 3, 5...)</option>
          <option value="even">Even Pages Only (2, 4, 6...)</option>
        </select>
      </div>
    </div>
  );
}
