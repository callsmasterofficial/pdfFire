"use client";

import React, { useState } from "react";
import { FileImage, Image as ImageIcon, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolLayout } from "./tool-layout";
import { ToolActionBar } from "./tool-action-bar";
import { convertImagesToPdf, ImagesToPdfResult } from "@/lib/pdf/operations/images-to-pdf";
import { triggerBytesDownload } from "@/lib/pdf/download";
import { formatFileSize } from "@/lib/pdf/validator";

export function ImagesToPdfView() {
  const [images, setImages] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ImagesToPdfResult | null>(null);

  const handleAddImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = Array.from(e.target.files);
      setImages((prev) => [...prev, ...selected]);
      setResult(null);
    }
  };

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
    setResult(null);
  };

  const moveImage = (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= images.length) return;
    const next = [...images];
    const temp = next[index];
    next[index] = next[targetIdx];
    next[targetIdx] = temp;
    setImages(next);
    setResult(null);
  };

  const handleConvert = async () => {
    if (images.length === 0) return;
    setIsProcessing(true);
    try {
      const res = await convertImagesToPdf(images, "converted-images.pdf");
      setResult(res);
    } catch (err: unknown) {
      alert((err as Error).message || "Failed to convert images to PDF.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (result) triggerBytesDownload(result.pdfBytes, result.fileName);
  };

  const handleReset = () => {
    setImages([]);
    setResult(null);
  };

  return (
    <ToolLayout
      title="Images to PDF"
      description="Convert PNG, JPG, and WebP imagery into clean, standardized PDF pages."
      icon={FileImage}
      category="Convert"
    >
      <div className="space-y-6">
        <div className="flex flex-col items-center justify-center p-8 sm:p-10 rounded-2xl border-2 border-dashed border-border bg-surface-secondary/30 text-center">
          <ImageIcon className="size-10 text-primary mb-3" />
          <h3 className="text-sm font-semibold text-foreground">Select images to convert</h3>
          <p className="text-xs text-muted-foreground mt-0.5 mb-4">PNG, JPG, or WebP</p>
          <label className="cursor-pointer">
            <span className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors">
              Choose Local Images
            </span>
            <input
              type="file"
              multiple
              accept="image/png,image/jpeg,image/webp"
              onChange={handleAddImages}
              className="hidden"
            />
          </label>
        </div>

        {images.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-semibold text-muted-foreground px-1">
              Images ({images.length}):
            </div>
            <div className="space-y-2">
              {images.map((img, idx) => (
                <div
                  key={`${img.name}-${idx}`}
                  className="flex items-center justify-between p-3 rounded-xl border border-border bg-surface shadow-2xs"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <span className="size-6 rounded-md bg-surface-secondary text-foreground text-xs font-mono flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div className="truncate">
                      <p className="text-xs font-medium text-foreground truncate">{img.name}</p>
                      <p className="text-[10px] text-muted-foreground">{formatFileSize(img.size)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => moveImage(idx, "up")} disabled={idx === 0} className="size-7 p-0">
                      <ArrowUp className="size-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => moveImage(idx, "down")} disabled={idx === images.length - 1} className="size-7 p-0">
                      <ArrowDown className="size-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => removeImage(idx)} className="size-7 p-0 text-destructive hover:bg-destructive/10">
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <ToolActionBar
          actionLabel={`Convert ${images.length} Images to PDF`}
          isProcessing={isProcessing}
          canExecute={images.length > 0}
          isDone={!!result}
          resultFileName={result?.fileName}
          onExecute={handleConvert}
          onDownload={handleDownload}
          onReset={handleReset}
        />
      </div>
    </ToolLayout>
  );
}
