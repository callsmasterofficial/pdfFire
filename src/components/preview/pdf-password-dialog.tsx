"use client";

import React, { useState } from "react";
import { Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PDFPasswordDialogProps {
  fileName: string;
  errorMessage?: string;
  onSubmit: (password: string) => void;
  onCancel: () => void;
}

export function PDFPasswordDialog({
  fileName,
  errorMessage,
  onSubmit,
  onCancel,
}: PDFPasswordDialogProps) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password) {
      onSubmit(password);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 sm:p-10 max-w-md mx-auto my-8 bg-surface rounded-2xl border border-border shadow-xs text-center">
      <div className="size-12 rounded-full bg-warning/10 border border-warning/30 text-warning flex items-center justify-center mb-4">
        <Lock className="size-6" />
      </div>

      <h3 className="text-lg font-bold text-foreground">Password Protected PDF</h3>
      <p className="text-xs text-muted-foreground mt-1 mb-4">
        <span className="font-semibold text-foreground">{fileName}</span> requires a password to open.
      </p>

      {errorMessage && (
        <div className="w-full mb-4 p-2.5 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs font-medium">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="w-full space-y-4">
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password..."
            autoFocus
            className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-surface-secondary text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/40 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
          <ShieldCheck className="size-3.5 text-success" />
          <span>Decrypted locally in memory — never sent to any server</span>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="outline" type="button" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="default" type="submit" size="sm" disabled={!password.trim()}>
            Unlock & View
          </Button>
        </div>
      </form>
    </div>
  );
}
