"use client";

import React, { useState } from "react";
import { FileText, AlertCircle, ShieldCheck } from "lucide-react";
import { ToolLayout } from "./tool-layout";
import { ToolActionBar } from "./tool-action-bar";
import { SharedDropzone } from "@/components/file-handling/shared-dropzone";
import { TextExtractedPreview } from "./text/text-extracted-preview";
import { extractTextFromPdf, ExtractTextResult } from "@/lib/pdf/operations";
import { downloadBlob } from "@/lib/pdf/download";

export function PdfToTextView() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ExtractTextResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExtract = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);
    try {
      const res = await extractTextFromPdf(file, file.name);
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to extract text from PDF.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const blob = new Blob([result.fullText], { type: "text/plain;charset=utf-8" });
    const txtName = result.fileName.replace(/\.[^/.]+$/, "") + ".txt";
    downloadBlob(blob, txtName);
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setError(null);
  };

  return (
    <ToolLayout
      title="PDF to Text"
      description="Instantly extract digital text from PDF pages with full confidentiality and zero server uploads."
      icon={FileText}
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
                <FileText className="size-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-foreground">{file.name}</h3>
                <p className="text-xs text-muted-foreground font-mono">
                  {(file.size / 1024).toFixed(1)} KB • Native PDF.js Text Stream Extraction
                </p>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-xs flex items-center gap-2">
                <AlertCircle className="size-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {result ? (
              <TextExtractedPreview result={result} />
            ) : (
              <div className="p-8 text-center text-xs text-muted-foreground border border-dashed rounded-xl border-border">
                Ready to extract text. Click &ldquo;Extract Text&rdquo; below to process instantly in your browser.
              </div>
            )}

            <div className="p-3 rounded-xl bg-muted/40 border border-border/40 text-[11px] text-muted-foreground flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary shrink-0" />
              <span>100% Client-side: Document text is parsed directly from embedded PDF font vectors.</span>
            </div>

            <ToolActionBar
              actionLabel="Extract Text"
              isProcessing={isProcessing}
              canExecute={!!file && !isProcessing}
              isDone={!!result}
              resultFileName={result ? result.fileName.replace(/\.[^/.]+$/, "") + ".txt" : undefined}
              onExecute={handleExtract}
              onDownload={handleDownload}
              onReset={handleReset}
            />
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
