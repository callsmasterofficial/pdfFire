"use client";

import React, { useState } from "react";
import { CheckCircle2, AlertTriangle, XCircle, Loader2, RotateCw, Trash2, Download, Move } from "lucide-react";
import { Button } from "@/components/ui/button";

export function WorkspacePreview() {
  const [selectedPage, setSelectedPage] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<"workspace" | "feedback">("workspace");

  const samplePages = [1, 2, 3, 4];

  return (
    <section id="workspace-preview" className="w-full max-w-5xl mx-auto px-4 mb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Document Workspace & Design Tokens Preview
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Test and verify Paper & Terracotta / Charcoal & Ember states across UI components.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={activeTab === "workspace" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("workspace")}
          >
            Workspace States
          </Button>
          <Button
            variant={activeTab === "feedback" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("feedback")}
          >
            Status States
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface p-6 shadow-xs">
        {activeTab === "workspace" ? (
          <div>
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-5 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-foreground">Document:</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-surface-secondary border border-border">
                  quarterly-report.pdf (4 pages)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <RotateCw className="size-3.5 text-primary" />
                  <span>Rotate</span>
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5 text-destructive hover:bg-destructive/10">
                  <Trash2 className="size-3.5" />
                  <span>Delete</span>
                </Button>
                <Button variant="default" size="sm" className="gap-1.5">
                  <Download className="size-3.5" />
                  <span>Export</span>
                </Button>
              </div>
            </div>

            {/* Thumbnail grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              {samplePages.map((pageNum) => {
                const isSelected = selectedPage === pageNum;
                return (
                  <div
                    key={pageNum}
                    onClick={() => setSelectedPage(pageNum)}
                    className={`group relative flex flex-col items-center p-3 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? "border-primary bg-primary/5 ring-2 ring-primary/40 shadow-xs"
                        : "border-border bg-surface-secondary/40 hover:border-primary/40"
                    }`}
                  >
                    <div className="w-full aspect-3/4 rounded border border-border/80 bg-surface flex flex-col justify-between p-2.5 shadow-2xs">
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <span className="font-mono">P.{pageNum}</span>
                        <Move className="size-3 text-muted-foreground opacity-60 group-hover:opacity-100" />
                      </div>
                      <div className="space-y-1.5">
                        <div className="h-1.5 w-3/4 bg-border/80 rounded" />
                        <div className="h-1.5 w-full bg-border/50 rounded" />
                        <div className="h-1.5 w-2/3 bg-border/50 rounded" />
                      </div>
                      <div className="h-1.5 w-1/3 bg-primary/40 rounded" />
                    </div>
                    <span className="mt-2 text-xs font-medium text-foreground">
                      Page {pageNum} {isSelected && "• Active"}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Click a thumbnail to inspect active focus & border token behavior.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3.5 rounded-lg border border-success/30 bg-success/10 text-success text-xs">
              <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold">Success State:</strong> PDF operation finished locally in 142ms. Output blob generated without server transmission.
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-lg border border-warning/30 bg-warning/10 text-warning text-xs">
              <AlertTriangle className="size-4 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold">Warning State:</strong> File size is 45MB. Processing may take a few seconds on low-memory devices.
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-xs">
              <XCircle className="size-4 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold">Error State:</strong> Password-protected file detected. Please unlock with password before editing.
              </div>
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded-lg border border-border bg-surface-secondary text-foreground text-xs">
              <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
              <span><strong>Loading State:</strong> Rendering thumbnails via PDF.js worker...</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
