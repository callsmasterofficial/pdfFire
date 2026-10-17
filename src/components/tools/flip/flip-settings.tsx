import React from "react";
import { FlipOptions } from "@/lib/pdf/operations/flip";
import { FlipHorizontal, FlipVertical, RefreshCw } from "lucide-react";

interface FlipSettingsProps {
  options: FlipOptions;
  onChange: (options: FlipOptions) => void;
  totalPages: number;
}

export function FlipSettings({ options, onChange, totalPages }: FlipSettingsProps) {
  const update = (patch: Partial<FlipOptions>) => onChange({ ...options, ...patch });

  return (
    <div className="space-y-5 bg-card p-5 rounded-xl border border-border">
      <div>
        <label className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-2">
          Flip Orientation & Axis
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => update({ direction: "horizontal" })}
            className={`p-3 text-center rounded-lg border transition-all flex flex-col items-center justify-center gap-1.5 ${
              options.direction === "horizontal"
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-muted/40 hover:bg-muted text-foreground border-border"
            }`}
          >
            <FlipHorizontal className="size-5" />
            <div className="font-bold text-xs">Horizontal</div>
            <div className="text-[10px] opacity-75">Mirror (L ↔ R)</div>
          </button>

          <button
            type="button"
            onClick={() => update({ direction: "vertical" })}
            className={`p-3 text-center rounded-lg border transition-all flex flex-col items-center justify-center gap-1.5 ${
              options.direction === "vertical"
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-muted/40 hover:bg-muted text-foreground border-border"
            }`}
          >
            <FlipVertical className="size-5" />
            <div className="font-bold text-xs">Vertical</div>
            <div className="text-[10px] opacity-75">Upside-Down</div>
          </button>

          <button
            type="button"
            onClick={() => update({ direction: "both" })}
            className={`p-3 text-center rounded-lg border transition-all flex flex-col items-center justify-center gap-1.5 ${
              options.direction === "both"
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-muted/40 hover:bg-muted text-foreground border-border"
            }`}
          >
            <RefreshCw className="size-5" />
            <div className="font-bold text-xs">Both Axes</div>
            <div className="text-[10px] opacity-75">180° Inverted</div>
          </button>
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-foreground block mb-1.5">
          Apply to Pages ({totalPages})
        </label>
        <select
          value={options.pageScope || "all"}
          onChange={(e) => update({ pageScope: e.target.value as FlipOptions["pageScope"] })}
          className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
        >
          <option value="all">All Pages ({totalPages})</option>
          <option value="odd">Odd Pages Only (1, 3, 5...)</option>
          <option value="even">Even Pages Only (2, 4, 6...)</option>
        </select>
      </div>

      <div className="p-3 bg-muted/40 rounded-lg border border-border">
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          <strong>Tip:</strong> Horizontal mirroring is required when printing iron-on T-shirt transfer paper, acetate transparencies, or acrylic signs so text reads correctly after transfer.
        </p>
      </div>
    </div>
  );
}
