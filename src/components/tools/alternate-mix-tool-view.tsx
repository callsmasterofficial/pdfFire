"use client";

import React, { useState } from "react";
import { Shuffle } from "lucide-react";
import { ToolLayout } from "@/components/tools/tool-layout";
import { ToolActionBar } from "@/components/tools/tool-action-bar";
import { ResultPreviewSection } from "@/components/preview/result-preview-section";
import { AlternateMixDropzones } from "@/components/tools/alternate-mix/alternate-mix-dropzones";
import { AlternateMixSettings } from "@/components/tools/alternate-mix/alternate-mix-settings";
import { alternateMixPdfs, AlternateMixOptions, AlternateMixResult } from "@/lib/pdf/operations/alternate-mix";
import { PDFDocument } from "pdf-lib";

export function AlternateMixToolView() {
  const [fileA, setFileA] = useState<File | null>(null);
  const [fileB, setFileB] = useState<File | null>(null);
  const [pageCountA, setPageCountA] = useState(0);
  const [pageCountB, setPageCountB] = useState(0);
  const [options, setOptions] = useState<AlternateMixOptions>({
    reverseB: false,
    reverseA: false,
    swapOrder: false,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<AlternateMixResult | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const loadPageCount = async (f: File) => {
    try {
      const buf = await f.arrayBuffer();
      const doc = await PDFDocument.load(buf, { ignoreEncryption: true });
      return doc.getPageCount();
    } catch {
      return 1;
    }
  };

  const handleSelectA = async (f: File) => {
    setFileA(f);
    setResult(null);
    setPageCountA(await loadPageCount(f));
  };

  const handleSelectB = async (f: File) => {
    setFileB(f);
    setResult(null);
    setPageCountB(await loadPageCount(f));
  };

  const handleSwap = () => {
    const tempF = fileA;
    const tempC = pageCountA;
    setFileA(fileB);
    setPageCountA(pageCountB);
    setFileB(tempF);
    setPageCountB(tempC);
    setResult(null);
  };

  const handleExecute = async () => {
    if (!fileA || !fileB) return;
    setIsProcessing(true);
    try {
      const [bufA, bufB] = await Promise.all([fileA.arrayBuffer(), fileB.arrayBuffer()]);
      const res = await alternateMixPdfs(new Uint8Array(bufA), new Uint8Array(bufB), options);
      setResult(res);
      const blob = new Blob([res.pdfBytes as unknown as BlobPart], { type: "application/pdf" });
      setDownloadUrl(URL.createObjectURL(blob));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to alternate mix documents.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!downloadUrl) return;
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = "mixed_interleaved_document.pdf";
    a.click();
  };

  const handleReset = () => {
    setFileA(null);
    setFileB(null);
    setPageCountA(0);
    setPageCountB(0);
    setResult(null);
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    setDownloadUrl(null);
  };

  return (
    <ToolLayout
      title="Alternate & Mix PDF"
      description="Interleave pages from two PDFs in alternating sequence — perfect for combining odd & even scanner pages."
      category="Organize"
      icon={Shuffle}
    >
      <div className="w-full max-w-4xl mx-auto space-y-6">
        <AlternateMixDropzones
          fileA={fileA}
          fileB={fileB}
          pageCountA={pageCountA}
          pageCountB={pageCountB}
          onSelectA={handleSelectA}
          onSelectB={handleSelectB}
          onSwap={handleSwap}
        />

        {fileA && fileB && (
          <>
            <AlternateMixSettings
              options={options}
              onChange={setOptions}
              countA={pageCountA}
              countB={pageCountB}
            />

            {result && (
              <ResultPreviewSection
                pdfBytes={result.pdfBytes}
                fileName="mixed_interleaved_document.pdf"
                pageCount={result.totalOutputPages}
                title="Interleaved Document Preview"
                onDownload={handleDownload}
              />
            )}

            <ToolActionBar
              actionLabel="Mix & Interleave PDFs"
              resultFileName="mixed_interleaved_document.pdf"
              canExecute={!!fileA && !!fileB && !result}
              isProcessing={isProcessing}
              isDone={!!result}
              onExecute={handleExecute}
              onDownload={handleDownload}
              onReset={handleReset}
            />
          </>
        )}
      </div>
    </ToolLayout>
  );
}
