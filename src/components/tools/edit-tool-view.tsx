"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PenTool, AlertCircle } from "lucide-react";
import { ToolLayout } from "./tool-layout";
import { ToolActionBar } from "./tool-action-bar";
import { SharedDropzone } from "@/components/file-handling/shared-dropzone";
import { EditorToolbar, EditorSettings } from "./editor/editor-toolbar";
import { EditorCanvasStage } from "./editor/editor-canvas-stage";
import { AnnotationItem } from "@/types/annotation";
import { loadPdfDocument, cleanupPdfDocument, LoadedPDFResult } from "@/lib/pdf/loader";
import { applyAnnotationsToPdf, AnnotatePdfResult } from "@/lib/pdf/operations/annotate";
import { downloadPdfBytes } from "@/lib/pdf/download";
import { ResultPreviewSection } from "@/components/preview/result-preview-section";

const INITIAL_SETTINGS: EditorSettings = {
  activeTool: "text",
  colorHex: "#dc2626",
  strokeWidth: 3,
  fontSize: 16,
};

export function EditToolView() {
  const [file, setFile] = useState<File | null>(null);
  const [pdfState, setPdfState] = useState<LoadedPDFResult | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [settings, setSettings] = useState<EditorSettings>(INITIAL_SETTINGS);
  const [annotations, setAnnotations] = useState<AnnotationItem[]>([]);
  const [history, setHistory] = useState<AnnotationItem[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<AnnotatePdfResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) return;
    let isCancelled = false;
    loadPdfDocument(file)
      .then((state) => { if (!isCancelled) setPdfState(state); })
      .catch((err) => { if (!isCancelled) setError(err.message || "Failed to load PDF."); });
    return () => { isCancelled = true; };
  }, [file]);

  const pushNewState = (nextList: AnnotationItem[]) => {
    setAnnotations(nextList);
    const updated = [...history.slice(0, historyIndex + 1), nextList];
    setHistory(updated);
    setHistoryIndex(updated.length - 1);
  };

  const handleAddAnnotation = (ann: AnnotationItem) => pushNewState([...annotations, ann]);
  const handleUpdateAnnotation = (up: AnnotationItem) => pushNewState(annotations.map((a) => a.id === up.id ? up : a));
  const handleDeleteAnnotation = (id: string) => pushNewState(annotations.filter((a) => a.id !== id));

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      setAnnotations(history[historyIndex - 1]);
      setHistoryIndex(historyIndex - 1);
    }
  }, [historyIndex, history]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setAnnotations(history[historyIndex + 1]);
      setHistoryIndex(historyIndex + 1);
    }
  }, [historyIndex, history]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        if (e.shiftKey) handleRedo(); else handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === "y") { handleRedo(); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleUndo, handleRedo]);

  const handleExport = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);
    try {
      const res = await applyAnnotationsToPdf(file, annotations, `annotated-${file.name}`);
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to burn annotations.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    if (pdfState) cleanupPdfDocument(pdfState.pdfDoc);
    setFile(null); setPdfState(null); setAnnotations([]);
    setHistory([[]]); setHistoryIndex(0); setResult(null); setError(null);
  };

  return (
    <ToolLayout
      title="Edit & Annotate PDF"
      description="Add text notes, rectangular shapes, and freehand drawing marks directly onto PDF pages."
      icon={PenTool}
      category="Edit"
    >
      <div className="space-y-6">
        {!file ? (
          <SharedDropzone onFileSelect={(f) => setFile(f)} />
        ) : (
          <div className="space-y-4">
            <EditorToolbar
              settings={settings}
              onSettingsChange={(u) => setSettings((p) => ({ ...p, ...u }))}
              currentPage={currentPage}
              totalPages={pdfState?.meta.pageCount || 1}
              onPageChange={setCurrentPage}
              canUndo={historyIndex > 0}
              canRedo={historyIndex < history.length - 1}
              onUndo={handleUndo}
              onRedo={handleRedo}
            />

            {error && (
              <div className="p-3.5 rounded-lg border border-destructive/20 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
                <AlertCircle className="size-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {pdfState && (
              <div className="overflow-auto max-h-[600px] p-4 bg-surface-muted rounded-xl border border-border flex justify-center">
                <EditorCanvasStage
                  pdfDoc={pdfState.pdfDoc}
                  pageIndex={currentPage - 1}
                  settings={settings}
                  annotations={annotations}
                  onAddAnnotation={handleAddAnnotation}
                  onUpdateAnnotation={handleUpdateAnnotation}
                  onDeleteAnnotation={handleDeleteAnnotation}
                />
              </div>
            )}

            {result && (
              <ResultPreviewSection
                pdfBytes={result.pdfBytes}
                fileName={result.fileName}
                pageCount={result.pageCount}
                title="Annotated Document Preview"
                onDownload={() => downloadPdfBytes(result.pdfBytes, result.fileName)}
              />
            )}

            <ToolActionBar
              actionLabel="Export Annotated PDF"
              isProcessing={isProcessing}
              canExecute={!!file && annotations.length > 0}
              isDone={!!result}
              resultFileName={result?.fileName}
              onExecute={handleExport}
              onDownload={() => result && downloadPdfBytes(result.pdfBytes, result.fileName)}
              onReset={handleReset}
            />
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
