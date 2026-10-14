import React from "react";
import { Shield, Zap, HardDrive } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function HeroSection() {
  return (
    <section className="w-full pt-12 pb-8 sm:pt-16 sm:pb-12 text-center flex flex-col items-center">
      <div className="inline-flex items-center gap-2 mb-4">
        <Badge variant="secondary" className="px-3 py-1 text-xs font-medium border-border/80 text-foreground">
          <span className="size-2 rounded-full bg-primary inline-block mr-1.5 animate-pulse" />
          Paper & Terracotta / Charcoal & Ember Edition
        </Badge>
      </div>

      <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground max-w-3xl leading-tight sm:leading-tight">
        Fast, Private PDF Toolkit.
        <br />
        <span className="text-primary font-bold">100% In Your Browser.</span>
      </h1>

      <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
        Merge, split, extract, rotate, and manage documents with precision. No file uploads, no cloud storage, and zero data leakage.
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-foreground">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-secondary/70 border border-border">
          <Shield className="size-3.5 text-success" />
          <span>Zero Server Uploads</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-secondary/70 border border-border">
          <Zap className="size-3.5 text-accent" />
          <span>Instant Client Execution</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-secondary/70 border border-border">
          <HardDrive className="size-3.5 text-primary" />
          <span>Local Memory Only</span>
        </div>
      </div>
    </section>
  );
}
