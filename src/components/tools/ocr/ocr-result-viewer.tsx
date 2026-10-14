"use client";

import React, { useState } from "react";
import { Copy, Check, FileDown, FileText, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OcrDocumentResult } from "@/lib/ocr/ocr-types";
import { downloadBlob } from "@/lib/pdf/download";

interface OcrResultViewerProps {
  result: OcrDocumentResult;
  onDownloadSearchablePdf: () => void;
  fileName: string;
}

export function OcrResultViewer({
  result,
  onDownloadSearchablePdf,
  fileName,
}: OcrResultViewerProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(result.fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([result.fullText], { type: "text/plain;charset=utf-8" });
    const txtName = fileName.replace(/\.[^/.]+$/, "") + "-ocr.txt";
    downloadBlob(blob, txtName);
  };

  return (
    <div className="space-y-4 pt-2">
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-muted/40 border border-border/60">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Sparkles className="size-4" />
          </div>
          <div>
            <div className="text-xs font-semibold text-foreground">
              OCR Complete • {result.averageConfidence}% Average Confidence
            </div>
            <div className="text-[11px] text-muted-foreground font-mono">
              {result.pages.length} pages processed in {(result.processingTimeMs / 1000).toFixed(1)}s
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="h-8 text-xs gap-1.5"
          >
            {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
            {copied ? "Copied" : "Copy Text"}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDownloadTxt}
            className="h-8 text-xs gap-1.5"
          >
            <FileText className="size-3.5" />
            Save .txt
          </Button>

          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={onDownloadSearchablePdf}
            className="h-8 text-xs gap-1.5 shadow-xs"
          >
            <FileDown className="size-3.5" />
            Searchable PDF
          </Button>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-foreground/80">Recognized Text</label>
        <div className="p-4 rounded-xl border border-border/70 bg-muted/20 font-mono text-xs whitespace-pre-wrap max-h-80 overflow-y-auto leading-relaxed select-all">
          {result.fullText || "No text recognized on document pages."}
        </div>
      </div>
    </div>
  );
}
