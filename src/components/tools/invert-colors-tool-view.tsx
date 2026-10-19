"use client";

import { useState } from "react";
import { CheckCircle2, Contrast, Eye, Info } from "lucide-react";
import { SharedDropzone } from "@/components/file-handling/shared-dropzone";
import { PDFPreviewWorkspace } from "@/components/preview/pdf-preview-workspace";
import { ToolActionBar } from "./tool-action-bar";
import { ToolLayout } from "./tool-layout";
import { ColourTransform, InvertColorsResult, transformPdfColours } from "@/lib/pdf/operations";
import { downloadPdfBytes } from "@/lib/pdf/download";

const MODES: { id: ColourTransform; name: string; description: string }[] = [
  { id: "invert", name: "Dark mode", description: "Invert all page colours" },
  { id: "sepia", name: "Sepia", description: "Warm, reduced-glare reading" },
  { id: "high-contrast", name: "High contrast", description: "Pure black-and-white pages" },
];

export function InvertColorsToolView() {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<ColourTransform>("invert");
  const [result, setResult] = useState<InvertColorsResult | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearResult = () => {
    setResult(null); setPreviewFile(null); setIsPreviewOpen(false); setError(null);
  };
  const run = async () => {
    if (!file) return;
    setBusy(true); setError(null);
    try {
      const next = await transformPdfColours(file, mode);
      setResult(next);
      setPreviewFile(new File([next.pdfBytes as unknown as BlobPart], next.fileName, { type: "application/pdf" }));
      setIsPreviewOpen(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to transform this PDF.");
    } finally { setBusy(false); }
  };

  return <ToolLayout title="Invert PDF Colours" description="Create a dark, sepia, or high-contrast reading copy of a PDF entirely on-device." icon={Contrast} category="Edit & Optimize">
    <div className="space-y-5">
      {!file ? <SharedDropzone onFileSelect={setFile} title="Select a PDF to transform" subtitle="Pages are rendered and recoloured only in your browser." /> : <>
        <div className="flex items-center justify-between rounded-xl border border-border bg-muted/20 p-3"><span className="text-xs font-semibold">{file.name}</span><button type="button" onClick={() => { setFile(null); clearResult(); }} className="text-xs text-primary">Change file</button></div>
        <div className="grid gap-3 sm:grid-cols-3">{MODES.map((item) => <button key={item.id} type="button" onClick={() => { setMode(item.id); clearResult(); }} className={`rounded-xl border p-4 text-left ${mode === item.id ? "border-primary bg-primary/10 ring-1 ring-primary" : "border-border hover:border-primary/50"}`}><p className="text-sm font-semibold">{item.name}</p><p className="mt-1 text-xs text-muted-foreground">{item.description}</p></button>)}</div>
      </>}
      {error && <p className="rounded-lg bg-destructive/10 p-3 text-xs text-destructive">{error}</p>}
      {result && <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-emerald-500/10 p-3 text-xs font-medium text-emerald-700 dark:text-emerald-300"><span className="flex gap-2"><CheckCircle2 className="size-4" />Transformed {result.pageCount} page{result.pageCount === 1 ? "" : "s"}. Review it before download.</span><button type="button" onClick={() => setIsPreviewOpen(true)} className="inline-flex items-center gap-1.5 rounded-md bg-background px-2.5 py-1.5 text-xs text-foreground shadow-xs"><Eye className="size-3.5" />View PDF</button></div>}
      {isPreviewOpen && previewFile && <div className="space-y-2"><p className="text-xs font-semibold">Transformed PDF preview</p><PDFPreviewWorkspace file={previewFile} onClose={() => setIsPreviewOpen(false)} /></div>}
      <div className="flex gap-2 rounded-xl border border-border/50 bg-muted/40 p-3 text-[11px] text-muted-foreground"><Info className="size-4 shrink-0 text-primary" />This visual transformation rasterizes pages into a new PDF, so selectable text, links, and form fields are not retained.</div>
      <ToolActionBar actionLabel="Transform colours" isProcessing={busy} canExecute={!!file && !busy} isDone={!!result} resultFileName={result?.fileName} onExecute={run} onDownload={() => result && downloadPdfBytes(result.pdfBytes, result.fileName)} onReset={() => { setFile(null); clearResult(); }} />
    </div>
  </ToolLayout>;
}
