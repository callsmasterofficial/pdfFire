"use client";

import React, { useState, useRef } from "react";
import { Code2, ShieldCheck, AlertCircle, FileCode, UploadCloud } from "lucide-react";
import { ToolLayout } from "./tool-layout";
import { ToolActionBar } from "./tool-action-bar";
import { HtmlMetricsBadge } from "./html-metrics-badge";
import { ResultPreviewSection } from "@/components/preview/result-preview-section";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { convertHtmlToPdf, HtmlToPdfResult, parseHtml } from "@/lib/pdf/operations";
import { downloadPdfBytes } from "@/lib/pdf/download";
import { UnicodeFidelityNotice } from "@/components/tools/unicode-fidelity-notice";
import { TableFidelityNotice } from "@/components/tools/table-fidelity-notice";

const SAMPLE_HTML = `<!DOCTYPE html>
<html>
  <head><title>System Architecture Spec</title></head>
  <body>
    <h1>System Architecture Specification</h1>
    <p>This document details the <strong>100% client-side</strong> execution model for in-browser PDF utilities.</p>
    <blockquote>Privacy guarantee: user documents never touch any server or API.</blockquote>
    <h2>Core Modules</h2>
    <ul>
      <li>OpenXML Unzip &amp; Parser (Word and Excel)</li>
      <li>Vector Layout Typography Engine</li>
      <li>HiDPI PDF.js Canvas Preview Workspace</li>
    </ul>
    <h2>Specification Matrix</h2>
    <table>
      <tr><th>Module</th><th>Runtime</th><th>Transmission</th></tr>
      <tr><td>DOCX Parser</td><td>WebAssembly</td><td>0 bytes</td></tr>
      <tr><td>XLSX Parser</td><td>WebAssembly</td><td>0 bytes</td></tr>
      <tr><td>HTML Parser</td><td>Local DOM</td><td>0 bytes</td></tr>
    </table>
    <pre><code>const privacyFirst = true;\nexport default privacyFirst;</code></pre>
  </body>
</html>`;

export function HtmlToPdfToolView() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [html, setHtml] = useState(SAMPLE_HTML);
  const [title, setTitle] = useState("System Architecture Spec");
  const [result, setResult] = useState<HtmlToPdfResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsed = parseHtml(html);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setHtml(reader.result);
        const p = parseHtml(reader.result);
        if (p.title && p.title !== "HTML Document") setTitle(p.title);
        setResult(null);
      }
    };
    reader.readAsText(file);
  };

  const handleConvert = async () => {
    if (!html.trim()) return;
    setIsProcessing(true);
    setError(null);
    try {
      const res = await convertHtmlToPdf(html, title);
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to convert HTML.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ToolLayout title="HTML to PDF" description="Paste HTML code or upload .html files to create clean, paginated vector PDF pages." icon={Code2} category="Convert">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="max-w-md w-full space-y-1.5">
            <Label htmlFor="doc-title" className="text-xs font-semibold">Document Title</Label>
            <Input id="doc-title" value={title} onChange={(e) => setTitle(e.target.value)} className="h-9 text-xs" />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="gap-1.5 text-xs">
              <UploadCloud className="size-3.5" />Upload .html
            </Button>
            <input ref={fileInputRef} type="file" accept=".html,.htm,text/html" onChange={handleFileUpload} className="hidden" />
            <Button variant="outline" size="sm" onClick={() => { setHtml(SAMPLE_HTML); setTitle("System Architecture Spec"); setResult(null); }} className="gap-1.5 text-xs">
              <FileCode className="size-3.5" />Sample HTML
            </Button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="html-source" className="text-xs font-semibold">HTML Source</Label>
            <textarea id="html-source" value={html} onChange={(e) => { setHtml(e.target.value); setResult(null); }} rows={13} spellCheck={false} className="w-full rounded-xl border border-border bg-muted/20 p-4 font-mono text-xs leading-relaxed focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div className="space-y-1.5">
            <span className="text-xs font-semibold">Parsed Content Overview</span>
            <div className="rounded-xl border border-border bg-muted/20 p-4 h-[240px] overflow-auto text-xs space-y-2">
              {parsed.blocks.length ? (
                parsed.blocks.map((b, i) => (
                  <div key={i} className="flex gap-2 items-baseline text-muted-foreground border-b border-border/40 pb-1.5">
                    <span className="uppercase text-[9px] font-mono px-1.5 py-0.5 rounded bg-muted font-bold shrink-0">{b.kind}</span>
                    <span className="truncate">{b.text || (b.tableRows ? `${b.tableRows.length} rows table` : "rule")}</span>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground italic text-xs">Type or paste HTML above to inspect parsed vector blocks.</p>
              )}
            </div>
          </div>
        </div>

        <HtmlMetricsBadge elementCount={parsed.elementCount} wordCount={parsed.wordCount} tableCount={parsed.tableCount} pageCount={result?.pageCount} />

        {error && <div className="flex gap-2 rounded-xl bg-destructive/10 p-3 text-xs text-destructive"><AlertCircle className="size-4 shrink-0" />{error}</div>}
        {result?.textFidelity && <UnicodeFidelityNotice report={result.textFidelity} />}

            {result?.tableFidelity && <TableFidelityNotice report={result.tableFidelity} />}

        {result && (
          <ResultPreviewSection
            pdfBytes={result.pdfBytes}
            fileName={result.fileName}
            pageCount={result.pageCount}
            title="HTML Vector PDF Preview"
            onDownload={() => downloadPdfBytes(result.pdfBytes, result.fileName)}
          />
        )}

        <div className="flex gap-2 rounded-xl border border-border/50 bg-muted/30 p-3 text-[11px] text-muted-foreground">
          <ShieldCheck className="size-4 shrink-0 text-primary" />HTML is parsed and laid out directly in your browser. Stylesheets, scripts, and external network requests are stripped for privacy.
        </div>

        <ToolActionBar actionLabel="Convert to PDF" isProcessing={isProcessing} canExecute={!!html.trim() && !isProcessing} isDone={!!result} resultFileName={result?.fileName} onExecute={handleConvert} onDownload={() => result && downloadPdfBytes(result.pdfBytes, result.fileName)} onReset={() => { setHtml(""); setTitle("Untitled"); setResult(null); setError(null); }} />
      </div>
    </ToolLayout>
  );
}
