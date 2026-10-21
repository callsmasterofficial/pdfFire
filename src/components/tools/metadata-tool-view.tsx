"use client";

import React, { useState, useEffect } from "react";
import { FileText, Trash2, ShieldAlert } from "lucide-react";
import { ToolLayout } from "./tool-layout";
import { ToolActionBar } from "./tool-action-bar";
import { SharedDropzone } from "@/components/file-handling/shared-dropzone";
import { MetadataFields } from "./metadata/metadata-fields";
import { Button } from "@/components/ui/button";
import {
  readPdfMetadata,
  updatePdfMetadata,
  PdfMetadataInfo,
  UpdateMetadataResult,
} from "@/lib/pdf/operations";
import { downloadPdfBytes } from "@/lib/pdf/download";
import { ResultPreviewSection } from "@/components/preview/result-preview-section";

export function MetadataToolView() {
  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<Partial<PdfMetadataInfo>>({});
  const [stripAll, setStripAll] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<UpdateMetadataResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setMetadata({});
      setResult(null);
      return;
    }
    let isCancelled = false;
    setIsLoading(true);
    setError(null);

    readPdfMetadata(file)
      .then((info) => {
        if (!isCancelled) setMetadata(info);
      })
      .catch((err) => {
        if (!isCancelled) setError(err instanceof Error ? err.message : "Failed to read PDF metadata.");
      })
      .finally(() => {
        if (!isCancelled) setIsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [file]);

  const handleFieldChange = (field: keyof PdfMetadataInfo, value: string) => {
    setMetadata((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);
    try {
      const res = await updatePdfMetadata(file, {
        ...metadata, stripAll, outputFileName: stripAll ? `sanitized-${file.name}` : `metadata-${file.name}`,
      });
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update metadata.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    downloadPdfBytes(result.pdfBytes, result.fileName);
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setMetadata({});
    setStripAll(false);
  };

  return (
    <ToolLayout
      title="Inspect & Edit Metadata"
      description="View, modify, or strip document metadata for privacy 100% inside your browser."
      icon={FileText}
      category="Security"
    >
      <div className="w-full space-y-6">
        <SharedDropzone onFileSelect={(selectedFile) => setFile(selectedFile)} />

        {file && (
          <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <FileText className="size-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-foreground">{file.name}</h3>
                  <p className="text-xs text-muted-foreground font-mono">
                    {metadata.pageCount ? `${metadata.pageCount} pages • ` : ""}
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>

              <Button
                type="button"
                variant={stripAll ? "destructive" : "outline"}
                size="sm"
                onClick={() => setStripAll(!stripAll)}
                className="text-xs h-8 gap-1.5"
              >
                <Trash2 className="size-3.5" />
                {stripAll ? "Cancel Sanitization" : "Strip All Metadata"}
              </Button>
            </div>

            {isLoading ? (
              <div className="py-10 text-center text-xs text-muted-foreground font-mono">
                Reading document metadata...
              </div>
            ) : (
              <MetadataFields
                metadata={metadata}
                stripAll={stripAll}
                onChange={handleFieldChange}
              />
            )}

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-xs flex items-center gap-2">
                <ShieldAlert className="size-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {result && (
              <ResultPreviewSection
                pdfBytes={result.pdfBytes}
                fileName={result.fileName}
                title="Updated Metadata Document Preview"
                onDownload={handleDownload}
              />
            )}

            <ToolActionBar
              actionLabel={stripAll ? "Sanitize & Strip" : "Update Metadata"}
              isProcessing={isProcessing}
              canExecute={!!file}
              isDone={!!result}
              resultFileName={result?.fileName}
              onExecute={handleSave}
              onDownload={handleDownload}
              onReset={handleReset}
            />
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
