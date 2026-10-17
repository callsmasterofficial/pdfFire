import React from "react";
import { Shield, Zap, HardDrive } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function HeroSection() {
  return (
    <section className="w-full pt-12 pb-8 sm:pt-16 sm:pb-12 text-center flex flex-col items-center">
      <div className="inline-flex items-center gap-2 mb-4">
        <Badge variant="secondary" className="px-3 py-1 text-xs font-medium border-border/80 text-foreground">
          <span className="size-2 rounded-full bg-primary inline-block mr-1.5 animate-pulse" />
          PDFfire • Privacy-First Client Toolkit
        </Badge>
      </div>

      <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-foreground max-w-3xl leading-[1.15] sm:leading-[1.12]">
        PDF tools that{" "}
        <span className="text-primary">just work.</span>
      </h1>

      <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
        Merge, split, convert, edit, and protect your PDFs with a simple, privacy-focused toolkit.
        Everything executes strictly on your device with zero server uploads.
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-foreground">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-secondary/70 border border-border">
          <Shield className="size-3.5 text-success" />
          <span>Zero Server Uploads</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-secondary/70 border border-border">
          <Zap className="size-3.5 text-accent" />
          <span>Instant Local Execution</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-secondary/70 border border-border">
          <HardDrive className="size-3.5 text-primary" />
          <span>100% In-Memory Privacy</span>
        </div>
      </div>
    </section>
  );
}
