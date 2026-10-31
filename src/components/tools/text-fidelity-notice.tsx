"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";
import type { TextFidelityReport } from "@/lib/pdf/text/font-safe-text";

const MAX_SHOWN = 8;

function format(characters: string[]): string {
  const shown = characters.slice(0, MAX_SHOWN).join(" ");
  const extra = characters.length - MAX_SHOWN;
  return extra > 0 ? `${shown} (+${extra} more)` : shown;
}

/**
 * Tells the user which characters the built-in PDF fonts could not draw.
 *
 * Silence here is what made the old behaviour harmful: text was replaced with
 * "?" and the export looked successful.
 */
export function TextFidelityNotice({ report }: { report: TextFidelityReport }) {
  if (report.isLossless) return null;

  return (
    <div
      role="status"
      className="flex items-start gap-2.5 p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/5 text-sm text-amber-700 dark:text-amber-400"
    >
      <AlertTriangle className="size-4 mt-0.5 shrink-0" aria-hidden="true" />
      <div className="space-y-1">
        <p className="font-medium">Some characters could not be rendered exactly.</p>
        {report.approximatedCharacters.length > 0 && (
          <p>
            Drawn without accents: {format(report.approximatedCharacters)}
          </p>
        )}
        {report.droppedCharacters.length > 0 && (
          <p>
            Replaced with “?”: {format(report.droppedCharacters)} — the built-in PDF fonts cannot
            represent these scripts.
          </p>
        )}
      </div>
    </div>
  );
}
