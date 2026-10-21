"use client";

import React, { useState, useEffect } from "react";
import { Layers, CheckSquare, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SharedDropzone } from "@/components/file-handling/shared-dropzone";
import { ToolLayout } from "./tool-layout";
import { ToolActionBar } from "./tool-action-bar";
import { loadPdfDocument, cleanupPdfDocument } from "@/lib/pdf/loader";
import { extractPdfPages, ExtractPdfResult } from "@/lib/pdf/operations/extract";
import { triggerBytesDownload } from "@/lib/pdf/download";
import { ResultPreviewSection } from "@/components/preview/result-preview-section";
import type { PDFDocumentProxy } from "pdfjs-dist";

export function ExtractToolView() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ExtractPdfResult | null>(null);

  useEffect(() => {
    let docProxy: PDFDocumentProxy | null = null;
    if (file) {
      loadPdfDocument(file).then(({ pdfDoc }) => {
        docProxy = pdfDoc;
        setPageCount(pdfDoc.numPages);
        setSelectedPages([1]); // Select first page by default
      });
    }
    return () => {
      cleanupPdfDocument(docProxy);
    };
  }, [file]);

  const togglePage = (pageNum: number) => {
    setSelectedPages((prev) =>
      prev.includes(pageNum) ? prev.filter((p) => p !== pageNum) : [...prev, pageNum].sort((a, b) => a - b)
    );
    setResult(null);
  };

  const selectAll = () => {
    setSelectedPages(Array.from({ length: pageCount }, (_, i) => i + 1));
    setResult(null);
  };

  const deselectAll = () => {
    setSelectedPages([]);
    setResult(null);
  };

  const handleExtract = async () => {
    if (!file || selectedPages.length === 0) return;
    setIsProcessing(true);
    try {
      const res = await extractPdfPages(file, {
        pageNumbers: selectedPages,
        outputFileName: `extracted-${selectedPages.length}-pages.pdf`,
      });
      setResult(res);
    } catch (err: unknown) {
      alert((err as Error).message || "Failed to extract pages.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (result) triggerBytesDownload(result.pdfBytes, result.fileName);
  };

  const handleReset = () => {
    setFile(null);
    setPageCount(0);
    setSelectedPages([]);
    setResult(null);
  };

  return (
    <ToolLayout
      title="Extract Pages"
      description="Select individual pages to create a fresh, streamlined PDF document."
      icon={Layers}
      category="Organize"
    >
      <div className="space-y-6">
        {!file ? (
          <SharedDropzone onFileSelect={(f) => setFile(f)} />
        ) : (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl border border-border bg-surface-secondary/40">
              <div>
                <p className="text-xs font-semibold text-foreground">{file.name}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{pageCount} total pages available</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={selectAll} className="text-xs h-7.5">Select All</Button>
                <Button variant="outline" size="sm" onClick={deselectAll} className="text-xs h-7.5">Clear</Button>
                <Button variant="ghost" size="sm" onClick={handleReset} className="text-xs h-7.5">Change File</Button>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-semibold text-foreground">
                Select Pages to Extract ({selectedPages.length} selected):
              </span>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {Array.from({ length: pageCount }, (_, i) => i + 1).map((pageNum) => {
                  const isSelected = selectedPages.includes(pageNum);
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => togglePage(pageNum)}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                        isSelected
                          ? "border-primary bg-primary/10 ring-2 ring-primary/40 text-primary font-bold shadow-xs"
                          : "border-border bg-surface hover:border-primary/40 text-muted-foreground"
                      }`}
                    >
                      {isSelected ? <CheckSquare className="size-4 mb-1 text-primary" /> : <Square className="size-4 mb-1" />}
                      <span className="text-xs">Page {pageNum}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {result && (
              <ResultPreviewSection
                pdfBytes={result.pdfBytes}
                fileName={result.fileName}
                pageCount={result.pageCount}
                title="Extracted Document Preview"
                onDownload={handleDownload}
              />
            )}
          </div>
        )}

        <ToolActionBar
          actionLabel={`Extract ${selectedPages.length} Pages`}
          isProcessing={isProcessing}
          canExecute={!!file && selectedPages.length > 0}
          isDone={!!result}
          resultFileName={result?.fileName}
          onExecute={handleExtract}
          onDownload={handleDownload}
          onReset={handleReset}
        />
      </div>
    </ToolLayout>
  );
}
