"use client";

import React, { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HashRowProps {
  label: string;
  hash: string;
}

export function HashRow({ label, hash }: HashRowProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50 gap-2">
      <div className="space-y-0.5 overflow-hidden">
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <p className="font-mono text-xs break-all text-foreground/90 select-all">
          {hash}
        </p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleCopy}
        className="h-8 shrink-0 text-xs gap-1.5 self-end sm:self-center"
      >
        {copied ? (
          <>
            <Check className="size-3.5 text-emerald-500" />
            <span className="text-emerald-500">Copied</span>
          </>
        ) : (
          <>
            <Copy className="size-3.5 text-muted-foreground" />
            <span>Copy</span>
          </>
        )}
      </Button>
    </div>
  );
}
