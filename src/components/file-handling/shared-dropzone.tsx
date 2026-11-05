"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, AlertCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { validatePdfFile } from "@/lib/pdf/validator";
import { ValidationOptions } from "@/types/pdf";
import { openDocumentsNative } from "@/lib/desktop/bridge";
import { useSession } from "@/components/account/session-provider";
import { getPlan } from "@/lib/billing/plans";

interface SharedDropzoneProps {
  onFileSelect: (file: File) => void;
  options?: ValidationOptions;
  title?: string;
  subtitle?: string;
  className?: string;
}

export function SharedDropzone({
  onFileSelect,
  options,
  title = "Select PDF file or drag and drop here",
  subtitle = "Files are processed entirely in your browser. Nothing is uploaded.",
  className = "",
}: SharedDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { plan, entitlements } = useSession();

  // The size cap used to be a fixed 100 MB, which is the Free limit, so a Pro
  // subscriber was held to the free allowance they had paid to leave behind.
  // The plan decides it now. A caller that asks for something smaller — a tool
  // with its own reason — still wins.
  const planCapBytes =
    entitlements.maxFileSizeMb === null
      ? Number.POSITIVE_INFINITY
      : entitlements.maxFileSizeMb * 1024 * 1024;
  const effectiveOptions: ValidationOptions = {
    ...options,
    maxSizeBytes: Math.min(options?.maxSizeBytes ?? Number.POSITIVE_INFINITY, planCapBytes),
  };

  const processFile = async (file: File) => {
    setErrorMsg(null);
    const result = await validatePdfFile(file, effectiveOptions);
    if (!result.valid) {
      const overPlanCap = file.size > planCapBytes;
      setErrorMsg(
        overPlanCap
          ? `${result.error ?? "File is too large."} ${getPlan(plan).name} allows ` +
            `${entitlements.maxFileSizeMb} MB per document.`
          : result.error || "Invalid file."
      );
      return;
    }
    onFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  /**
   * In the desktop shell this opens the OS picker, which gives the user their
   * real filesystem rather than the browser's sandboxed chooser. In a browser
   * `openDocumentsNative` returns null and we fall through to the hidden
   * <input>, so both paths end at the same `processFile`.
   */
  const openPicker = async () => {
    try {
      const nativeFiles = await openDocumentsNative();
      if (nativeFiles === null) {
        inputRef.current?.click();
        return;
      }
      // An empty array means the user dismissed the picker; do nothing.
      if (nativeFiles.length > 0) {
        await processFile(nativeFiles[0]);
      }
    } catch {
      // Never strand the user on a broken bridge.
      inputRef.current?.click();
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processFile(file);
    }
    // Reset input so same file can be selected again if needed
    if (e.target) e.target.value = "";
  };

  return (
    <div className={`w-full ${className}`}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openPicker}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            void openPicker();
          }
        }}
        tabIndex={0}
        role="button"
        aria-label="Upload PDF file"
        className={`relative flex flex-col items-center justify-center p-8 sm:p-12 rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer focus:outline-hidden focus:ring-3 focus:ring-primary/40 ${
          isDragging
            ? "border-primary bg-primary/10 ring-4 ring-primary/20 scale-[1.01]"
            : "border-border/80 bg-surface hover:border-primary/50 hover:bg-surface-secondary/40 shadow-xs"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileInput}
          className="hidden"
          aria-hidden="true"
        />

        <div className="size-14 rounded-full bg-surface-secondary flex items-center justify-center text-primary mb-4 border border-border transition-transform group-hover:scale-105">
          <UploadCloud className="size-7" />
        </div>

        <h3 className="text-lg font-semibold text-foreground text-center mb-1">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground text-center max-w-sm mb-5">
          {subtitle}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button variant="default" size="default" className="pointer-events-none">
            Choose Local File
          </Button>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-surface-secondary px-2.5 py-1 rounded-md border border-border">
            <ShieldCheck className="size-3.5 text-success" />
            <span>100% Client-Side</span>
          </div>
        </div>

        {errorMsg && (
          <div className="mt-4 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs font-medium max-w-md text-center">
            <AlertCircle className="size-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>
    </div>
  );
}
