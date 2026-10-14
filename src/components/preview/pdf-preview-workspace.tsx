"use client";

import React, { useEffect, useState, useCallback } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { loadPdfDocument, cleanupPdfDocument } from "@/lib/pdf/loader";
import { PDFDocumentMeta, PDFPreviewError } from "@/types/pdf";
import { PDFPreviewToolbar } from "./pdf-preview-toolbar";
import { PDFThumbnailSidebar } from "./pdf-thumbnail-sidebar";
import { PDFCanvasView } from "./pdf-canvas-view";
import { PDFPasswordDialog } from "./pdf-password-dialog";
import { PDFPreviewErrorDisplay } from "./pdf-preview-error";
import { Loader2 } from "lucide-react";

interface PDFPreviewWorkspaceProps {
  file: File;
  onClose: () => void;
}

export function PDFPreviewWorkspace({ file, onClose }: PDFPreviewWorkspaceProps) {
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [meta, setMeta] = useState<PDFDocumentMeta | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<PDFPreviewError | null>(null);
  const [passwordRequired, setPasswordRequired] = useState<boolean>(false);

  const initDocument = useCallback(
    async (password?: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await loadPdfDocument(file, password);
        setPdfDoc((prev) => {
          cleanupPdfDocument(prev);
          return result.pdfDoc;
        });
        setMeta(result.meta);
        setCurrentPage(1);
        setPasswordRequired(false);
      } catch (err: unknown) {
        const previewError = err as PDFPreviewError;
        if (previewError.type === "password") {
          setPasswordRequired(true);
        } else {
          setError(previewError);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [file]
  );

  useEffect(() => {
    initDocument();
    return () => {
      setPdfDoc((prev) => {
        cleanupPdfDocument(prev);
        return null;
      });
    };
  }, [initDocument]);

  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  const handleZoomIn = () => setScale((prev) => Math.min(Number((prev + 0.15).toFixed(2)), 3.0));
  const handleZoomOut = () => setScale((prev) => Math.max(Number((prev - 0.15).toFixed(2)), 0.4));
  const handleFitWidth = () => setScale(1.0);

  if (passwordRequired) {
    return (
      <PDFPasswordDialog
        fileName={file.name}
        errorMessage={error?.message}
        onSubmit={(pwd) => initDocument(pwd)}
        onCancel={onClose}
      />
    );
  }

  if (error) {
    return (
      <PDFPreviewErrorDisplay
        error={error}
        fileName={file.name}
        onRetry={() => initDocument()}
        onReset={onClose}
      />
    );
  }

  if (isLoading || !pdfDoc || !meta) {
    return (
      <div className="flex flex-col items-center justify-center p-16 rounded-2xl border border-border bg-surface shadow-xs">
        <Loader2 className="size-9 animate-spin text-primary mb-3" />
        <p className="text-sm font-semibold text-foreground">Reading Document Locally...</p>
        <p className="text-xs text-muted-foreground mt-1 font-mono">{file.name}</p>
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl border border-border bg-surface overflow-hidden shadow-xs flex flex-col">
      <PDFPreviewToolbar
        currentPage={currentPage}
        totalPages={meta.pageCount}
        scale={scale}
        sidebarOpen={sidebarOpen}
        onPageChange={setCurrentPage}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onFitWidth={handleFitWidth}
        onRotate={handleRotate}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onClose={onClose}
      />
      <div className="flex flex-1 min-h-[500px]">
        {sidebarOpen && (
          <PDFThumbnailSidebar
            pdfDoc={pdfDoc}
            currentPage={currentPage}
            onSelectPage={setCurrentPage}
          />
        )}
        <PDFCanvasView
          pdfDoc={pdfDoc}
          pageNumber={currentPage}
          scale={scale}
          rotation={rotation}
        />
      </div>
    </div>
  );
}
