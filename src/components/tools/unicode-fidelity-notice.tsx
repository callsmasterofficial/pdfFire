"use client";

import React from "react";
import { Languages, AlertTriangle, Info } from "lucide-react";
import type { UnicodeFidelityReport } from "@/lib/pdf/text/unicode-text";

const MAX_SHOWN = 8;

function formatBytes(bytes: number): string {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  return `${Math.round(bytes / 1000)} KB`;
}

/**
 * Reports which language packs a conversion used and what it still could not
 * draw.
 *
 * Packs are downloaded on demand, so their size is worth showing. Where
 * shaping prevents text being copied back out exactly, that is stated rather
 * than left for the reader to discover.
 */
export function UnicodeFidelityNotice({ report }: { report: UnicodeFidelityReport }) {
  const hasPacks = report.packsUsed.length > 0;
  const approximate = report.approximateExtractionPacks;
  if (!hasPacks && report.isLossless) return null;

  return (
    <div className="space-y-2">
      {hasPacks && (
        <div
          role="status"
          className="flex items-start gap-2.5 p-3.5 rounded-xl border border-border bg-muted/40 text-sm text-muted-foreground"
        >
          <Languages className="size-4 mt-0.5 shrink-0" aria-hidden="true" />
          <p>
            Rendered with the{" "}
            {report.packsUsed
              .map((pack) => `${pack.label} (${formatBytes(pack.bytes)})`)
              .join(", ")}{" "}
            language {report.packsUsed.length === 1 ? "pack" : "packs"}, downloaded for this
            document and then cached.
          </p>
        </div>
      )}

      {approximate.length > 0 && (
        <div
          role="status"
          className="flex items-start gap-2.5 p-3.5 rounded-xl border border-border bg-muted/40 text-sm text-muted-foreground"
        >
          <Info className="size-4 mt-0.5 shrink-0" aria-hidden="true" />
          <p>
            {approximate.map((pack) => pack.label).join(" and ")} text is drawn correctly, but
            copying or searching it in the finished PDF may not return it exactly: shaping these
            scripts reorders and merges letterforms in ways a PDF&apos;s character mapping cannot
            fully reverse.
          </p>
        </div>
      )}

      {report.unsupportedCharacters.length > 0 && (
        <div
          role="status"
          className="flex items-start gap-2.5 p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/5 text-sm text-amber-700 dark:text-amber-400"
        >
          <AlertTriangle className="size-4 mt-0.5 shrink-0" aria-hidden="true" />
          <p>
            No language pack covers{" "}
            {report.unsupportedCharacters.slice(0, MAX_SHOWN).join(" ")}
            {report.unsupportedCharacters.length > MAX_SHOWN
              ? ` (+${report.unsupportedCharacters.length - MAX_SHOWN} more)`
              : ""}
            , so {report.unsupportedCharacters.length === 1 ? "it was" : "they were"} replaced with
            &ldquo;?&rdquo;.
          </p>
        </div>
      )}
    </div>
  );
}
