"use client";

import React, { useState, useCallback } from "react";
import { PenTool, Sparkles, AlertCircle } from "lucide-react";
import { ToolLayout } from "./tool-layout";
import { ToolActionBar } from "./tool-action-bar";
import { SharedDropzone } from "@/components/file-handling/shared-dropzone";
import { SignCanvasPad } from "./sign/sign-canvas-pad";
import { SignTypeGenerator } from "./sign/sign-type-generator";
import { SignUploadPad } from "./sign/sign-upload-pad";
import { SignPreviewPlacement } from "./sign/sign-preview-placement";
import { signPdf, SignaturePlacement, SignPdfResult } from "@/lib/pdf/operations/sign";
import { downloadPdfBytes } from "@/lib/pdf/download";
import { ResultPreviewSection } from "@/components/preview/result-preview-section";
import { Button } from "@/components/ui/button";

type SignTab = "draw" | "type" | "upload";

export function SignToolView() {
  const [file, setFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState<SignTab>("draw");
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [placements, setPlacements] = useState<SignaturePlacement[]>([]);
  const [signerName, setSignerName] = useState("");
  const [signDate, setSignDate] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SignPdfResult | null>(null);

  const handlePlacementReady = useCallback(
    (p: SignaturePlacement[], name: string, date: string) => {
      setPlacements(p);
      setSignerName(name);
      setSignDate(date);
    },
    []
  );

  const handleExecuteSign = async () => {
    if (!file || !signatureDataUrl || placements.length === 0) return;
    setIsProcessing(true);
    setError(null);
    try {
      const res = await signPdf(file, {
        signatureImageBase64: signatureDataUrl,
        placements,
        signerName: signerName.trim() || undefined,
        signDate: signDate || undefined,
      });
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign document.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (result) downloadPdfBytes(result.pdfBytes, result.fileName);
  };

  const handleReset = () => {
    setFile(null);
    setSignatureDataUrl(null);
    setPlacements([]);
    setResult(null);
    setError(null);
  };

  return (
    <ToolLayout
      title="Sign PDF Document"
      description="Draw, type, or upload your signature and stamp it anywhere on your PDF with 100% in-browser privacy."
      icon={PenTool}
      category="Edit & Optimize"
    >
      <div className="flex flex-col gap-6">
        {!file ? (
          <SharedDropzone onFileSelect={(f) => setFile(f)} />
        ) : result ? (
          <div className="space-y-4">
            <ResultPreviewSection
              pdfBytes={result.pdfBytes}
              fileName={result.fileName}
              title="Signed Document Preview"
              onDownload={handleDownload}
            />
            <div className="flex justify-center">
              <Button onClick={handleReset} variant="outline" size="sm" className="text-xs">
                Sign Another Document
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Step 1: Signature creation tabs */}
            <div className="p-4 rounded-2xl border border-border bg-surface-secondary/30 flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <PenTool className="size-3.5 text-primary" /> Step 1: Choose or Create Signature
                </span>
                <div className="flex bg-muted/60 p-1 rounded-lg text-xs font-semibold">
                  {(["draw", "type", "upload"] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={`px-3 py-1 rounded-md capitalize transition-colors ${
                        activeTab === tab ? "bg-surface text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {activeTab === "draw" && <SignCanvasPad onSignatureChange={setSignatureDataUrl} />}
              {activeTab === "type" && <SignTypeGenerator onSignatureChange={setSignatureDataUrl} />}
              {activeTab === "upload" && <SignUploadPad onSignatureChange={setSignatureDataUrl} />}
            </div>

            {/* Step 2: Placement preview */}
            {signatureDataUrl && (
              <div className="p-4 rounded-2xl border border-border bg-surface flex flex-col gap-4 shadow-xs">
                <div className="flex items-center gap-1.5 text-xs font-bold text-foreground border-b border-border pb-3">
                  <Sparkles className="size-3.5 text-accent" /> Step 2: Position Signature on Page
                </div>
                <SignPreviewPlacement
                  pdfFile={file}
                  signatureDataUrl={signatureDataUrl}
                  onPlacementReady={handlePlacementReady}
                />
              </div>
            )}

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-xl text-xs text-destructive flex items-center gap-2">
                <AlertCircle className="size-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <ToolActionBar
              actionLabel="Sign & Apply Placement"
              isProcessing={isProcessing}
              canExecute={Boolean(signatureDataUrl && placements.length > 0) && !result}
              isDone={!!result}
              resultFileName={file ? `${file.name.replace(/\.pdf$/i, "")}-signed.pdf` : undefined}
              onExecute={handleExecuteSign}
              onDownload={handleDownload}
              onReset={handleReset}
            />
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
