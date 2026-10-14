"use client";

import React, { useState } from "react";
import { ScanText, AlertCircle, ShieldCheck } from "lucide-react";
import { ToolLayout } from "./tool-layout";
import { ToolActionBar } from "./tool-action-bar";
import { SharedDropzone } from "@/components/file-handling/shared-dropzone";
import { OcrLanguagePicker } from "./ocr/ocr-language-picker";
import { OcrResultViewer } from "./ocr/ocr-result-viewer";
import { SupportedOcrLanguage, OcrProgress, OcrDocumentResult } from "@/lib/ocr/ocr-types";
import { performOcrOnPdf } from "@/lib/ocr/ocr-engine";
import { createSearchablePdf } from "@/lib/pdf/operations";
import { downloadPdfBytes } from "@/lib/pdf/download";

export function OcrToolView() {
  const [file, setFile] = useState<File | null>(null);
  const [language, setLanguage] = useState<SupportedOcrLanguage>("eng");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<OcrProgress | null>(null);
  const [result, setResult] = useState<OcrDocumentResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRunOcr = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);
    setProgress({ status: "Initializing OCR", progress: 0.05 });

    try {
      const res = await performOcrOnPdf(file, language, (p) => setProgress(p));
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "OCR recognition failed.");
    } finally {
      setIsProcessing(false);
      setProgress(null);
    }
  };

  const handleDownloadSearchablePdf = async () => {
    if (!file || !result) return;
    try {
      const bytes = await file.arrayBuffer();
      const searchable = await createSearchablePdf(bytes, result, `searchable-${file.name}`);
      downloadPdfBytes(searchable.pdfBytes, searchable.fileName);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create searchable PDF.");
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setProgress(null);
    setError(null);
  };

  return (
    <ToolLayout
      title="OCR Scanned PDF"
      description="Extract text from scanned PDFs & images and generate searchable PDFs 100% in your browser."
      icon={ScanText}
      category="Convert"
    >
      <div className="w-full space-y-6">
        <SharedDropzone onFileSelect={(selectedFile) => {
          setFile(selectedFile);
          setResult(null);
        }} />

        {file && (
          <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-6">
            <div className="flex items-center gap-3 border-b border-border/60 pb-4">
              <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <ScanText className="size-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-foreground">{file.name}</h3>
                <p className="text-xs text-muted-foreground font-mono">
                  {(file.size / 1024).toFixed(1)} KB • Client-side Tesseract.js WebAssembly
                </p>
              </div>
            </div>

            <OcrLanguagePicker
              selected={language}
              disabled={isProcessing}
              onSelect={setLanguage}
            />

            {isProcessing && progress && (
              <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-2.5">
                <div className="flex justify-between text-xs font-semibold text-primary">
                  <span>{progress.status}</span>
                  <span>{Math.round(progress.progress * 100)}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-primary/20 overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${Math.round(progress.progress * 100)}%` }}
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-xs flex items-center gap-2">
                <AlertCircle className="size-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {result && (
              <OcrResultViewer
                result={result}
                onDownloadSearchablePdf={handleDownloadSearchablePdf}
                fileName={file.name}
              />
            )}

            <div className="p-3 rounded-xl bg-muted/40 border border-border/40 text-[11px] text-muted-foreground flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary shrink-0" />
              <span>Zero cloud APIs: OCR neural models execute locally inside WebAssembly worker threads.</span>
            </div>

            <ToolActionBar
              actionLabel="Run Local OCR"
              isProcessing={isProcessing}
              canExecute={!!file && !isProcessing}
              isDone={!!result}
              resultFileName={result ? `searchable-${file.name}` : undefined}
              onExecute={handleRunOcr}
              onDownload={handleDownloadSearchablePdf}
              onReset={handleReset}
            />
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
