"use client";

import React, { useState } from "react";
import { FileText, ShieldCheck, AlertCircle, UploadCloud, FileCode } from "lucide-react";
import { ToolLayout } from "./tool-layout";
import { ToolActionBar } from "./tool-action-bar";
import { DocxMetricsBadge } from "./docx-metrics-badge";
import { ResultPreviewSection } from "@/components/preview/result-preview-section";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { parseDocxBytes, convertDocxToPdf, DocxToPdfResult, ParsedDocx } from "@/lib/pdf/operations";
import { downloadPdfBytes } from "@/lib/pdf/download";
import { zipSync, strToU8 } from "fflate";
import { TextFidelityNotice } from "@/components/tools/text-fidelity-notice";

export function DocxToPdfToolView() {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [fileBytes, setFileBytes] = useState<Uint8Array | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [title, setTitle] = useState("Word Document");
  const [parsed, setParsed] = useState<ParsedDocx | null>(null);
  const [result, setResult] = useState<DocxToPdfResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processBytes = (bytes: Uint8Array, name: string) => {
    try {
      setError(null);
      setResult(null);
      const parsedDoc = parseDocxBytes(bytes);
      setFileBytes(bytes);
      setFileName(name);
      setParsed(parsedDoc);
      if (parsedDoc.title && parsedDoc.title !== "Document") setTitle(parsedDoc.title);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to parse Word document.");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        processBytes(new Uint8Array(reader.result), file.name);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleLoadSample = () => {
    const sampleXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body>
          <w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>Quarterly Engineering Strategy</w:t></w:r></w:p>
          <w:p><w:r><w:t>This document demonstrates </w:t></w:r><w:r><w:rPr><w:b/></w:rPr><w:t>100% client-side Word to PDF conversion</w:t></w:r><w:r><w:t> using native OpenXML parsing and vector rendering.</w:t></w:r></w:p>
          <w:p><w:pPr><w:pStyle w:val="Heading2"/></w:pPr><w:r><w:t>Key Architectural Principles</w:t></w:r></w:p>
          <w:p><w:pPr><w:numPr><w:ilvl w:val="0"/></w:numPr></w:pPr><w:r><w:t>Zero server dependencies: documents never leave browser memory.</w:t></w:r></w:p>
          <w:p><w:pPr><w:numPr><w:ilvl w:val="0"/></w:numPr></w:pPr><w:r><w:t>Clean typography with automated heading hierarchy and text wrapping.</w:t></w:r></w:p>
          <w:p><w:pPr><w:numPr><w:ilvl w:val="0"/></w:numPr></w:pPr><w:r><w:t>Structured table rendering with alternating row backgrounds.</w:t></w:r></w:p>
          <w:tbl>
            <w:tr><w:tc><w:p><w:r><w:t>Metric</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>Target</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>Status</w:t></w:r></w:p></w:tc></w:tr>
            <w:tr><w:tc><w:p><w:r><w:t>Latency</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>&lt; 100ms</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>Achieved</w:t></w:r></w:p></w:tc></w:tr>
            <w:tr><w:tc><w:p><w:r><w:t>Data Leakage</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>0 bytes</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>100% Private</w:t></w:r></w:p></w:tc></w:tr>
          </w:tbl>
        </w:body>
      </w:document>`;
    const sampleDocx = zipSync({ "word/document.xml": strToU8(sampleXml) });
    processBytes(sampleDocx, "Sample_Engineering_Strategy.docx");
  };

  const handleConvert = async () => {
    if (!fileBytes) return;
    setIsProcessing(true);
    setError(null);
    try {
      const res = await convertDocxToPdf(fileBytes, title);
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to convert document.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ToolLayout title="DOCX to PDF" description="Convert Microsoft Word documents (.docx) to crisp vector PDF files 100% locally." icon={FileText} category="Convert">
      <div className="space-y-6">
        {!fileBytes ? (
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-border/80 rounded-2xl p-8 sm:p-12 text-center bg-muted/10 hover:bg-muted/20 transition-colors">
            <UploadCloud className="size-12 text-primary/70 mb-3" />
            <h3 className="font-semibold text-base mb-1">Select or drop a Microsoft Word (.docx) file</h3>
            <p className="text-xs text-muted-foreground max-w-sm mb-4">Converts text styles, headings, bullet lists, and tables without uploading files to any cloud server.</p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Button size="sm" onClick={() => fileInputRef.current?.click()} className="cursor-pointer">Browse Word File</Button>
              <input ref={fileInputRef} type="file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={handleFileUpload} className="hidden" />
              <Button variant="outline" size="sm" onClick={handleLoadSample} className="gap-1.5"><FileCode className="size-3.5" />Load Sample Document</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-muted/20">
              <div className="flex items-center gap-3">
                <FileText className="size-6 text-primary shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-foreground truncate max-w-xs sm:max-w-md">{fileName}</p>
                  <p className="text-[11px] text-muted-foreground">{((fileBytes.length) / 1024).toFixed(1)} KB • Word Document</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => { setFileBytes(null); setParsed(null); setResult(null); }} className="text-xs">Change File</Button>
            </div>

            <div className="max-w-md space-y-1.5">
              <Label htmlFor="doc-title" className="text-xs font-semibold">Document Title (PDF Metadata)</Label>
              <Input id="doc-title" value={title} onChange={(e) => setTitle(e.target.value)} className="h-9 text-xs" />
            </div>

            {parsed && <DocxMetricsBadge paragraphCount={parsed.paragraphCount} wordCount={parsed.wordCount} tableCount={parsed.tableCount} pageCount={result?.pageCount} />}
          </div>
        )}

        {error && <div className="flex gap-2 rounded-xl bg-destructive/10 p-3 text-xs text-destructive"><AlertCircle className="size-4 shrink-0" />{error}</div>}
        {result?.textFidelity && <TextFidelityNotice report={result.textFidelity} />}

        {result && (
          <ResultPreviewSection
            pdfBytes={result.pdfBytes}
            fileName={result.fileName}
            pageCount={result.pageCount}
            title="Word Vector PDF Preview"
            onDownload={() => downloadPdfBytes(result.pdfBytes, result.fileName)}
          />
        )}

        <div className="flex gap-2 rounded-xl border border-border/50 bg-muted/30 p-3 text-[11px] text-muted-foreground">
          <ShieldCheck className="size-4 shrink-0 text-primary" />Your Word documents are decompressed and rendered directly inside browser WebAssembly memory. Zero data leaves your device.
        </div>

        <ToolActionBar actionLabel="Convert to PDF" isProcessing={isProcessing} canExecute={!!fileBytes && !isProcessing} isDone={!!result} resultFileName={result?.fileName} onExecute={handleConvert} onDownload={() => result && downloadPdfBytes(result.pdfBytes, result.fileName)} onReset={() => { setFileBytes(null); setParsed(null); setResult(null); setError(null); }} />
      </div>
    </ToolLayout>
  );
}
