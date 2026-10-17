import React from "react";
import { ExtractImagesOptions } from "@/lib/pdf/operations/extract-images";
import { SlidersHorizontal, Filter } from "lucide-react";

interface ExtractImagesSettingsProps {
  options: ExtractImagesOptions;
  onChange: (options: ExtractImagesOptions) => void;
  disabled?: boolean;
}

export function ExtractImagesSettings({
  options,
  onChange,
  disabled = false,
}: ExtractImagesSettingsProps) {
  const update = (patch: Partial<ExtractImagesOptions>) => onChange({ ...options, ...patch });

  return (
    <div className="bg-card p-4 rounded-xl border border-border space-y-4">
      <div className="flex items-center gap-2">
        <SlidersHorizontal className="size-4 text-primary" />
        <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
          Extraction Filters & Sizing
        </h4>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-foreground block mb-1 flex items-center gap-1.5">
            <Filter className="size-3 text-muted-foreground" />
            <span>Minimum Image Dimensions</span>
          </label>
          <select
            disabled={disabled}
            value={options.minWidth || 1}
            onChange={(e) => {
              const val = Number(e.target.value);
              update({ minWidth: val, minHeight: val });
            }}
            className="w-full text-xs bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-primary focus:outline-none disabled:opacity-50"
          >
            <option value={1}>Extract All Images (Include 1px icons/spacers)</option>
            <option value={32}>Filter Tiny Icons (≥ 32 × 32 px)</option>
            <option value={100}>Substantial Graphics (≥ 100 × 100 px)</option>
            <option value={250}>High-Res Photos Only (≥ 250 × 250 px)</option>
          </select>
          <p className="text-[11px] text-muted-foreground mt-1">
            Filters out transparent spacers, line bullets, and tracking pixels.
          </p>
        </div>

        <div>
          <label className="text-xs font-semibold text-foreground block mb-1">
            Output Encoding
          </label>
          <div className="p-2.5 rounded-lg border border-border bg-muted/20 text-xs text-foreground space-y-1">
            <div className="flex items-center justify-between font-medium">
              <span>Lossless Original Fidelity</span>
              <span className="text-[10px] font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                PNG / JPEG
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Directly preserves original embedded JPEG bytes or converts raster vectors to PNG with alpha transparency.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
