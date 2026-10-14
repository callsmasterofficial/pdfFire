"use client";

import React, { useState, useEffect } from "react";
import { KeyRound, Eye, EyeOff, ShieldCheck, CheckCircle2, AlertCircle } from "lucide-react";
import { ToolLayout } from "./tool-layout";
import { ToolActionBar } from "./tool-action-bar";
import { SharedDropzone } from "@/components/file-handling/shared-dropzone";
import { SecurityStatusCard } from "./security/security-status-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  checkPdfEncryption,
  unlockPdfWithPassword,
  SecurityInspectionResult,
  UnlockPdfResult,
} from "@/lib/pdf/operations";
import { downloadPdfBytes } from "@/lib/pdf/download";

export function UnlockToolView() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<SecurityInspectionResult | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<UnlockPdfResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setStatus(null);
      setPassword("");
      setResult(null);
      return;
    }
    let isCancelled = false;
    checkPdfEncryption(file).then((res) => {
      if (!isCancelled) setStatus(res);
    });
    return () => {
      isCancelled = true;
    };
  }, [file]);

  const handleUnlock = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);
    try {
      const res = await unlockPdfWithPassword(file, password, `unlocked-${file.name}`);
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Incorrect password or unlock failed.");
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
    setPassword("");
    setStatus(null);
  };

  return (
    <ToolLayout
      title="Unlock PDF"
      description="Remove password protection from encrypted documents 100% inside your browser."
      icon={KeyRound}
      category="Security"
    >
      <div className="w-full space-y-6">
        <SharedDropzone onFileSelect={(selectedFile) => setFile(selectedFile)} />

        {file && (
          <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-6">
            <SecurityStatusCard status={status} fileName={file.name} />

            <div className="space-y-2">
              <Label htmlFor="pdf-password" className="text-xs font-semibold text-foreground/80">
                Document Password
              </Label>
              <div className="relative">
                <Input
                  id="pdf-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter document password..."
                  className="h-9 pr-10 text-xs font-mono bg-muted/20"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-1 top-1 size-7 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                </Button>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-muted/40 border border-border/40 text-[11px] text-muted-foreground flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary shrink-0" />
              <span>Zero server transmission: Passwords and documents are evaluated strictly inside local memory.</span>
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
                <span>Document successfully decrypted and unlocked ({result.pageCount} pages). Ready for download.</span>
              </div>
            )}

            <ToolActionBar
              actionLabel="Unlock PDF"
              isProcessing={isProcessing}
              canExecute={!!file}
              isDone={!!result}
              resultFileName={result?.fileName}
              onExecute={handleUnlock}
              onDownload={handleDownload}
              onReset={handleReset}
            />
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
