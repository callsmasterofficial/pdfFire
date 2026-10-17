"use client";

import React, { useState } from "react";
import { FlipHorizontal, Download, RotateCcw } from "lucide-react";
import { ToolLayout } from "@/components/tools/tool-layout";
import { ToolActionBar } from "@/components/tools/tool-action-bar";
import { SharedDropzone } from "@/components/file-handling/shared-dropzone";
import { FlipSettings } from "@/components/tools/flip/flip-settings";
import { FlipVisualCard } from "@/components/tools/flip/flip-visual-card";
import { flipPdf, FlipOptions, FlipResult } from "@/lib/pdf/operations/flip";
import { PDFDocument } from "pdf-lib";

export function FlipToolView() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(1);
  const [options, setOptions] = useState<FlipOptions>({
    direction: "horizontal",
    pageScope: "all",
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<FlipResult | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const handleFileSelect = async (selected: File) => {
    setFile(selected);
    setResult(null);
    setDownloadUrl(null);
    try {
      const buffer = await selected.arrayBuffer();
      const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      setPageCount(doc.getPageCount());
    } catch {
      setPageCount(1);
    }
  };

  const handleExecute = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const buffer = await file.arrayBuffer();
      const res = await flipPdf(new Uint8Array(buffer), options);
      setResult(res);
      const blob = new Blob([res.pdfBytes as unknown as BlobPart], { type: "application/pdf" });
      setDownloadUrl(URL.createObjectURL(blob));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to flip PDF.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!downloadUrl || !file) return;
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = `${file.name.replace(/\.pdf$/i, "")}_flipped.pdf`;
    a.click();
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    setDownloadUrl(null);
  };

  return (
    <ToolLayout
      title="Flip & Mirror PDF"
      description="Mirror pages horizontally for T-shirt transfer printing or flip upside-down vertically in browser memory."
      category="Organize"
      icon={FlipHorizontal}
    >
      <div className="w-full max-w-4xl mx-auto space-y-6">
        {!file ? (
          <SharedDropzone
            onFileSelect={handleFileSelect}
            title="Select a PDF to Flip"
            subtitle="Drag & drop your document to mirror horizontally or flip vertically"
          />
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-3.5 bg-card border border-border rounded-xl">
              <div>
                <span className="font-semibold text-sm text-foreground">{file.name}</span>
                <span className="text-xs text-muted-foreground ml-3">
                  {pageCount} {pageCount === 1 ? "page" : "pages"} ({(file.size / 1024).toFixed(1)} KB)
                </span>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 font-mono"
              >
                <RotateCcw className="size-3.5" /> Choose another file
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FlipSettings options={options} onChange={setOptions} totalPages={pageCount} />
              <FlipVisualCard options={options} />
            </div>

            {result && (
              <div className="p-5 rounded-xl border border-primary/30 bg-primary/5 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-foreground">Mirroring Applied!</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Flipped {result.flippedPagesCount} of {result.totalPages} {result.totalPages === 1 ? "page" : "pages"} ({options.direction}).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-lg shadow-sm hover:opacity-90 inline-flex items-center gap-2 text-sm"
                >
                  <Download className="size-4" /> Download Flipped PDF
                </button>
              </div>
            )}

            <ToolActionBar
              actionLabel="Flip PDF Document"
              resultFileName={file ? `${file.name.replace(/\.pdf$/i, "")}_flipped.pdf` : undefined}
              canExecute={!!file && !result}
              isProcessing={isProcessing}
              isDone={!!result}
              onExecute={handleExecute}
              onDownload={handleDownload}
              onReset={handleReset}
            />
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
