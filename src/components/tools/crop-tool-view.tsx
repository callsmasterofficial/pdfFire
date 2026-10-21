"use client";

import React, { useState } from "react";
import { Crop, RotateCcw } from "lucide-react";
import { ToolLayout } from "@/components/tools/tool-layout";
import { ToolActionBar } from "@/components/tools/tool-action-bar";
import { SharedDropzone } from "@/components/file-handling/shared-dropzone";
import { ResultPreviewSection } from "@/components/preview/result-preview-section";
import { CropSettings } from "@/components/tools/crop/crop-settings";
import { CropVisualPreview } from "@/components/tools/crop/crop-visual-preview";
import { cropAndResizePdf, CropResizeOptions, CropResizeResult } from "@/lib/pdf/operations/crop";
import { PDFDocument } from "pdf-lib";

export function CropToolView() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(1);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 595, height: 842 });
  const [options, setOptions] = useState<CropResizeOptions>({
    mode: "crop",
    cropMargins: { top: 36, bottom: 36, left: 36, right: 36 },
    standardSize: "A4",
    scaleFactor: 1.25,
    pageScope: "all",
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<CropResizeResult | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const handleFileSelect = async (selected: File) => {
    setFile(selected);
    setResult(null);
    setDownloadUrl(null);
    try {
      const buffer = await selected.arrayBuffer();
      const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      setPageCount(doc.getPageCount());
      const first = doc.getPage(0);
      setDimensions(first.getSize());
    } catch {
      setPageCount(1);
    }
  };

  const handleExecute = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const buffer = await file.arrayBuffer();
      const res = await cropAndResizePdf(new Uint8Array(buffer), options);
      setResult(res);
      const blob = new Blob([res.pdfBytes as unknown as BlobPart], { type: "application/pdf" });
      setDownloadUrl(URL.createObjectURL(blob));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to crop/resize PDF.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!downloadUrl || !file) return;
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = `${file.name.replace(/\.pdf$/i, "")}_${options.mode}.pdf`;
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
      title="Crop & Resize PDF"
      description="Trim white margins, remove printer bleed marks, or scale pages to standard paper formats."
      category="Edit & Optimize"
      icon={Crop}
    >
      <div className="w-full max-w-4xl mx-auto space-y-6">
        {!file ? (
          <SharedDropzone
            onFileSelect={handleFileSelect}
            title="Select a PDF to Crop or Resize"
            subtitle="Drag & drop your document to trim margins or adjust paper dimensions"
          />
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-3.5 bg-card border border-border rounded-xl">
              <div>
                <span className="font-semibold text-sm text-foreground">{file.name}</span>
                <span className="text-xs text-muted-foreground ml-3">
                  {pageCount} {pageCount === 1 ? "page" : "pages"} • {Math.round(dimensions.width)}×
                  {Math.round(dimensions.height)} pt ({(file.size / 1024).toFixed(1)} KB)
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
              <CropSettings options={options} onChange={setOptions} totalPages={pageCount} />
              <CropVisualPreview
                options={options}
                pageWidth={dimensions.width}
                pageHeight={dimensions.height}
              />
            </div>

            {result && (
              <ResultPreviewSection
                pdfBytes={result.pdfBytes}
                fileName={file ? `${file.name.replace(/\.pdf$/i, "")}_${options.mode}.pdf` : "cropped.pdf"}
                pageCount={result.totalPages}
                title="Cropped Document Preview"
                onDownload={handleDownload}
              />
            )}

            <ToolActionBar
              actionLabel="Apply Crop & Resize"
              resultFileName={file ? `${file.name.replace(/\.pdf$/i, "")}_${options.mode}.pdf` : undefined}
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
