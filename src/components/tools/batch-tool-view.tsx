"use client";

import React, { useState } from "react";
import { Layers, RotateCw, FileCheck } from "lucide-react";
import { ToolLayout } from "./tool-layout";
import { BatchQueueContainer } from "@/components/batch/batch-queue-container";
import { rotatePdfDocument } from "@/lib/pdf/operations/rotate";
import { extractPdfPages } from "@/lib/pdf/operations/extract";
import { BatchProcessorFn } from "@/types/batch";

type BatchOpType = "rotate-90" | "rotate-180" | "extract-cover";

export function BatchToolView() {
  const [selectedOp, setSelectedOp] = useState<BatchOpType>("rotate-90");

  const processor: BatchProcessorFn = async (file, signal, onProgress) => {
    onProgress(30);
    if (signal.aborted) throw new Error("Operation cancelled");

    if (selectedOp === "rotate-90" || selectedOp === "rotate-180") {
      const angle = selectedOp === "rotate-90" ? 90 : 180;
      onProgress(60);
      const res = await rotatePdfDocument(file, {
        angleDegrees: angle,
        outputFileName: `rotated-${angle}deg-${file.name}`,
      });
      onProgress(100);
      return { resultBytes: res.pdfBytes, resultName: res.fileName };
    }

    if (selectedOp === "extract-cover") {
      onProgress(60);
      const res = await extractPdfPages(file, {
        pageNumbers: [1],
        outputFileName: `cover-${file.name}`,
      });
      onProgress(100);
      return { resultBytes: res.pdfBytes, resultName: res.fileName };
    }

    throw new Error("Unsupported batch operation");
  };

  const getOpTitle = () => {
    switch (selectedOp) {
      case "rotate-90": return "Rotate 90° Clockwise";
      case "rotate-180": return "Rotate 180° Half Turn";
      case "extract-cover": return "Extract First Page";
    }
  };

  return (
    <ToolLayout
      title="Batch PDF Operations"
      description="Queue multiple documents, reorder via drag-and-drop, and process them in bulk with error isolation."
      icon={Layers}
      category="Batch"
    >
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-foreground">Select Batch Action:</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setSelectedOp("rotate-90")}
              className={`flex items-center gap-2.5 p-3.5 rounded-xl border text-left transition-all ${
                selectedOp === "rotate-90"
                  ? "border-primary bg-primary/10 ring-2 ring-primary/40 text-primary font-bold shadow-xs"
                  : "border-border bg-surface text-foreground hover:border-primary/40"
              }`}
            >
              <RotateCw className="size-4 shrink-0 text-primary" />
              <div>
                <p className="text-xs">Batch Rotate 90°</p>
                <p className="text-[10px] text-muted-foreground font-normal">Rotate all queued files 90°</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedOp("rotate-180")}
              className={`flex items-center gap-2.5 p-3.5 rounded-xl border text-left transition-all ${
                selectedOp === "rotate-180"
                  ? "border-primary bg-primary/10 ring-2 ring-primary/40 text-primary font-bold shadow-xs"
                  : "border-border bg-surface text-foreground hover:border-primary/40"
              }`}
            >
              <RotateCw className="size-4 shrink-0 text-primary" />
              <div>
                <p className="text-xs">Batch Rotate 180°</p>
                <p className="text-[10px] text-muted-foreground font-normal">Rotate all queued files 180°</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedOp("extract-cover")}
              className={`flex items-center gap-2.5 p-3.5 rounded-xl border text-left transition-all ${
                selectedOp === "extract-cover"
                  ? "border-primary bg-primary/10 ring-2 ring-primary/40 text-primary font-bold shadow-xs"
                  : "border-border bg-surface text-foreground hover:border-primary/40"
              }`}
            >
              <FileCheck className="size-4 shrink-0 text-primary" />
              <div>
                <p className="text-xs">Extract First Page</p>
                <p className="text-[10px] text-muted-foreground font-normal">Extract cover/P.1 from all</p>
              </div>
            </button>
          </div>
        </div>

        <BatchQueueContainer
          operationName={getOpTitle()}
          processor={processor}
          zipBaseName={`batch-${selectedOp}`}
        />
      </div>
    </ToolLayout>
  );
}
