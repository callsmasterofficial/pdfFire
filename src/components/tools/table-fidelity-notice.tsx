"use client";

import React from "react";
import { TableProperties } from "lucide-react";
import type { TableFidelityReport } from "@/lib/pdf/text/table-cell-layout";

const MAX_SHOWN = 2;
const PREVIEW_LENGTH = 60;

/**
 * Reports table cells that did not fit their column even after wrapping.
 *
 * Cells used to be cut at a fixed character count with no warning at all, so
 * the remaining loss is surfaced rather than left for the reader to notice.
 */
export function TableFidelityNotice({ report }: { report: TableFidelityReport }) {
  if (report.truncatedCells === 0) return null;

  const preview = report.examples
    .slice(0, MAX_SHOWN)
    .map((value) =>
      value.length > PREVIEW_LENGTH ? `${value.slice(0, PREVIEW_LENGTH)}…` : value
    );

  return (
    <div
      role="status"
      className="flex items-start gap-2.5 p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/5 text-sm text-amber-700 dark:text-amber-400"
    >
      <TableProperties className="size-4 mt-0.5 shrink-0" aria-hidden="true" />
      <div className="space-y-1">
        <p className="font-medium">
          {report.truncatedCells === 1
            ? "1 table cell was too long to fit its column."
            : `${report.truncatedCells} table cells were too long to fit their columns.`}
        </p>
        <p>
          Their text wrapped as far as the row allows and the rest was cut. Widen the column in the
          source document, or split the content across columns, to keep all of it.
        </p>
        {preview.length > 0 && (
          <ul className="list-disc pl-5 text-xs opacity-90">
            {preview.map((value, index) => (
              <li key={index}>{value}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
