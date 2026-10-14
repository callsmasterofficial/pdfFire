"use client";

import React, { useState } from "react";
import { Hash, AlertCircle } from "lucide-react";
import { ToolLayout } from "./tool-layout";
import { ToolActionBar } from "./tool-action-bar";
import { SharedDropzone } from "@/components/file-handling/shared-dropzone";
import {
  PageNumberOptionsCard,
  PageNumberFormState,
} from "./page-number-options-card";
import {
  addPageNumbersToPdf,
  PageNumberingResult,
} from "@/lib/pdf/operations/page-numbering";
import { downloadPdfBytes } from "@/lib/pdf/download";

const INITIAL_STATE: PageNumberFormState = {
  position: "bottom-center",
  format: "page-of-total",
  startNumber: 1,
  skipFirstPage: false,
  headerText: "",
  footerText: "",
};

export function PageNumberToolView() {
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<PageNumberFormState>(INITIAL_STATE);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<PageNumberingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpdate = (updates: Partial<PageNumberFormState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  const handleApply = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);
    try {
      const res = await addPageNumbersToPdf(file, {
        position: state.position,
        format: state.format,
        startNumber: state.startNumber,
        skipFirstPage: state.skipFirstPage,
        headerText: state.headerText.trim(),
        footerText: state.footerText.trim(),
        outputFileName: `numbered-${file.name}`,
      });
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add page numbers.");
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
      title="Page Numbers, Headers & Footers"
      description="Add clean pagination and custom header/footer labels at flexible page coordinates."
      icon={Hash}
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

            <PageNumberOptionsCard state={state} onChange={handleUpdate} />

            {error && (
              <div className="p-3.5 rounded-lg border border-destructive/20 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
                <AlertCircle className="size-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <ToolActionBar
              actionLabel="Add Page Numbers"
              isProcessing={isProcessing}
              canExecute={!!file}
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
