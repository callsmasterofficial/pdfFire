"use client";

import React, { useState } from "react";
import { UploadCloud, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FileDropzone() {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0].name);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0].name);
    }
  };

  return (
    <section className="w-full max-w-3xl mx-auto px-4 mb-14">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative flex flex-col items-center justify-center p-8 sm:p-12 rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer ${
          isDragging
            ? "border-primary bg-primary/5 ring-4 ring-primary/20 scale-[1.01]"
            : "border-border/80 bg-surface hover:border-primary/50 hover:bg-surface-secondary/40 shadow-xs"
        }`}
      >
        <input
          id="file-upload-input"
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          aria-label="Upload PDF or image files"
        />

        <div className="size-14 rounded-full bg-surface-secondary flex items-center justify-center text-primary mb-4 border border-border">
          <UploadCloud className="size-7" />
        </div>

        <h3 className="text-lg font-semibold text-foreground text-center mb-1">
          Select PDF files or drop them here
        </h3>
        <p className="text-sm text-muted-foreground text-center max-w-sm mb-5">
          Files are processed in memory and never transmitted over the network.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button variant="default" size="default" className="pointer-events-none">
            Choose Local Files
          </Button>
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
            <span className="px-2 py-1 rounded bg-surface-secondary border border-border">.pdf</span>
            <span className="px-2 py-1 rounded bg-surface-secondary border border-border">.jpg</span>
            <span className="px-2 py-1 rounded bg-surface-secondary border border-border">.png</span>
          </div>
        </div>

        {selectedFile && (
          <div className="mt-4 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-success/10 border border-success/30 text-success text-xs font-medium">
            <CheckCircle2 className="size-4" />
            <span>Loaded: {selectedFile}</span>
          </div>
        )}
      </div>
    </section>
  );
}
