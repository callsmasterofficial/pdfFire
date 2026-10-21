"use client";

import React, { useState } from "react";
import { RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SharedDropzone } from "@/components/file-handling/shared-dropzone";
import { ToolLayout } from "./tool-layout";
import { ToolActionBar } from "./tool-action-bar";
import { ResultPreviewSection } from "@/components/preview/result-preview-section";
import { rotatePdfDocument, RotatePdfResult } from "@/lib/pdf/operations/rotate";
import { triggerBytesDownload } from "@/lib/pdf/download";

export function RotateToolView() {
  const [file, setFile] = useState<File | null>(null);
  const [angle, setAngle] = useState<90 | 180 | 270>(90);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<RotatePdfResult | null>(null);

  const handleRotate = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const res = await rotatePdfDocument(file, {
        angleDegrees: angle,
        outputFileName: `rotated-${angle}deg-${file.name}`,
      });
      setResult(res);
    } catch (err: unknown) {
      alert((err as Error).message || "Failed to rotate PDF.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (result) {
      triggerBytesDownload(result.pdfBytes, result.fileName);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
  };

  return (
    <ToolLayout
      title="Rotate PDF"
      description="Rotate all pages or specific sections 90, 180, or 270 degrees clockwise."
      icon={RotateCw}
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
                <p className="text-[10px] text-muted-foreground mt-0.5">Ready for orientation transform</p>
              </div>
              <Button variant="ghost" size="sm" onClick={handleReset} className="text-xs">
                Change File
              </Button>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-semibold text-foreground">
                Rotation Angle:
              </label>
              <div className="grid grid-cols-3 gap-3">
                {([90, 180, 270] as const).map((deg) => (
                  <button
                    key={deg}
                    type="button"
                    onClick={() => {
                      setAngle(deg);
                      setResult(null);
                    }}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all ${
                      angle === deg
                        ? "border-primary bg-primary/10 ring-2 ring-primary/40 text-primary font-bold shadow-xs"
                        : "border-border bg-surface hover:border-primary/40 text-foreground"
                    }`}
                  >
                    <RotateCw className="size-5 mb-1.5" />
                    <span className="text-xs">{deg}° Clockwise</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {result && (
          <ResultPreviewSection
            pdfBytes={result.pdfBytes}
            fileName={result.fileName}
            pageCount={result.pageCount}
            title="Rotated Document Preview"
            onDownload={handleDownload}
          />
        )}

        <ToolActionBar
          actionLabel={`Rotate ${angle}° Clockwise`}
          isProcessing={isProcessing}
          canExecute={!!file}
          isDone={!!result}
          resultFileName={result?.fileName}
          onExecute={handleRotate}
          onDownload={handleDownload}
          onReset={handleReset}
        />
      </div>
    </ToolLayout>
  );
}
