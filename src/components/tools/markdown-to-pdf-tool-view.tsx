"use client";

import { useState } from "react";
import { AlertCircle, FileCode2, ShieldCheck } from "lucide-react";
import { ToolLayout } from "./tool-layout";
import { ToolActionBar } from "./tool-action-bar";
import { ResultPreviewSection } from "@/components/preview/result-preview-section";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  convertMarkdownToPdf,
  MarkdownToPdfResult,
  parseMarkdown,
} from "@/lib/pdf/operations";
import { downloadPdfBytes } from "@/lib/pdf/download";
import { TextFidelityNotice } from "@/components/tools/text-fidelity-notice";
import { MARKDOWN_SAMPLE as SAMPLE } from "@/components/tools/markdown/markdown-sample";
export function MarkdownToPdfToolView() {
  const [title, setTitle] = useState("Project brief");
  const [markdown, setMarkdown] = useState(SAMPLE);
  const [result, setResult] = useState<MarkdownToPdfResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const blocks = parseMarkdown(markdown);
  const makePdf = async () => {
    setIsProcessing(true);
    setError(null);
    try {
      setResult(await convertMarkdownToPdf(markdown, title));
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to generate the PDF.",
      );
    } finally {
      setIsProcessing(false);
    }
  };
  return (
    <ToolLayout
      title="Markdown to PDF"
      description="Write Markdown and export a clean, paginated vector PDF without uploading your content."
      icon={FileCode2}
      category="Convert"
    >
      <div className="space-y-5">
        <div className="space-y-1.5 max-w-md">
          <Label htmlFor="markdown-title" className="text-xs font-semibold">
            Document title
          </Label>
          <Input
            id="markdown-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="h-9 text-sm"
          />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <Label
                htmlFor="markdown-source"
                className="text-xs font-semibold"
              >
                Markdown editor
              </Label>
              <span className="text-[11px] text-muted-foreground">
                {markdown.length.toLocaleString()} chars
              </span>
            </div>
            <textarea
              id="markdown-source"
              value={markdown}
              onChange={(event) => {
                setMarkdown(event.target.value);
                setResult(null);
              }}
              rows={18}
              spellCheck={false}
              className="w-full resize-y rounded-xl border border-border bg-muted/20 p-4 font-mono text-xs leading-relaxed focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="space-y-1.5">
            <span className="text-xs font-semibold">Live structure</span>
            <div className="min-h-[384px] rounded-xl border border-border bg-muted/20 p-5 text-sm leading-relaxed">
              <p className="mb-4 text-[11px] font-mono text-muted-foreground">
                {blocks.length} layout blocks • vector PDF output
              </p>
              {blocks.slice(0, 18).map((block, index) => (
                <p
                  key={`${block.kind}-${index}`}
                  className={
                    block.kind === "heading"
                      ? "mb-3 font-bold text-foreground"
                      : block.kind === "quote"
                        ? "mb-3 border-l-2 border-primary pl-3 italic text-muted-foreground"
                        : block.kind === "code"
                          ? "mb-3 rounded bg-background p-2 font-mono text-xs"
                          : "mb-2 text-foreground/85"
                  }
                >
                  {block.kind === "bullet" ? "• " : ""}
                  {block.text || "—"}
                </p>
              ))}
            </div>
          </div>
        </div>
        {error && (
          <div className="flex gap-2 rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            {error}
          </div>
        )}
        {result?.textFidelity && <TextFidelityNotice report={result.textFidelity} />}

        {result && (
          <ResultPreviewSection
            pdfBytes={result.pdfBytes}
            fileName={result.fileName}
            pageCount={result.pageCount}
            title="Markdown Vector PDF Preview"
            onDownload={() => downloadPdfBytes(result.pdfBytes, result.fileName)}
          />
        )}
        <div className="flex gap-2 rounded-xl border border-border/50 bg-muted/40 p-3 text-[11px] text-muted-foreground">
          <ShieldCheck className="size-4 shrink-0 text-primary" />
          Markdown is parsed and paginated only in browser memory. Supported:
          headings, paragraphs, lists, quotes, rules, inline formatting, and
          fenced code.
        </div>
        <ToolActionBar
          actionLabel="Generate PDF"
          isProcessing={isProcessing}
          canExecute={markdown.trim().length > 0 && !isProcessing}
          isDone={!!result}
          resultFileName={result?.fileName}
          onExecute={makePdf}
          onDownload={() =>
            result && downloadPdfBytes(result.pdfBytes, result.fileName)
          }
          onReset={() => {
            setTitle("Untitled Markdown");
            setMarkdown("");
            setResult(null);
            setError(null);
          }}
        />
      </div>
    </ToolLayout>
  );
}
