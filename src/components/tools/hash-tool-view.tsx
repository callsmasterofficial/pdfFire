"use client";

import React, { useState, useEffect } from "react";
import { Fingerprint, CheckCircle2, XCircle, ShieldCheck } from "lucide-react";
import { ToolLayout } from "./tool-layout";
import { SharedDropzone } from "@/components/file-handling/shared-dropzone";
import { HashRow } from "./hash/hash-result-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { calculateDocumentChecksums, DocumentChecksums } from "@/lib/pdf/operations";

export function HashToolView() {
  const [file, setFile] = useState<File | null>(null);
  const [checksums, setChecksums] = useState<DocumentChecksums | null>(null);
  const [expectedHash, setExpectedHash] = useState("");
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setChecksums(null);
      return;
    }
    let isCancelled = false;
    setIsCalculating(true);
    setError(null);

    calculateDocumentChecksums(file)
      .then((res) => {
        if (!isCancelled) setChecksums(res);
      })
      .catch((err) => {
        if (!isCancelled) setError(err instanceof Error ? err.message : "Failed to compute hashes");
      })
      .finally(() => {
        if (!isCancelled) setIsCalculating(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [file]);

  const cleanExpected = expectedHash.trim().toLowerCase();
  const isMatch = checksums
    ? [checksums.sha256, checksums.sha1, checksums.sha384, checksums.sha512].includes(cleanExpected)
    : false;

  return (
    <ToolLayout
      title="Cryptographic Checksum"
      description="Calculate SHA-256, SHA-1, SHA-384, and SHA-512 digests locally using the Web Crypto API."
      icon={Fingerprint}
      category="Security"
    >
      <div className="w-full space-y-6">
        <SharedDropzone onFileSelect={(selectedFile) => setFile(selectedFile)} />

        {file && (
          <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-6">
            <div className="flex items-center gap-3 border-b border-border/60 pb-4">
              <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Fingerprint className="size-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-foreground">{file.name}</h3>
                <p className="text-xs text-muted-foreground font-mono">
                  {(file.size / 1024).toFixed(1)} KB • {file.size.toLocaleString()} bytes
                </p>
              </div>
            </div>

            {isCalculating ? (
              <div className="py-10 text-center text-xs text-muted-foreground font-mono">
                Calculating cryptographic digests via Web Crypto...
              </div>
            ) : checksums ? (
              <div className="space-y-4">
                <div className="space-y-2.5">
                  <HashRow label="SHA-256 (Standard)" hash={checksums.sha256} />
                  <HashRow label="SHA-1 (Legacy)" hash={checksums.sha1} />
                  <HashRow label="SHA-384" hash={checksums.sha384} />
                  <HashRow label="SHA-512 (High Security)" hash={checksums.sha512} />
                </div>

                <div className="pt-4 border-t border-border/60 space-y-3">
                  <Label htmlFor="expected-hash" className="text-xs font-semibold text-foreground/80">
                    Verify Against Reference Checksum
                  </Label>
                  <Input
                    id="expected-hash"
                    value={expectedHash}
                    onChange={(e) => setExpectedHash(e.target.value)}
                    placeholder="Paste reference SHA-256, SHA-512, or SHA-1 hash to verify authenticity..."
                    className="h-9 text-xs font-mono bg-muted/30"
                  />

                  {cleanExpected.length > 0 && (
                    <div
                      className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs font-medium ${
                        isMatch
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                          : "bg-destructive/10 border-destructive/20 text-destructive"
                      }`}
                    >
                      {isMatch ? (
                        <>
                          <CheckCircle2 className="size-4 shrink-0" />
                          <span>MATCH VERIFIED: Document matches reference hash exactly.</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="size-4 shrink-0" />
                          <span>CHECKSUM MISMATCH: Document does not match expected hash.</span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-muted/40 border border-border/40 text-[11px] text-muted-foreground flex items-center gap-2">
                  <ShieldCheck className="size-4 text-primary shrink-0" />
                  <span>100% computed inside your browser using the native Web Crypto API. No data is sent over the network.</span>
                </div>
              </div>
            ) : null}

            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
