"use client";

import React, { useState } from "react";
import { SharedDropzone } from "@/components/file-handling/shared-dropzone";
import { PDFPreviewWorkspace } from "@/components/preview/pdf-preview-workspace";
import { createSamplePdfFile } from "@/lib/pdf/test-fixtures";
import { Sparkles, ShieldCheck } from "lucide-react";

export function HomePreviewSection() {
  const [activeFile, setActiveFile] = useState<File | null>(null);

  const handleSelectFile = (file: File) => {
    setActiveFile(file);
  };

  const handleClose = () => {
    setActiveFile(null);
  };

  return (
    <section id="workspace" className="w-full max-w-5xl mx-auto px-4 mb-16">
      {activeFile ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-success animate-pulse" />
              <span className="text-xs font-semibold text-foreground">
                In-Memory Preview Active
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                ({activeFile.name})
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-surface px-2.5 py-1 rounded-md border border-border">
              <ShieldCheck className="size-3.5 text-success" />
              <span>Zero server calls verified</span>
            </div>
          </div>
          <PDFPreviewWorkspace file={activeFile} onClose={handleClose} />
        </div>
      ) : (
        <div className="space-y-4">
          <SharedDropzone onFileSelect={handleSelectFile} />

          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-1">
            <span>No document on hand?</span>
            <button
              type="button"
              onClick={() => handleSelectFile(createSamplePdfFile())}
              className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline cursor-pointer transition-colors"
            >
              <Sparkles className="size-3.5" />
              <span>Try with a sample 3-page PDF</span>
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
