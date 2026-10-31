"use client";

import React, { useState } from "react";
import { ShieldAlert } from "lucide-react";
import { ToolLayout } from "@/components/tools/tool-layout";
import { ToolActionBar } from "@/components/tools/tool-action-bar";
import { SharedDropzone } from "@/components/file-handling/shared-dropzone";
import { RedactPiiScanner } from "@/components/tools/redact/redact-pii-scanner";
import { RedactPageCanvas } from "@/components/tools/redact/redact-page-canvas";
import { RedactControls } from "@/components/tools/redact/redact-controls";
import { applyRedactions, RedactionArea, RedactionResult } from "@/lib/pdf/operations/redact";
import { RedactVerificationNotice } from "@/components/tools/redact/redact-verification-notice";
import { RedactFileSummary } from "@/components/tools/redact/redact-file-summary";
import { ResultPreviewSection } from "@/components/preview/result-preview-section";
import { PDFDocument } from "pdf-lib";

export function RedactToolView() {
  const [file, setFile] = useState<File | null>(null);
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [pageCount, setPageCount] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [redactions, setRedactions] = useState<RedactionArea[]>([]);
  const [fillColor, setFillColor] = useState<NonNullable<RedactionArea["fillColor"]>>("black");
  const [overlayText, setOverlayText] = useState("[REDACTED]");
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<RedactionResult | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const handleFileSelect = async (selected: File) => {
    setFile(selected);
    setResult(null);
    setRedactions([]);
    setCurrentPage(1);
    try {
      const buffer = await selected.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      setPdfBytes(bytes);
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      setPageCount(doc.getPageCount());
    } catch {
      setPageCount(1);
    }
  };

  const handleAddRedactions = (newItems: RedactionArea[]) => {
    setRedactions((prev) => [...prev, ...newItems]);
  };

  const handleRemoveRedaction = (id: string) => {
    setRedactions((prev) => prev.filter((r) => r.id !== id));
  };

  const handleExecute = async () => {
    if (!pdfBytes) return;
    setIsProcessing(true);
    try {
      const res = await applyRedactions(pdfBytes, redactions, true);
      setResult(res);
      const blob = new Blob([res.pdfBytes as unknown as BlobPart], { type: "application/pdf" });
      setDownloadUrl(URL.createObjectURL(blob));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to apply redactions.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!downloadUrl || !file) return;
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = `${file.name.replace(/\.pdf$/i, "")}_redacted.pdf`;
    a.click();
  };

  const handleReset = () => {
    setFile(null);
    setPdfBytes(null);
    setRedactions([]);
    setResult(null);
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    setDownloadUrl(null);
  };

  return (
    <ToolLayout
      title="Redact PDF"
      description="Delete sensitive text from the PDF content streams, cover it, and strip document metadata — 100% in your browser."
      category="Security"
      icon={ShieldAlert}
    >
      <div className="w-full max-w-4xl mx-auto space-y-6">
        {!file || !pdfBytes ? (
          <SharedDropzone
            onFileSelect={handleFileSelect}
            title="Select a PDF to Redact"
            subtitle="Drag & drop your document to auto-scan PII or black out confidential sections"
          />
        ) : (
          <div className="space-y-6">
            <RedactFileSummary
              fileName={file.name}
              pageCount={pageCount}
              sizeBytes={file.size}
              onReset={handleReset}
            />

            <RedactPiiScanner
              pdfBytes={pdfBytes}
              onAddRedactions={handleAddRedactions}
              fillColor={fillColor}
              overlayText={overlayText}
            />

            <RedactControls
              fillColor={fillColor}
              onColorChange={setFillColor}
              overlayText={overlayText}
              onTextChange={setOverlayText}
              redactionCount={redactions.length}
              onClearAll={() => setRedactions([])}
            />

            <RedactPageCanvas
              pdfBytes={pdfBytes}
              currentPage={currentPage}
              totalPages={pageCount}
              onPageChange={setCurrentPage}
              redactions={redactions}
              onAddRedaction={(r) => handleAddRedactions([r])}
              onRemoveRedaction={handleRemoveRedaction}
              fillColor={fillColor}
              overlayText={overlayText}
            />

            {result && <RedactVerificationNotice result={result} />}

            {result && (
              <ResultPreviewSection
                pdfBytes={result.pdfBytes}
                fileName={`${file.name.replace(/\.pdf$/i, "")}_redacted.pdf`}
                title="Redacted Document Preview"
                onDownload={handleDownload}
              />
            )}

            <ToolActionBar
              actionLabel="Apply Redactions & Strip Metadata"
              resultFileName={file ? `${file.name.replace(/\.pdf$/i, "")}_redacted.pdf` : undefined}
              canExecute={redactions.length > 0 && !result}
              isProcessing={isProcessing}
              isDone={!!result}
              onExecute={handleExecute}
              onDownload={handleDownload}
              onReset={handleReset}
            />
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
