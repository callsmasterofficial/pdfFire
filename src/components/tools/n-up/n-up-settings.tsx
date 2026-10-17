import React from "react";
import { NUpOptions } from "@/lib/pdf/operations/n-up";

interface NUpSettingsProps {
  options: NUpOptions;
  onChange: (options: NUpOptions) => void;
  totalPages: number;
}

const PRESETS = [
  { n: 2, label: "2-Up", desc: "Side by side" },
  { n: 4, label: "4-Up", desc: "2×2 Quad" },
  { n: 6, label: "6-Up", desc: "Handout" },
  { n: 9, label: "9-Up", desc: "3×3 Grid" },
  { n: 16, label: "16-Up", desc: "Thumbnails" },
] as const;

export function NUpSettings({ options, onChange, totalPages }: NUpSettingsProps) {
  const update = (patch: Partial<NUpOptions>) => onChange({ ...options, ...patch });

  return (
    <div className="space-y-5 bg-card p-5 rounded-xl border border-border">
      <div>
        <label className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-2">
          Pages per Printed Sheet
        </label>
        <div className="grid grid-cols-5 gap-2">
          {PRESETS.map((p) => {
            const isActive = options.pagesPerSheet === p.n;
            return (
              <button
                key={p.n}
                type="button"
                onClick={() => update({ pagesPerSheet: p.n as NUpOptions["pagesPerSheet"] })}
                className={`py-2 px-1 text-center rounded-lg border transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-muted/40 hover:bg-muted text-foreground border-border"
                }`}
              >
                <div className="font-bold text-sm">{p.label}</div>
                <div className="text-[10px] opacity-75">{p.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-foreground block mb-1.5">
            Target Paper Size
          </label>
          <select
            value={options.sheetSize || "A4"}
            onChange={(e) => update({ sheetSize: e.target.value as NUpOptions["sheetSize"] })}
            className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
          >
            <option value="A4">A4 (210 × 297 mm)</option>
            <option value="LETTER">US Letter (8.5 × 11 in)</option>
            <option value="SAME_AS_SOURCE">Match Source Document</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-foreground block mb-1.5">
            Sheet Orientation
          </label>
          <select
            value={options.orientation || "auto"}
            onChange={(e) => update({ orientation: e.target.value as NUpOptions["orientation"] })}
            className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
          >
            <option value="auto">Auto (Best Fit)</option>
            <option value="portrait">Portrait</option>
            <option value="landscape">Landscape</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-foreground block mb-1.5">
            Page Flow Direction
          </label>
          <div className="flex rounded-lg border border-border overflow-hidden p-0.5 bg-muted/30">
            <button
              type="button"
              onClick={() => update({ pageOrder: "horizontal" })}
              className={`flex-1 py-1.5 text-xs font-medium rounded transition-all ${
                options.pageOrder !== "vertical"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Horizontal (Z)
            </button>
            <button
              type="button"
              onClick={() => update({ pageOrder: "vertical" })}
              className={`flex-1 py-1.5 text-xs font-medium rounded transition-all ${
                options.pageOrder === "vertical"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Vertical (N)
            </button>
          </div>
        </div>

        <div className="flex flex-col justify-end space-y-2">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-foreground select-none">
            <input
              type="checkbox"
              checked={options.drawBorders ?? true}
              onChange={(e) => update({ drawBorders: e.target.checked })}
              className="accent-primary rounded size-4"
            />
            Draw page boundary frames
          </label>

          {totalPages === 1 && (
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-foreground select-none">
              <input
                type="checkbox"
                checked={options.repeatSinglePage ?? false}
                onChange={(e) => update({ repeatSinglePage: e.target.checked })}
                className="accent-primary rounded size-4"
              />
              Repeat page across all slots
            </label>
          )}
        </div>
      </div>
    </div>
  );
}
