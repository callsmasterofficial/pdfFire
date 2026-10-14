"use client";

import React, { useState } from "react";
import { Copy, Check, Clock, FileText, Cpu, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DocumentSummaryResult } from "@/lib/ai/types";
import { downloadBlob } from "@/lib/pdf/download";

interface SummaryStatsCardProps {
  summary: DocumentSummaryResult;
  fileName: string;
}

export function SummaryStatsCard({ summary, fileName }: SummaryStatsCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const textToCopy = `Executive Summary:\n${summary.executiveSummary}\n\nKey Takeaways:\n${summary.keyTakeaways.map((t) => `• ${t}`).join("\n")}`;
    await navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    const content = `SUMMARY: ${summary.title}\nWords: ${summary.wordCount} | Pages: ${summary.pageCount}\n\nEXECUTIVE SUMMARY:\n${summary.executiveSummary}\n\nKEY TAKEAWAYS:\n${summary.keyTakeaways.map((t) => `• ${t}`).join("\n")}\n\nIDENTIFIED ENTITIES:\n${summary.entities.map((e) => `[${e.type.toUpperCase()}] ${e.value}`).join("\n")}`;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const name = fileName.replace(/\.[^/.]+$/, "") + "-summary.txt";
    downloadBlob(blob, name);
  };

  return (
    <div className="p-4 rounded-xl bg-muted/40 border border-border/60 flex flex-wrap items-center justify-between gap-4">
      <div className="flex flex-wrap items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5 text-foreground font-medium">
          <FileText className="size-4 text-primary" />
          <span>{summary.wordCount.toLocaleString()} words</span>
        </div>

        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Clock className="size-4 text-accent" />
          <span>~{summary.readingTimeMinutes} min read</span>
        </div>

        <div className="flex items-center gap-1.5 text-muted-foreground font-mono">
          <Cpu className="size-3.5 text-emerald-500" />
          <span>Local NLP • Zero Network Calls</span>
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
          {copied ? "Copied" : "Copy Summary"}
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleDownloadTxt}
          className="h-8 text-xs gap-1.5"
        >
          <Download className="size-3.5" />
          Save .txt
        </Button>
      </div>
    </div>
  );
}
