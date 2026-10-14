import React from "react";
import { Cpu, Sparkles } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t border-border bg-surface-secondary/50 py-10 transition-colors mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col items-center md:items-start gap-1.5 text-center md:text-left">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icon.svg"
              alt="PDFForge Logo"
              width={20}
              height={20}
              className="size-5 rounded-md shadow-xs shrink-0"
            />
            <span className="font-bold">PDFForge</span>
            <span className="text-muted-foreground font-normal text-xs">• Privacy by Architecture</span>
          </div>
          <p className="text-xs text-muted-foreground max-w-md">
            All document operations run completely in your browser via WebAssembly and Web Workers.
            Your confidential files are never uploaded to any remote server or cloud storage.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Cpu className="size-3.5 text-primary" />
            <span>Local In-Memory Engine</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-accent" />
            <span>Open & Transparent</span>
          </span>
          <span>© 2026 PDFForge</span>
        </div>
      </div>
    </footer>
  );
}
