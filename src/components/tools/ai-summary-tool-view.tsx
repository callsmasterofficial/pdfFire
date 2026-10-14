"use client";

import React, { useState } from "react";
import { Sparkles, AlertCircle, ShieldCheck } from "lucide-react";
import { ToolLayout } from "./tool-layout";
import { ToolActionBar } from "./tool-action-bar";
import { SharedDropzone } from "@/components/file-handling/shared-dropzone";
import { SummaryStatsCard } from "./ai/summary-stats-card";
import { SummaryContentTabs } from "./ai/summary-content-tabs";
import { extractTextFromPdf } from "@/lib/pdf/operations";
import { summarizeDocumentText, DocumentSummaryResult } from "@/lib/ai";
import { downloadBlob } from "@/lib/pdf/download";

export function AiSummaryToolView() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [summary, setSummary] = useState<DocumentSummaryResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateSummary = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);

    try {
      const extracted = await extractTextFromPdf(file, file.name);
      if (!extracted.fullText.trim()) {
        throw new Error(
          "No selectable text found in this PDF. For scanned documents, please run OCR first in the OCR Scanned PDF tool."
        );
      }
      const result = summarizeDocumentText(extracted.fullText, file.name, extracted.totalPages);
      setSummary(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze document.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!summary || !file) return;
    const content = `SUMMARY: ${summary.title}\n\nEXECUTIVE SUMMARY:\n${summary.executiveSummary}\n\nKEY TAKEAWAYS:\n${summary.keyTakeaways.map((t) => `• ${t}`).join("\n")}`;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const name = file.name.replace(/\.[^/.]+$/, "") + "-summary.txt";
    downloadBlob(blob, name);
  };

  const handleReset = () => {
    setFile(null);
    setSummary(null);
    setError(null);
  };

  return (
    <ToolLayout
      title="Summarize PDF"
      description="Generate executive summaries, key takeaways, and metric extractions 100% on-device with zero server transmission."
      icon={Sparkles}
      category="Edit & Optimize"
    >
      <div className="w-full space-y-6">
        <SharedDropzone onFileSelect={(selectedFile) => {
          setFile(selectedFile);
          setSummary(null);
        }} />

        {file && (
          <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-6">
            <div className="flex items-center gap-3 border-b border-border/60 pb-4">
              <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Sparkles className="size-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-foreground">{file.name}</h3>
                <p className="text-xs text-muted-foreground font-mono">
                  {(file.size / 1024).toFixed(1)} KB • In-Memory TextRank & NLP Analysis
                </p>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-xs flex items-center gap-2">
                <AlertCircle className="size-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {summary ? (
              <div className="space-y-5">
                <SummaryStatsCard summary={summary} fileName={file.name} />
                <SummaryContentTabs summary={summary} />
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-muted-foreground border border-dashed rounded-xl border-border">
                Ready to analyze. Click &ldquo;Summarize Document&rdquo; below to run on-device NLP processing.
              </div>
            )}

            <div className="p-3 rounded-xl bg-muted/40 border border-border/40 text-[11px] text-muted-foreground flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary shrink-0" />
              <span>Zero server APIs: Text summarization and entity matching execute purely within local browser memory.</span>
            </div>

            <ToolActionBar
              actionLabel="Summarize Document"
              isProcessing={isProcessing}
              canExecute={!!file && !isProcessing}
              isDone={!!summary}
              resultFileName={summary ? `${file.name.replace(/\.[^/.]+$/, "")}-summary.txt` : undefined}
              onExecute={handleGenerateSummary}
              onDownload={handleDownload}
              onReset={handleReset}
            />
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
