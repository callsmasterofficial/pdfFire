"use client";

import React, { useState, useEffect } from "react";
import { Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SharedDropzone } from "@/components/file-handling/shared-dropzone";
import { ToolLayout } from "./tool-layout";
import { ToolActionBar } from "./tool-action-bar";
import { splitPdfDocument, SplitFileResult } from "@/lib/pdf/operations/split";
import { triggerBytesDownload, createZipArchive } from "@/lib/pdf/download";
import { ResultPreviewSection } from "@/components/preview/result-preview-section";
import { loadPdfDocument, cleanupPdfDocument } from "@/lib/pdf/loader";
import type { PDFDocumentProxy } from "pdfjs-dist";

export function SplitToolView() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [mode, setMode] = useState<"ranges" | "every-page">("ranges");
  const [rangesInput, setRangesInput] = useState<string>("1-2, 3");
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<SplitFileResult[] | null>(null);
  const [previewIdx, setPreviewIdx] = useState(0);

  useEffect(() => {
    let docProxy: PDFDocumentProxy | null = null;
    if (file) {
      loadPdfDocument(file).then(({ pdfDoc }) => {
        docProxy = pdfDoc;
        setPageCount(pdfDoc.numPages);
        setRangesInput(pdfDoc.numPages >= 2 ? `1, 2-${pdfDoc.numPages}` : "1");
      });
    }
    return () => { cleanupPdfDocument(docProxy); };
  }, [file]);

  const handleSplit = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const outputs = await splitPdfDocument(file, {
        mode, rangesString: rangesInput, baseFileName: file.name.replace(/\.pdf$/i, ""),
      });
      setResults(outputs);
    } catch (err: unknown) {
      alert((err as Error).message || "Failed to split PDF.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadZip = () => {
    if (!results) return;
    const zipData = createZipArchive(results.map((r) => ({ name: r.name, data: r.data })));
    triggerBytesDownload(zipData, "split-documents.zip", "application/zip");
  };

  const handleReset = () => {
    setFile(null);
    setPageCount(0);
    setResults(null);
    setPreviewIdx(0);
  };

  return (
    <ToolLayout
      title="Split PDF"
      description="Extract specific page ranges or separate every page into dedicated files."
      icon={Scissors}
      category="Organize"
    >
      <div className="space-y-6">
        {!file ? (
          <SharedDropzone onFileSelect={(f) => setFile(f)} />
        ) : (
          <div className="space-y-5">
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-surface-secondary/40">
              <div>
                <p className="text-xs font-semibold text-foreground">{file.name}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{pageCount} total pages available</p>
              </div>
              <Button variant="ghost" size="sm" onClick={handleReset} className="text-xs">
                Change File
              </Button>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-semibold text-foreground">Split Mode:</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => { setMode("ranges"); setResults(null); }}
                  className={`p-3 rounded-xl border text-left transition-all ${mode === "ranges" ? "border-primary bg-primary/10 ring-2 ring-primary/40 text-primary font-bold shadow-xs" : "border-border bg-surface text-foreground hover:border-primary/40"}`}
                >
                  <div className="text-xs">Custom Page Ranges</div>
                  <div className="text-[10px] text-muted-foreground font-normal mt-0.5">e.g. 1-2, 3-5</div>
                </button>
                <button
                  type="button"
                  onClick={() => { setMode("every-page"); setResults(null); }}
                  className={`p-3 rounded-xl border text-left transition-all ${mode === "every-page" ? "border-primary bg-primary/10 ring-2 ring-primary/40 text-primary font-bold shadow-xs" : "border-border bg-surface text-foreground hover:border-primary/40"}`}
                >
                  <div className="text-xs">Split Every Page</div>
                  <div className="text-[10px] text-muted-foreground font-normal mt-0.5">{pageCount} individual single-page PDFs</div>
                </button>
              </div>

              {mode === "ranges" && (
                <div className="pt-2">
                  <label className="text-xs text-muted-foreground block mb-1">Enter comma-separated ranges (1 to {pageCount}):</label>
                  <input
                    type="text"
                    value={rangesInput}
                    onChange={(e) => { setRangesInput(e.target.value); setResults(null); }}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-surface text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/40"
                    placeholder="e.g. 1, 2-3"
                  />
                </div>
              )}
            </div>

            {results && results.length > 0 && (
              <div className="space-y-3">
                {results.length > 1 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                    <span className="text-muted-foreground text-[11px] shrink-0 font-medium">Preview:</span>
                    {results.map((r, i) => (
                      <button
                        key={r.name}
                        type="button"
                        onClick={() => setPreviewIdx(i)}
                        className={`px-2.5 py-1 rounded-md text-xs font-mono transition-colors shrink-0 ${
                          previewIdx === i
                            ? "bg-primary text-primary-foreground font-semibold"
                            : "bg-surface border border-border text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Part {i + 1}
                      </button>
                    ))}
                  </div>
                )}
                <ResultPreviewSection
                  pdfBytes={results[previewIdx]?.data}
                  fileName={results[previewIdx]?.name}
                  pageCount={results[previewIdx]?.pageCount}
                  title={`Split Part ${previewIdx + 1} of ${results.length}`}
                  onDownload={handleDownloadZip}
                />
              </div>
            )}
          </div>
        )}

        <ToolActionBar
          actionLabel="Split Document"
          isProcessing={isProcessing}
          canExecute={!!file}
          isDone={!!results && results.length > 0}
          resultFileName={`${results?.length || 0} files (ZIP)`}
          onExecute={handleSplit}
          onDownload={handleDownloadZip}
          onReset={handleReset}
        />
      </div>
    </ToolLayout>
  );
}
