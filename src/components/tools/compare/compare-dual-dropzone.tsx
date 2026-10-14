"use client";

import React, { useRef } from "react";
import { UploadCloud, FileText, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CompareDualDropzoneProps {
  fileA: File | null;
  fileB: File | null;
  onSelectA: (file: File) => void;
  onSelectB: (file: File) => void;
  onLoadSample: () => void;
  isProcessing: boolean;
}

export function CompareDualDropzone({
  fileA,
  fileB,
  onSelectA,
  onSelectB,
  onLoadSample,
  isProcessing,
}: CompareDualDropzoneProps) {
  const inputARef = useRef<HTMLInputElement>(null);
  const inputBRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, setter: (f: File) => void) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped && dropped.type === "application/pdf") {
      setter(dropped);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Document A (Original) */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDrop(e, onSelectA)}
          onClick={() => inputARef.current?.click()}
          className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-all ${
            fileA
              ? "border-primary/50 bg-primary/5 shadow-2xs"
              : "border-border hover:border-primary/40 hover:bg-surface-elevated/40"
          }`}
        >
          <input
            ref={inputARef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && onSelectA(e.target.files[0])}
          />
          <div className="flex flex-col items-center">
            {fileA ? (
              <>
                <CheckCircle2 className="size-8 text-primary mb-2" />
                <span className="text-xs font-semibold text-foreground truncate max-w-[220px]">
                  {fileA.name}
                </span>
                <span className="text-[11px] text-muted-foreground mt-0.5">
                  {(fileA.size / 1024).toFixed(1)} KB • Original Document (A)
                </span>
                <Button variant="ghost" size="sm" className="mt-2 text-[11px] h-7 text-muted-foreground">
                  Replace File A
                </Button>
              </>
            ) : (
              <>
                <UploadCloud className="size-8 text-muted-foreground mb-2" />
                <span className="text-sm font-medium text-foreground">Document A (Original)</span>
                <span className="text-xs text-muted-foreground mt-1">
                  Drag & drop or click to upload first PDF
                </span>
              </>
            )}
          </div>
        </div>

        {/* Document B (Revised) */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDrop(e, onSelectB)}
          onClick={() => inputBRef.current?.click()}
          className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-all ${
            fileB
              ? "border-primary/50 bg-primary/5 shadow-2xs"
              : "border-border hover:border-primary/40 hover:bg-surface-elevated/40"
          }`}
        >
          <input
            ref={inputBRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && onSelectB(e.target.files[0])}
          />
          <div className="flex flex-col items-center">
            {fileB ? (
              <>
                <CheckCircle2 className="size-8 text-primary mb-2" />
                <span className="text-xs font-semibold text-foreground truncate max-w-[220px]">
                  {fileB.name}
                </span>
                <span className="text-[11px] text-muted-foreground mt-0.5">
                  {(fileB.size / 1024).toFixed(1)} KB • Revised Document (B)
                </span>
                <Button variant="ghost" size="sm" className="mt-2 text-[11px] h-7 text-muted-foreground">
                  Replace File B
                </Button>
              </>
            ) : (
              <>
                <UploadCloud className="size-8 text-muted-foreground mb-2" />
                <span className="text-sm font-medium text-foreground">Document B (Revised)</span>
                <span className="text-xs text-muted-foreground mt-1">
                  Drag & drop or click to upload second PDF
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-muted-foreground">
        <span>Upload two versions of any contract, agreement, or report to compare changes.</span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onLoadSample}
          disabled={isProcessing}
          className="gap-1.5 text-xs text-primary shrink-0"
        >
          <FileText className="size-3.5" />
          <span>Load Sample Comparison Pair</span>
        </Button>
      </div>
    </div>
  );
}
