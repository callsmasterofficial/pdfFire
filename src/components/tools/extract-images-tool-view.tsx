"use client";

import React, { useState } from "react";
import { Image as ImageIcon, CheckCircle2, AlertCircle, FileArchive } from "lucide-react";
import { ToolLayout } from "./tool-layout";
import { ToolActionBar } from "./tool-action-bar";
import { SharedDropzone } from "@/components/file-handling/shared-dropzone";
import { ExtractImagesSettings } from "./extract-images/extract-images-settings";
import { ImageGalleryGrid } from "./extract-images/image-gallery-grid";
import {
  extractImagesFromPdf,
  ExtractImagesOptions,
  ExtractImagesResult,
} from "@/lib/pdf/operations/extract-images";
import { triggerBytesDownload } from "@/lib/pdf/download";

export function ExtractImagesToolView() {
  const [file, setFile] = useState<File | null>(null);
  const [options, setOptions] = useState<ExtractImagesOptions>({ minWidth: 1, minHeight: 1 });
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [result, setResult] = useState<ExtractImagesResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExtract = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);
    setProgress({ current: 0, total: 1 });
    try {
      const res = await extractImagesFromPdf(file, {
        ...options,
        onProgress: (current, total) => setProgress({ current, total }),
      });
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to extract images from PDF.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadZip = () => {
    if (!result?.zipBytes || !file) return;
    const baseName = file.name.replace(/\.pdf$/i, "");
    triggerBytesDownload(result.zipBytes, `${baseName}-images.zip`, "application/zip");
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setProgress(null);
    setError(null);
  };

  return (
    <ToolLayout
      title="Extract Images from PDF"
      description="Extract all embedded photos and raster graphics from PDF documents into original PNG/JPEG files or a ZIP bundle."
      icon={ImageIcon}
      category="Convert"
    >
      <div className="w-full space-y-6">
        <SharedDropzone onFileSelect={(selectedFile) => setFile(selectedFile)} />

        {file && (
          <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-border text-xs text-muted-foreground">
              <span className="font-semibold text-foreground truncate max-w-[280px]">
                {file.name}
              </span>
              <span>{(file.size / 1024).toFixed(1)} KB</span>
            </div>

            <ExtractImagesSettings
              options={options}
              onChange={setOptions}
              disabled={isProcessing}
            />

            {isProcessing && progress && (
              <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-2">
                <div className="flex justify-between text-xs text-foreground font-medium">
                  <span>Scanning pages for embedded XObjects...</span>
                  <span>{Math.round((progress.current / Math.max(1, progress.total)) * 100)}%</span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-200"
                    style={{ width: `${(progress.current / Math.max(1, progress.total)) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-xs flex items-center gap-2">
                <AlertCircle className="size-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {result && result.images.length === 0 && (
              <div className="p-4 rounded-xl bg-muted/40 border border-border text-center space-y-1">
                <p className="text-xs font-semibold text-foreground">No embedded images detected</p>
                <p className="text-[11px] text-muted-foreground">
                  Scanned {result.pageCount} page(s). This PDF appears to be pure vector text or contains no raster image XObjects matching your filter.
                </p>
              </div>
            )}

            {result && result.images.length > 0 && (
              <>
                <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs flex items-center justify-between font-medium">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 shrink-0" />
                    <span>Successfully extracted {result.totalImages} image(s) from {result.pageCount} page(s).</span>
                  </div>
                  <span className="flex items-center gap-1 font-mono text-[11px]">
                    <FileArchive className="size-3.5" />
                    ZIP Ready
                  </span>
                </div>

                <ImageGalleryGrid images={result.images} />
              </>
            )}

            <ToolActionBar
              actionLabel="Extract Images"
              isProcessing={isProcessing}
              canExecute={!!file}
              isDone={!!result && result.images.length > 0}
              resultFileName={file ? `${file.name.replace(/\.pdf$/i, "")}-images.zip` : undefined}
              onExecute={handleExtract}
              onDownload={handleDownloadZip}
              onReset={handleReset}
            />
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
