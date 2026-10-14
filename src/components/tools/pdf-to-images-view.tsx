"use client";

import React, { useState } from "react";
import { Image as ImageIcon, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SharedDropzone } from "@/components/file-handling/shared-dropzone";
import { ToolLayout } from "./tool-layout";
import { ToolActionBar } from "./tool-action-bar";
import { convertPdfToImages, PageImageOutput } from "@/lib/pdf/operations/pdf-to-images";
import { triggerBytesDownload, createZipArchive } from "@/lib/pdf/download";

export function PdfToImagesView() {
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<"image/png" | "image/jpeg">("image/png");
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<PageImageOutput[] | null>(null);

  const handleConvert = async () => {
    if (!file) return;
    setIsProcessing(true);
    setProgress(null);
    try {
      const outputs = await convertPdfToImages(file, {
        format,
        scale: 2.0,
        baseFileName: file.name.replace(/\.pdf$/i, ""),
        onProgress: (current, total) => setProgress({ current, total }),
      });
      setResults(outputs);
    } catch (err: unknown) {
      alert((err as Error).message || "Failed to convert PDF pages to images.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadZip = () => {
    if (!results) return;
    const zipData = createZipArchive(results.map((r) => ({ name: r.name, data: r.bytes })));
    triggerBytesDownload(zipData, `${file?.name.replace(/\.pdf$/i, "") || "pdf"}-images.zip`, "application/zip");
  };

  const handleReset = () => {
    setFile(null);
    setProgress(null);
    setResults(null);
  };

  return (
    <ToolLayout
      title="PDF Pages to Images"
      description="Export high-resolution PNG or JPEG images from any document pages."
      icon={ImageIcon}
      category="Convert"
    >
      <div className="space-y-6">
        {!file ? (
          <SharedDropzone onFileSelect={(f) => setFile(f)} />
        ) : (
          <div className="space-y-5">
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-surface-secondary/40">
              <div>
                <p className="text-xs font-semibold text-foreground">{file.name}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Ready for canvas image extraction</p>
              </div>
              <Button variant="ghost" size="sm" onClick={handleReset} className="text-xs">
                Change File
              </Button>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-semibold text-foreground">Image Format:</label>
              <div className="grid grid-cols-2 gap-3">
                {(["image/png", "image/jpeg"] as const).map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => { setFormat(fmt); setResults(null); }}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      format === fmt
                        ? "border-primary bg-primary/10 ring-2 ring-primary/40 text-primary font-bold shadow-xs"
                        : "border-border bg-surface text-foreground hover:border-primary/40"
                    }`}
                  >
                    <span className="text-xs">{fmt === "image/png" ? "PNG (Lossless)" : "JPEG (Compact)"}</span>
                  </button>
                ))}
              </div>
            </div>

            {progress && (
              <div className="p-3.5 rounded-xl border border-border bg-surface-secondary text-xs font-mono text-center">
                Processing page {progress.current} of {progress.total}...
              </div>
            )}

            {results && results.length > 0 && (
              <div className="p-4 rounded-xl border border-success/30 bg-success/10 space-y-3">
                <p className="text-xs font-semibold text-success">
                  Extracted {results.length} high-resolution image pages!
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="default" size="sm" onClick={handleDownloadZip} className="gap-1.5 text-xs">
                    <Archive className="size-3.5" />
                    <span>Download All as ZIP</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        <ToolActionBar
          actionLabel="Convert Pages to Images"
          isProcessing={isProcessing}
          canExecute={!!file}
          isDone={!!results && results.length > 0}
          resultFileName={`${results?.length || 0} images (ZIP)`}
          onExecute={handleConvert}
          onDownload={handleDownloadZip}
          onReset={handleReset}
        />
      </div>
    </ToolLayout>
  );
}
