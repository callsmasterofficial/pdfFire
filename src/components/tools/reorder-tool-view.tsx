"use client";

import React, { useState, useEffect } from "react";
import { Trash2, ArrowUpDown, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SharedDropzone } from "@/components/file-handling/shared-dropzone";
import { ToolLayout } from "./tool-layout";
import { ToolActionBar } from "./tool-action-bar";
import { SortableList } from "@/components/dnd/sortable-list";
import { SortableItem } from "@/components/dnd/sortable-item";
import { reorderPdfPages, ReorderPdfResult } from "@/lib/pdf/operations/reorder";
import { triggerBytesDownload } from "@/lib/pdf/download";
import { ResultPreviewSection } from "@/components/preview/result-preview-section";
import { loadPdfDocument, cleanupPdfDocument } from "@/lib/pdf/loader";
import type { PDFDocumentProxy } from "pdfjs-dist";

interface ReorderPageItem {
  id: string;
  originalPageNumber: number;
}

export function ReorderToolView() {
  const [file, setFile] = useState<File | null>(null);
  const [items, setItems] = useState<ReorderPageItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ReorderPdfResult | null>(null);

  useEffect(() => {
    let docProxy: PDFDocumentProxy | null = null;
    if (file) {
      loadPdfDocument(file).then(({ pdfDoc }) => {
        docProxy = pdfDoc;
        setItems(
          Array.from({ length: pdfDoc.numPages }, (_, i) => ({
            id: `p-${i + 1}-${Date.now()}`,
            originalPageNumber: i + 1,
          }))
        );
      });
    }
    return () => {
      cleanupPdfDocument(docProxy);
    };
  }, [file]);

  const deletePage = (id: string) => {
    if (items.length <= 1) {
      alert("At least 1 page must be retained.");
      return;
    }
    setItems((prev) => prev.filter((it) => it.id !== id));
    setResult(null);
  };

  const handleReorder = async () => {
    if (!file || items.length === 0) return;
    setIsProcessing(true);
    try {
      const pageOrder = items.map((it) => it.originalPageNumber);
      const res = await reorderPdfPages(file, {
        pageOrder,
        outputFileName: `reordered-${items.length}-pages.pdf`,
      });
      setResult(res);
    } catch (err: unknown) {
      alert((err as Error).message || "Failed to reorder PDF.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (result) triggerBytesDownload(result.pdfBytes, result.fileName);
  };

  const handleReset = () => {
    setFile(null);
    setItems([]);
    setResult(null);
  };

  return (
    <ToolLayout
      title="Delete & Reorder Pages"
      description="Rearrange page sequence via drag-and-drop and prune unneeded pages seamlessly in memory."
      icon={ArrowUpDown}
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
                <p className="text-[10px] text-muted-foreground mt-0.5">{items.length} pages currently retained</p>
              </div>
              <Button variant="ghost" size="sm" onClick={handleReset} className="text-xs">
                Change File
              </Button>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-semibold text-foreground">
                Drag cards to reorder or click trash to delete:
              </span>
              <SortableList items={items} strategy="rect" onReorder={setItems}>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {items.map((item, idx) => (
                    <SortableItem key={item.id} id={item.id}>
                      {({ listeners }) => (
                        <div className="flex flex-col items-center justify-between p-3 rounded-xl border border-border bg-surface shadow-2xs hover:border-primary/40 transition-all">
                          <div className="w-full flex items-center justify-between text-[10px] font-mono text-muted-foreground mb-1">
                            <span>#{idx + 1}</span>
                            <div {...listeners} className="cursor-grab active:cursor-grabbing text-muted-foreground/60 hover:text-foreground touch-none" title="Drag to reorder">
                              <GripVertical className="size-3.5" />
                            </div>
                          </div>

                          <div className="size-11 rounded-lg bg-surface-secondary flex items-center justify-center text-primary font-bold text-sm my-1 border border-border">
                            P.{item.originalPageNumber}
                          </div>

                          <Button variant="ghost" size="sm" onClick={() => deletePage(item.id)} className="size-6 p-0 text-destructive hover:bg-destructive/10 mt-1" title="Delete page">
                            <Trash2 className="size-3" />
                          </Button>
                        </div>
                      )}
                    </SortableItem>
                  ))}
                </div>
              </SortableList>
            </div>

            {result && (
              <ResultPreviewSection
                pdfBytes={result.pdfBytes}
                fileName={result.fileName}
                pageCount={result.pageCount}
                title="Reordered Document Preview"
                onDownload={handleDownload}
              />
            )}
          </div>
        )}

        <ToolActionBar
          actionLabel={`Save Reordered Document (${items.length} Pages)`}
          isProcessing={isProcessing}
          canExecute={!!file && items.length > 0}
          isDone={!!result}
          resultFileName={result?.fileName}
          onExecute={handleReorder}
          onDownload={handleDownload}
          onReset={handleReset}
        />
      </div>
    </ToolLayout>
  );
}
