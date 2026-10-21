"use client";

import React, { useState } from "react";
import { Combine, Trash2, FileText, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SharedDropzone } from "@/components/file-handling/shared-dropzone";
import { ToolLayout } from "./tool-layout";
import { ToolActionBar } from "./tool-action-bar";
import { ResultPreviewSection } from "@/components/preview/result-preview-section";
import { SortableList } from "@/components/dnd/sortable-list";
import { SortableItem } from "@/components/dnd/sortable-item";
import { mergePdfFiles, MergePdfResult } from "@/lib/pdf/operations/merge";
import { triggerBytesDownload } from "@/lib/pdf/download";
import { formatFileSize } from "@/lib/pdf/validator";

interface MergeFileItem {
  id: string;
  file: File;
}

export function MergeToolView() {
  const [items, setItems] = useState<MergeFileItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<MergePdfResult | null>(null);

  const handleAddFile = (newFile: File) => {
    const newItem: MergeFileItem = {
      id: `${newFile.name}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      file: newFile,
    };
    setItems((prev) => [...prev, newItem]);
    setResult(null);
  };

  const removeFile = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
    setResult(null);
  };

  const handleMerge = async () => {
    if (items.length < 2) return;
    setIsProcessing(true);
    try {
      const rawFiles = items.map((it) => it.file);
      const mergeRes = await mergePdfFiles(rawFiles, "merged-document.pdf");
      setResult(mergeRes);
    } catch (err: unknown) {
      alert((err as Error).message || "Failed to merge PDF files.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (result) triggerBytesDownload(result.pdfBytes, result.fileName);
  };

  const handleReset = () => {
    setItems([]);
    setResult(null);
  };

  return (
    <ToolLayout
      title="Merge PDF"
      description="Combine multiple PDF documents into a single organized file in seconds."
      icon={Combine}
      category="Organize"
    >
      <div className="space-y-6">
        <SharedDropzone
          onFileSelect={handleAddFile}
          title={items.length === 0 ? "Select PDF files to merge" : "Add another PDF to the merge queue"}
          subtitle="Add at least two PDF documents to merge."
        />

        {items.length > 0 && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground px-1">
              <span>Files to Merge ({items.length}) — Drag handle to reorder:</span>
            </div>

            <SortableList items={items} onReorder={setItems}>
              <div className="space-y-2">
                {items.map((item, idx) => (
                  <SortableItem key={item.id} id={item.id}>
                    {({ listeners }) => (
                      <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-surface-secondary/40 shadow-2xs">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div {...listeners} className="cursor-grab active:cursor-grabbing text-muted-foreground/60 hover:text-foreground touch-none" title="Drag to reorder">
                            <GripVertical className="size-4" />
                          </div>
                          <span className="size-6 rounded-md bg-surface text-foreground border border-border flex items-center justify-center text-xs font-mono font-medium">
                            {idx + 1}
                          </span>
                          <FileText className="size-4 text-primary shrink-0" />
                          <div className="truncate">
                            <p className="text-xs font-medium text-foreground truncate">{item.file.name}</p>
                            <p className="text-[10px] text-muted-foreground">{formatFileSize(item.file.size)}</p>
                          </div>
                        </div>

                        <Button variant="ghost" size="sm" onClick={() => removeFile(item.id)} className="size-7 p-0 text-destructive hover:bg-destructive/10">
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    )}
                  </SortableItem>
                ))}
              </div>
            </SortableList>
          </div>
        )}

        {result && (
          <ResultPreviewSection
            pdfBytes={result.pdfBytes}
            fileName={result.fileName}
            pageCount={result.pageCount}
            title="Merged Document Preview"
            onDownload={handleDownload}
          />
        )}

        <ToolActionBar
          actionLabel={`Merge ${items.length} Files`}
          isProcessing={isProcessing}
          canExecute={items.length >= 2}
          isDone={!!result}
          resultFileName={result?.fileName}
          onExecute={handleMerge}
          onDownload={handleDownload}
          onReset={handleReset}
        />
      </div>
    </ToolLayout>
  );
}
