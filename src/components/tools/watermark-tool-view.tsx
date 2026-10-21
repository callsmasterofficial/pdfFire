"use client";

import React, { useState } from "react";
import { Stamp, AlertCircle } from "lucide-react";
import { ToolLayout } from "./tool-layout";
import { ToolActionBar } from "./tool-action-bar";
import { SharedDropzone } from "@/components/file-handling/shared-dropzone";
import { ResultPreviewSection } from "@/components/preview/result-preview-section";
import {
  WatermarkOptionsCard,
  WatermarkFormState,
} from "./watermark-options-card";
import { applyWatermarkToPdf, WatermarkResult } from "@/lib/pdf/operations/watermark";
import { downloadPdfBytes } from "@/lib/pdf/download";

const INITIAL_STATE: WatermarkFormState = {
  text: "CONFIDENTIAL",
  fontSize: 48,
  opacity: 0.25,
  rotationDegrees: 45,
  colorHex: "#999999",
};

export function WatermarkToolView() {
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<WatermarkFormState>(INITIAL_STATE);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<WatermarkResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpdate = (updates: Partial<WatermarkFormState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  const handleApply = async () => {
    if (!file || !state.text.trim()) return;
    setIsProcessing(true);
    setError(null);
    try {
      const res = await applyWatermarkToPdf(file, {
        type: "text",
        text: state.text.trim(),
        fontSize: state.fontSize,
        opacity: state.opacity,
        rotationDegrees: state.rotationDegrees,
        colorHex: state.colorHex,
        outputFileName: `watermarked-${file.name}`,
      });
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to apply watermark.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    downloadPdfBytes(result.pdfBytes, result.fileName);
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setError(null);
    setState(INITIAL_STATE);
  };

  return (
    <ToolLayout
      title="Watermark PDF"
      description="Apply high-clarity diagonal or horizontal text watermarks across document pages in browser memory."
      icon={Stamp}
      category="Edit"
    >
      <div className="space-y-6">
        {!file ? (
          <SharedDropzone onFileSelect={(f) => setFile(f)} />
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-3.5 rounded-lg border border-border bg-surface text-xs">
              <span className="font-medium text-foreground truncate max-w-sm">{file.name}</span>
              <span className="text-muted-foreground font-mono">
                {(file.size / 1024).toFixed(1)} KB
              </span>
            </div>

            <WatermarkOptionsCard state={state} onChange={handleUpdate} />

            {error && (
              <div className="p-3.5 rounded-lg border border-destructive/20 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
                <AlertCircle className="size-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {result && (
              <ResultPreviewSection
                pdfBytes={result.pdfBytes}
                fileName={result.fileName}
                pageCount={result.pageCount}
                title="Watermarked Document Preview"
                onDownload={handleDownload}
              />
            )}

            <ToolActionBar
              actionLabel="Apply Watermark"
              isProcessing={isProcessing}
              canExecute={!!file && state.text.trim().length > 0}
              isDone={!!result}
              resultFileName={result?.fileName}
              onExecute={handleApply}
              onDownload={handleDownload}
              onReset={handleReset}
            />
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
