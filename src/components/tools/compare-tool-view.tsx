"use client";

import React, { useState } from "react";
import { GitCompare, Loader2, RotateCcw } from "lucide-react";
import { ToolLayout } from "./tool-layout";
import { Button } from "@/components/ui/button";
import { CompareDualDropzone } from "./compare/compare-dual-dropzone";
import { CompareSummaryBar } from "./compare/compare-summary-bar";
import { CompareTextView } from "./compare/compare-text-view";
import { CompareVisualView } from "./compare/compare-visual-view";
import { comparePdfDocuments, DocumentComparisonResult } from "@/lib/pdf/operations/compare";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export function CompareToolView() {
  const [fileA, setFileA] = useState<File | null>(null);
  const [fileB, setFileB] = useState<File | null>(null);
  const [comparison, setComparison] = useState<DocumentComparisonResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<"text" | "visual">("text");

  const runComparison = async (fA: File, fB: File) => {
    setIsProcessing(true);
    try {
      const res = await comparePdfDocuments(fA, fB, fA.name, fB.name);
      setComparison(res);
      setCurrentPage(1);
    } catch (err) {
      console.error("Comparison error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSelectA = (f: File) => {
    setFileA(f);
    if (fileB) runComparison(f, fileB);
  };

  const handleSelectB = (f: File) => {
    setFileB(f);
    if (fileA) runComparison(fileA, f);
  };

  const handleLoadSample = async () => {
    setIsProcessing(true);
    try {
      const doc1 = await PDFDocument.create();
      const page1 = doc1.addPage([595.28, 841.89]);
      const font = await doc1.embedFont(StandardFonts.Helvetica);
      page1.drawText("SERVICE LEVEL AGREEMENT (VERSION 1.0)", { x: 50, y: 780, size: 14, font, color: rgb(0.1, 0.1, 0.1) });
      page1.drawText("1. Monthly subscription fee is $499 per organization.", { x: 50, y: 730, size: 11, font, color: rgb(0.2, 0.2, 0.2) });
      page1.drawText("2. Guaranteed uptime commitment is 99.5% excluding scheduled maintenance.", { x: 50, y: 700, size: 11, font, color: rgb(0.2, 0.2, 0.2) });
      page1.drawText("3. Term of agreement is 12 months starting from effective date.", { x: 50, y: 670, size: 11, font, color: rgb(0.2, 0.2, 0.2) });
      const bytes1 = await doc1.save();

      const doc2 = await PDFDocument.create();
      const page2 = doc2.addPage([595.28, 841.89]);
      const font2 = await doc2.embedFont(StandardFonts.Helvetica);
      page2.drawText("SERVICE LEVEL AGREEMENT (VERSION 2.0 REVISED)", { x: 50, y: 780, size: 14, font: font2, color: rgb(0.1, 0.1, 0.1) });
      page2.drawText("1. Monthly subscription fee is $399 per organization with volume discounts.", { x: 50, y: 730, size: 11, font: font2, color: rgb(0.2, 0.2, 0.2) });
      page2.drawText("2. Guaranteed uptime commitment is 99.9% excluding scheduled maintenance.", { x: 50, y: 700, size: 11, font: font2, color: rgb(0.2, 0.2, 0.2) });
      page2.drawText("3. Term of agreement is 24 months starting from effective date.", { x: 50, y: 670, size: 11, font: font2, color: rgb(0.2, 0.2, 0.2) });
      const bytes2 = await doc2.save();

      const sampleA = new File([bytes1 as unknown as BlobPart], "SLA-Draft-v1.pdf", { type: "application/pdf" });
      const sampleB = new File([bytes2 as unknown as BlobPart], "SLA-Final-v2.pdf", { type: "application/pdf" });

      setFileA(sampleA);
      setFileB(sampleB);
      await runComparison(sampleA, sampleB);
    } catch (err) {
      console.error("Sample generation failed:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFileA(null);
    setFileB(null);
    setComparison(null);
    setCurrentPage(1);
  };

  const activePageComp = comparison?.pages.find((p) => p.pageNumber === currentPage);

  return (
    <ToolLayout
      title="Compare PDFs"
      description="Compare two PDF revisions side-by-side with text diffing and canvas visual pixel difference overlay."
      icon={GitCompare}
      category="Diagnostics"
    >
      <div className="space-y-6">
        {!comparison ? (
          <CompareDualDropzone
            fileA={fileA}
            fileB={fileB}
            onSelectA={handleSelectA}
            onSelectB={handleSelectB}
            onLoadSample={handleLoadSample}
            isProcessing={isProcessing}
          />
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold text-foreground">{comparison.docA.name}</span>
                <span className="text-muted-foreground">vs</span>
                <span className="font-semibold text-foreground">{comparison.docB.name}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleReset} className="gap-1.5 text-xs text-muted-foreground">
                <RotateCcw className="size-3.5" />
                <span>Compare Other Files</span>
              </Button>
            </div>

            <CompareSummaryBar
              comparison={comparison}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />

            {viewMode === "text" ? (
              <CompareTextView
                pageComp={activePageComp}
                docAName={comparison.docA.name}
                docBName={comparison.docB.name}
              />
            ) : fileA && fileB ? (
              <CompareVisualView fileA={fileA} fileB={fileB} pageNumber={currentPage} />
            ) : null}
          </div>
        )}

        {isProcessing && (
          <div className="flex items-center justify-center gap-2 py-8 text-xs text-muted-foreground font-mono">
            <Loader2 className="size-4 animate-spin text-primary" />
            <span>Analyzing text and structure diffs...</span>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
