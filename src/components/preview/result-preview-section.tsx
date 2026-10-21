"use client";

import React, { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { CheckCircle2, Eye, EyeOff, Download, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const PDFPreviewWorkspace = dynamic(
  () => import("./pdf-preview-workspace").then((mod) => mod.PDFPreviewWorkspace),
  {
    loading: () => (
      <div className="flex flex-col items-center justify-center p-12 rounded-xl border border-border bg-surface/50">
        <Loader2 className="size-7 animate-spin text-primary mb-2" />
        <p className="text-xs font-semibold text-foreground">Loading preview...</p>
      </div>
    ),
    ssr: false,
  }
);

export interface ResultPreviewSectionProps {
  pdfBytes?: Uint8Array | null;
  file?: File | null;
  fileName?: string;
  pageCount?: number;
  title?: string;
  onDownload?: () => void;
  defaultExpanded?: boolean;
  className?: string;
}

export function ResultPreviewSection({
  pdfBytes,
  file,
  fileName = "document.pdf",
  pageCount,
  title = "Document Preview",
  onDownload,
  defaultExpanded = true,
  className = "",
}: ResultPreviewSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const previewFile = useMemo<File | null>(() => {
    if (file) return file;
    if (pdfBytes) {
      return new File([pdfBytes as unknown as BlobPart], fileName, {
        type: "application/pdf",
      });
    }
    return null;
  }, [file, pdfBytes, fileName]);

  if (!previewFile) return null;

  const fileSizeKb = (previewFile.size / 1024).toFixed(1);

  return (
    <div className={`space-y-3 rounded-2xl border border-border/80 bg-muted/20 p-4 shadow-2xs ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-foreground">{title}</h4>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold">
                Ready
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
              <FileText className="size-3 shrink-0" />
              <span className="font-medium text-foreground/80 truncate max-w-xs">{fileName}</span>
              <span>•</span>
              <span>{fileSizeKb} KB</span>
              {pageCount !== undefined && (
                <>
                  <span>•</span>
                  <span>{pageCount} page{pageCount === 1 ? "" : "s"}</span>
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="h-8 gap-1.5 text-xs"
          >
            {isExpanded ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
            <span>{isExpanded ? "Hide Preview" : "Show Preview"}</span>
          </Button>

          {onDownload && (
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={onDownload}
              className="h-8 gap-1.5 text-xs bg-primary text-primary-foreground"
            >
              <Download className="size-3.5" />
              <span>Download</span>
            </Button>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="pt-2 animate-in fade-in duration-200">
          <PDFPreviewWorkspace
            file={previewFile}
            onClose={() => setIsExpanded(false)}
          />
        </div>
      )}
    </div>
  );
}
