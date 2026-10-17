import React from "react";
import { AlternateMixOptions } from "@/lib/pdf/operations/alternate-mix";

interface AlternateMixSettingsProps {
  options: AlternateMixOptions;
  onChange: (options: AlternateMixOptions) => void;
  countA: number;
  countB: number;
}

export function AlternateMixSettings({ options, onChange, countA, countB }: AlternateMixSettingsProps) {
  const update = (patch: Partial<AlternateMixOptions>) => onChange({ ...options, ...patch });

  // Generate a preview sequence of first 6 items
  const previewItems: string[] = [];
  const maxPrev = Math.min(6, (countA || 3) + (countB || 3));
  let aIdx = 1;
  let bIdx = options.reverseB ? Math.max(1, countB || 3) : 1;

  for (let i = 0; i < maxPrev; i++) {
    if (i % 2 === 0) {
      previewItems.push(`A${aIdx++}`);
    } else {
      previewItems.push(`B${options.reverseB ? bIdx-- : bIdx++}`);
    }
  }

  return (
    <div className="space-y-4 bg-card p-5 rounded-xl border border-border">
      <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
        Interleaving Modes & Sequence
      </h4>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background cursor-pointer hover:border-primary/40 transition-all select-none">
          <input
            type="checkbox"
            checked={options.reverseB ?? false}
            onChange={(e) => update({ reverseB: e.target.checked })}
            className="accent-primary size-4 rounded"
          />
          <div>
            <span className="text-xs font-bold text-foreground block">Reverse Document B Order</span>
            <span className="text-[11px] text-muted-foreground block">
              Essential for duplex scans where the reverse side was scanned backwards.
            </span>
          </div>
        </label>

        <label className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background cursor-pointer hover:border-primary/40 transition-all select-none">
          <input
            type="checkbox"
            checked={options.reverseA ?? false}
            onChange={(e) => update({ reverseA: e.target.checked })}
            className="accent-primary size-4 rounded"
          />
          <div>
            <span className="text-xs font-bold text-foreground block">Reverse Document A Order</span>
            <span className="text-[11px] text-muted-foreground block">
              Interleave starting from the end of File A.
            </span>
          </div>
        </label>
      </div>

      <div className="p-3 bg-muted/40 rounded-lg border border-border flex flex-col sm:flex-row items-center justify-between gap-3">
        <span className="text-xs font-medium text-foreground">Expected Output Sequence:</span>
        <div className="flex items-center gap-1.5 flex-wrap">
          {previewItems.map((item, idx) => (
            <React.Fragment key={idx}>
              <span
                className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                  item.startsWith("A")
                    ? "bg-primary/10 text-primary border border-primary/30"
                    : "bg-chart-2/10 text-foreground border border-border"
                }`}
              >
                {item}
              </span>
              {idx < previewItems.length - 1 && <span className="text-xs text-muted-foreground">→</span>}
            </React.Fragment>
          ))}
          <span className="text-xs text-muted-foreground">...</span>
        </div>
      </div>
    </div>
  );
}
