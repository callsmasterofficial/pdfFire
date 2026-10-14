"use client";

import React, { useState } from "react";
import { Zap, AlertCircle } from "lucide-react";
import { ToolLayout } from "./tool-layout";
import { ToolActionBar } from "./tool-action-bar";
import { SharedDropzone } from "@/components/file-handling/shared-dropzone";
import { CompressStatsCard } from "./compress-stats-card";
import {
  compressPdfDocument,
  CompressionPreset,
  CompressPdfResult,
} from "@/lib/pdf/operations/compress";
import { downloadPdfBytes } from "@/lib/pdf/download";

const PRESETS: { id: CompressionPreset; title: string; desc: string }[] = [
  { id: "low", title: "Lossless (Fast)", desc: "Compresses internal object streams without altering quality." },
  { id: "medium", title: "Balanced (Recommended)", desc: "Optimizes object streams and removes duplicate metadata." },
  { id: "strong", title: "Strong (Aggressive)", desc: "Downsamples raster scans and re-encodes pages for max size reduction." },
];

export function CompressToolView() {
  const [file, setFile] = useState<File | null>(null);
  const [preset, setPreset] = useState<CompressionPreset>("medium");
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<CompressPdfResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCompress = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);
    try {
      const res = await compressPdfDocument(file, {
        preset,
        stripMetadata: true,
        outputFileName: `compressed-${file.name}`,
      });
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to compress PDF.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    downloadPdfBytes(result.pdfBytes, result.fileName);
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setError(null);
  };

  return (
    <ToolLayout
      title="Compress PDF"
      description="Optimize PDF structure, compress object streams, and reduce file sizes with honest metrics."
      icon={Zap}
      category="Optimize"
    >
      <div className="space-y-6">
        {!file ? (
          <SharedDropzone onFileSelect={(f) => setFile(f)} />
        ) : (
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Compression Level
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPreset(p.id)}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      preset === p.id
                        ? "border-primary bg-primary/5 shadow-2xs"
                        : "border-border bg-surface hover:bg-surface-muted"
                    }`}
                  >
                    <div className="text-xs font-bold text-foreground">{p.title}</div>
                    <div className="text-[11px] text-muted-foreground mt-1 leading-snug">{p.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="p-3.5 rounded-lg border border-destructive/20 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
                <AlertCircle className="size-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {result && <CompressStatsCard result={result} />}

            <ToolActionBar
              actionLabel="Compress PDF"
              isProcessing={isProcessing}
              canExecute={!!file}
              isDone={!!result}
              resultFileName={result?.fileName}
              onExecute={handleCompress}
              onDownload={handleDownload}
              onReset={handleReset}
            />
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
