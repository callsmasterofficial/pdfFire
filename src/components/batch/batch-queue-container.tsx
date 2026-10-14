"use client";

import React, { useState, useRef, useMemo } from "react";
import { Play, Square, Archive, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SharedDropzone } from "@/components/file-handling/shared-dropzone";
import { SortableList } from "@/components/dnd/sortable-list";
import { SortableItem } from "@/components/dnd/sortable-item";
import { BatchItemRow } from "./batch-item-row";
import { BatchSummaryCard } from "./batch-summary-card";
import { BatchItem, BatchProcessorFn, BatchSummary } from "@/types/batch";
import { executeBatchQueue, bundleBatchResultsToZip } from "@/lib/batch/batch-runner";
import { triggerBytesDownload } from "@/lib/pdf/download";

interface BatchQueueContainerProps {
  operationName: string;
  processor: BatchProcessorFn;
  zipBaseName?: string;
}

export function BatchQueueContainer({
  operationName,
  processor,
  zipBaseName = "batch-processed",
}: BatchQueueContainerProps) {
  const [items, setItems] = useState<BatchItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const addFiles = (file: File) => {
    const newItem: BatchItem = {
      id: `${file.name}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      file,
      status: "queued",
      progress: 0,
    };
    setItems((prev) => [...prev, newItem]);
  };

  const handleStartBatch = async () => {
    if (items.length === 0 || isProcessing) return;
    setIsProcessing(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      await executeBatchQueue(items, processor, controller, {
        onItemUpdate: (updated) => {
          setItems((prev) => prev.map((it) => (it.id === updated.id ? updated : it)));
        },
        onOverallProgress: () => {},
      });
    } finally {
      setIsProcessing(false);
      abortControllerRef.current = null;
    }
  };

  const handleCancel = () => abortControllerRef.current?.abort();

  const handleRetry = (id: string) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, status: "queued", progress: 0, error: undefined } : it)));
  };

  const handleRemove = (id: string) => setItems((prev) => prev.filter((it) => it.id !== id));

  const handleDownloadZip = () => {
    const zipResult = bundleBatchResultsToZip(items, `${zipBaseName}.zip`);
    if (zipResult) triggerBytesDownload(zipResult.zipBytes, zipResult.fileName, "application/zip");
  };

  const summary: BatchSummary = useMemo(() => ({
    total: items.length,
    completed: items.filter((i) => i.status === "done").length,
    failed: items.filter((i) => i.status === "error").length,
    cancelled: items.filter((i) => i.status === "cancelled").length,
  }), [items]);

  return (
    <div className="space-y-6">
      <SharedDropzone
        onFileSelect={addFiles}
        title="Add PDF documents to the batch queue"
        subtitle="Queue multiple files to process them sequentially with error isolation."
      />

      {items.length > 0 && (
        <div className="space-y-4">
          <BatchSummaryCard summary={summary} />

          <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-border">
            <span className="text-xs font-semibold text-foreground">
              Queue Order ({items.length}) — Drag handle to reorder:
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setItems([])}
                disabled={isProcessing}
                className="text-xs h-7.5"
              >
                <Trash2 className="size-3.5 mr-1" /> Clear Queue
              </Button>
            </div>
          </div>

          <SortableList items={items} onReorder={setItems}>
            <div className="space-y-2">
              {items.map((item) => (
                <SortableItem key={item.id} id={item.id}>
                  {({ listeners }) => (
                    <BatchItemRow
                      item={item}
                      dragHandleProps={listeners}
                      isProcessingQueue={isProcessing}
                      onRetry={handleRetry}
                      onRemove={handleRemove}
                    />
                  )}
                </SortableItem>
              ))}
            </div>
          </SortableList>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border">
            <span className="text-xs text-muted-foreground">
              100% Client-Side Sequential Batch Processing
            </span>

            <div className="flex items-center gap-2">
              {isProcessing ? (
                <Button variant="outline" size="sm" onClick={handleCancel} className="gap-1.5 text-warning">
                  <Square className="size-3.5 fill-current" /> Stop / Cancel
                </Button>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleStartBatch}
                  disabled={items.length === 0}
                  className="gap-1.5"
                >
                  <Play className="size-3.5 fill-current" /> Run {operationName}
                </Button>
              )}

              {summary.completed > 0 && (
                <Button variant="default" size="sm" onClick={handleDownloadZip} className="gap-1.5 bg-success text-success-foreground">
                  <Archive className="size-3.5" /> Download All ZIP ({summary.completed})
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
