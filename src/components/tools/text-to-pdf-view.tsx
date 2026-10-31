"use client";

import React, { useState } from "react";
import { FileUp, AlertCircle, ShieldCheck } from "lucide-react";
import { ToolLayout } from "./tool-layout";
import { ToolActionBar } from "./tool-action-bar";
import { ResultPreviewSection } from "@/components/preview/result-preview-section";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { convertTextToPdf, TextToPdfResult } from "@/lib/pdf/operations";
import { downloadPdfBytes } from "@/lib/pdf/download";
import { UnicodeFidelityNotice } from "@/components/tools/unicode-fidelity-notice";

const DEFAULT_SAMPLE_TEXT = `PDFfire Local Document Creator

This document was created and paginated 100% inside your web browser using pdf-lib. No document contents were transmitted over any network or processed by any external cloud server.

Features & Benefits:
- Automatic paragraph formatting and word-wrapping.
- Multi-page pagination when text exceeds a single page.
- Embedded standard typography and document metadata.
- Instant, secure, and private PDF generation.`;

export function TextToPdfView() {
  const [title, setTitle] = useState("My Document");
  const [text, setText] = useState(DEFAULT_SAMPLE_TEXT);
  const [fontSize, setFontSize] = useState(11);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<TextToPdfResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charCount = text.length;

  const handleConvert = async () => {
    if (!text.trim()) return;
    setIsProcessing(true);
    setError(null);
    try {
      const fileName = `${title.toLowerCase().replace(/[^a-z0-9]/g, "-") || "document"}.pdf`;
      const res = await convertTextToPdf(text, {
        title,
        fontSize,
        outputFileName: fileName,
      });
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to convert text to PDF.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    downloadPdfBytes(result.pdfBytes, result.fileName);
  };

  const handleReset = () => {
    setText("");
    setTitle("Untitled");
    setResult(null);
  };

  return (
    <ToolLayout
      title="Text to PDF"
      description="Write or paste plain text and convert it into a clean, paginated PDF document locally."
      icon={FileUp}
      category="Convert"
    >
      <div className="w-full space-y-6">
        <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="doc-title" className="text-xs font-semibold text-foreground/80">
                Document Title
              </Label>
              <Input
                id="doc-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Project Notes"
                className="h-9 text-xs bg-muted/20"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground/80">
                Typography Font Size ({fontSize} pt)
              </Label>
              <div className="flex gap-2">
                {[10, 11, 12, 14].map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setFontSize(sz)}
                    className={`flex-1 h-9 rounded-lg border text-xs font-mono transition-all ${
                      fontSize === sz
                        ? "border-primary bg-primary/10 text-primary font-bold"
                        : "border-border/60 bg-muted/20 hover:bg-muted/40 text-foreground"
                    }`}
                  >
                    {sz}pt
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <Label htmlFor="doc-body" className="text-xs font-semibold text-foreground/80">
                Document Body Text
              </Label>
              <span className="text-[11px] text-muted-foreground font-mono">
                {wordCount} words • {charCount.toLocaleString()} chars
              </span>
            </div>
            <textarea
              id="doc-body"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type or paste text content here..."
              rows={10}
              className="w-full p-4 rounded-xl border border-border/70 bg-muted/20 font-mono text-xs leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-xs flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {result?.textFidelity && <UnicodeFidelityNotice report={result.textFidelity} />}


          {result && (
            <ResultPreviewSection
              pdfBytes={result.pdfBytes}
              fileName={result.fileName}
              pageCount={result.pageCount}
              title="Text Document PDF Preview"
              onDownload={handleDownload}
            />
          )}

          <div className="p-3 rounded-xl bg-muted/40 border border-border/40 text-[11px] text-muted-foreground flex items-center gap-2">
            <ShieldCheck className="size-4 text-primary shrink-0" />
            <span>Pure client-side typesetting: Formatted directly inside browser memory via pdf-lib.</span>
          </div>

          <ToolActionBar
            actionLabel="Generate PDF"
            isProcessing={isProcessing}
            canExecute={text.trim().length > 0 && !isProcessing}
            isDone={!!result}
            resultFileName={result?.fileName}
            onExecute={handleConvert}
            onDownload={handleDownload}
            onReset={handleReset}
          />
        </div>
      </div>
    </ToolLayout>
  );
}
