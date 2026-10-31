"use client";

import React, { useState } from "react";
import { Lock, ShieldAlert, CheckCircle2, AlertCircle } from "lucide-react";
import { ToolLayout } from "./tool-layout";
import { ToolActionBar } from "./tool-action-bar";
import { SharedDropzone } from "@/components/file-handling/shared-dropzone";
import { ProtectPasswordForm } from "./protect/protect-password-form";
import { ProtectPermissionsPanel } from "./protect/protect-permissions-panel";
import { protectPdf, ProtectPdfOptions, ProtectPdfResult } from "@/lib/pdf/operations";
import { downloadPdfBytes } from "@/lib/pdf/download";

const DEFAULT_OPTIONS: ProtectPdfOptions = {
  userPassword: "",
  ownerPassword: "",
  algorithm: "AES-256",
  allowPrinting: true,
  allowCopying: true,
  allowModifying: false,
  allowAnnotating: false,
  allowFillingForms: true,
};

export function ProtectToolView() {
  const [file, setFile] = useState<File | null>(null);
  const [options, setOptions] = useState<ProtectPdfOptions>(DEFAULT_OPTIONS);
  const [confirmPass, setConfirmPass] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ProtectPdfResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canExecute =
    !!file &&
    !!options.userPassword &&
    options.userPassword.length > 0 &&
    options.userPassword === confirmPass;

  const handleProtect = async () => {
    if (!file || !canExecute) return;
    setIsProcessing(true);
    setError(null);
    try {
      const buffer = await file.arrayBuffer();
      const res = await protectPdf(new Uint8Array(buffer), options);
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to encrypt document.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result || !file) return;
    downloadPdfBytes(result.pdfBytes, `protected-${file.name}`);
  };

  const handleReset = () => {
    setFile(null);
    setOptions(DEFAULT_OPTIONS);
    setConfirmPass("");
    setResult(null);
    setError(null);
  };

  return (
    <ToolLayout
      title="Protect PDF"
      description="Encrypt PDF with AES-256 or RC4 password protection and document permission flags 100% in your browser."
      icon={Lock}
      category="Security"
    >
      <div className="w-full space-y-6">
        <SharedDropzone onFileSelect={(selectedFile) => setFile(selectedFile)} />

        {file && (
          <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-border text-xs text-muted-foreground">
              <span className="font-semibold text-foreground truncate max-w-[280px]">
                {file.name}
              </span>
              <span>{(file.size / 1024).toFixed(1)} KB</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <ProtectPasswordForm
                options={options}
                onChange={setOptions}
                confirmPass={confirmPass}
                onConfirmChange={setConfirmPass}
              />
              <ProtectPermissionsPanel options={options} onChange={setOptions} />
            </div>

            <div className="p-3 rounded-xl bg-muted/40 border border-border/40 text-[11px] text-muted-foreground flex items-center gap-2">
              <ShieldAlert className="size-4 text-primary shrink-0" />
              <span>
                Zero Server Transmission: Encryption happens client-side via Web Crypto AES-256. Keep your password safe; FileMelo cannot recover lost passwords.
              </span>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-xs flex items-center gap-2">
                <AlertCircle className="size-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {result && (
              <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2 font-medium">
                <CheckCircle2 className="size-4 shrink-0" />
                <span>
                  Document successfully encrypted using {result.algorithm} ({Math.round(result.encryptedSize / 1024)} KB). Ready for download.
                </span>
              </div>
            )}

            <ToolActionBar
              actionLabel="Encrypt & Protect"
              isProcessing={isProcessing}
              canExecute={canExecute}
              isDone={!!result}
              resultFileName={file ? `protected-${file.name}` : undefined}
              onExecute={handleProtect}
              onDownload={handleDownload}
              onReset={handleReset}
            />
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
