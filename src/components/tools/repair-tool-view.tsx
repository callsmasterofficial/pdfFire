"use client";

import React, { useState } from "react";
import { Wrench, RotateCcw, Loader2, Sparkles } from "lucide-react";
import { ToolLayout } from "./tool-layout";
import { Button } from "@/components/ui/button";
import { SharedDropzone } from "@/components/file-handling/shared-dropzone";
import { RepairDiagnosticsCard } from "./repair/repair-diagnostics-card";
import { repairPdfDocument, RepairResult } from "@/lib/pdf/operations/repair";
import { downloadPdfBytes } from "@/lib/pdf/download";
import { ResultPreviewSection } from "@/components/preview/result-preview-section";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export function RepairToolView() {
  const [file, setFile] = useState<File | null>(null);
  const [repairResult, setRepairResult] = useState<RepairResult | null>(null);
  const [isRepairing, setIsRepairing] = useState(false);

  const handleFileSelect = async (selected: File) => {
    setFile(selected);
    setIsRepairing(true);
    try {
      const res = await repairPdfDocument(selected);
      setRepairResult(res);
    } catch (err) {
      console.error("Repair error:", err);
    } finally {
      setIsRepairing(false);
    }
  };

  const handleLoadSampleCorrupt = async () => {
    setIsRepairing(true);
    try {
      const doc = await PDFDocument.create();
      const page = doc.addPage([595.28, 841.89]);
      const font = await doc.embedFont(StandardFonts.Helvetica);
      page.drawText("CORRUPTED FINANCIAL AUDIT (RECOVERED COPY)", {
        x: 50, y: 780, size: 14, font, color: rgb(0.1, 0.1, 0.1),
      });
      page.drawText("This file simulated a broken header with leading HTTP proxy headers.", {
        x: 50, y: 740, size: 11, font, color: rgb(0.3, 0.3, 0.3),
      });
      const validBytes = await doc.save();

      const junk = new TextEncoder().encode("HTTP/1.1 502 Bad Gateway\r\nX-Error-Source: CloudProxy\r\n\r\n");
      const damaged = new Uint8Array(junk.length + validBytes.length);
      damaged.set(junk, 0);
      damaged.set(validBytes, junk.length);

      const fakeFile = new File([damaged as unknown as BlobPart], "corrupt-audit-report.pdf", { type: "application/pdf" });
      setFile(fakeFile);
      const res = await repairPdfDocument(fakeFile);
      setRepairResult(res);
    } catch (err) {
      console.error("Sample corrupt generation error:", err);
    } finally {
      setIsRepairing(false);
    }
  };

  const handleDownload = () => {
    if (!repairResult || !file) return;
    const baseName = file.name.replace(/\.[^/.]+$/, "");
    downloadPdfBytes(repairResult.pdfBytes, `${baseName}-repaired.pdf`);
  };

  const handleReset = () => {
    setFile(null);
    setRepairResult(null);
  };

  return (
    <ToolLayout
      title="Repair PDF"
      description="Rebuild damaged cross-reference tables, fix corrupted file headers, and salvage readable document streams."
      icon={Wrench}
      category="Diagnostics"
    >
      <div className="space-y-6">
        {!repairResult ? (
          <div className="space-y-4">
            <SharedDropzone onFileSelect={handleFileSelect} />
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-muted-foreground">
              <span>Rebuilds standard xref structures, trailer records, and strips corrupt header anomalies.</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleLoadSampleCorrupt}
                disabled={isRepairing}
                className="gap-1.5 text-xs text-primary shrink-0"
              >
                <Sparkles className="size-3.5" />
                <span>Try Sample Damaged File</span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <span className="text-xs text-muted-foreground">Repaired Source Document:</span>
                <p className="text-sm font-semibold text-foreground">{file?.name}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={handleReset} className="gap-1.5 text-xs text-muted-foreground">
                <RotateCcw className="size-3.5" />
                <span>Repair Another File</span>
              </Button>
            </div>

            <RepairDiagnosticsCard diagnostics={repairResult.diagnostics} />

            <ResultPreviewSection
              pdfBytes={repairResult.pdfBytes}
              fileName={`${file?.name.replace(/\.[^/.]+$/, "")}-repaired.pdf`}
              title="Repaired Document Preview"
              onDownload={handleDownload}
            />
          </div>
        )}

        {isRepairing && (
          <div className="flex items-center justify-center gap-2 py-8 text-xs text-muted-foreground font-mono">
            <Loader2 className="size-4 animate-spin text-primary" />
            <span>Scanning binary streams and repairing structures...</span>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
