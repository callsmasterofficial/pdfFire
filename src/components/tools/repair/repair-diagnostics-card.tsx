"use client";

import React, { useState } from "react";
import { RepairDiagnostics } from "@/lib/pdf/operations/repair";
import { CheckCircle2, AlertTriangle, Terminal, ChevronDown, ChevronUp, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RepairDiagnosticsCardProps {
  diagnostics: RepairDiagnostics;
}

export function RepairDiagnosticsCard({ diagnostics }: RepairDiagnosticsCardProps) {
  const [showLogs, setShowLogs] = useState(false);

  const origKb = (diagnostics.originalSizeBytes / 1024).toFixed(1);
  const repKb = (diagnostics.repairedSizeBytes / 1024).toFixed(1);
  const recovered = diagnostics.recoverySucceeded;

  return (
    <div className="rounded-xl border border-border bg-surface-elevated/40 p-5 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-border/80">
        <div className="flex items-center gap-2">
          <FileCheck className={`size-5 ${recovered ? "text-emerald-500" : "text-amber-500"}`} />
          <h3 className="text-sm font-semibold text-foreground">Diagnostic Repair Report</h3>
        </div>
        <span
          className={`text-xs font-mono px-2.5 py-0.5 rounded-full font-medium ${
            recovered
              ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
              : "text-amber-700 dark:text-amber-400 bg-amber-500/10"
          }`}
        >
          {recovered ? "Pages Recovered" : "No Content Recovered"}
        </span>
      </div>

      {/* Health Checklist Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="flex items-center justify-between p-3 rounded-lg bg-background border border-border/60">
          <span className="text-muted-foreground">Header Signature (%PDF-)</span>
          {diagnostics.headerRepaired ? (
            <span className="flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
              <AlertTriangle className="size-3.5" /> Repaired & Stripped
            </span>
          ) : (
            <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-3.5" /> Valid
            </span>
          )}
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg bg-background border border-border/60">
          <span className="text-muted-foreground">Trailer Terminator (%%EOF)</span>
          {diagnostics.eofRepaired ? (
            <span className="flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
              <AlertTriangle className="size-3.5" /> Rebuilt & Appended
            </span>
          ) : (
            <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-3.5" /> Valid
            </span>
          )}
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg bg-background border border-border/60">
          <span className="text-muted-foreground">Cross-Reference (xref)</span>
          {diagnostics.xrefRebuilt ? (
            <span className="flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
              <AlertTriangle className="size-3.5" /> Rebuilt
            </span>
          ) : (
            <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-3.5" /> Valid
            </span>
          )}
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg bg-background border border-border/60">
          <span className="text-muted-foreground">Recovered Pages</span>
          <span
            className={`font-semibold font-mono ${
              recovered ? "text-foreground" : "text-amber-600 dark:text-amber-400"
            }`}
          >
            {diagnostics.pagesRecovered} page{diagnostics.pagesRecovered === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      {!recovered && (
        <p className="flex items-start gap-2 p-3 rounded-lg border border-amber-500/30 bg-amber-500/5 text-xs text-amber-700 dark:text-amber-400">
          <AlertTriangle className="size-3.5 mt-0.5 shrink-0" aria-hidden="true" />
          <span>
            No page content could be salvaged from this file. The download is an empty placeholder,
            not your recovered document — keep the original.
          </span>
        </p>
      )}

      {/* Byte Metrics */}
      <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-background border border-border/60 text-xs">
        <span className="text-muted-foreground">Payload Size:</span>
        <span className="font-mono text-foreground">
          {origKb} KB <span className="text-muted-foreground">→</span> {repKb} KB
        </span>
      </div>

      {/* Collapsible Diagnostic Logs */}
      <div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowLogs(!showLogs)}
          className="gap-1.5 text-xs text-muted-foreground hover:text-foreground h-7 px-2"
        >
          <Terminal className="size-3.5" />
          <span>{showLogs ? "Hide Technical Log" : "View Technical Repair Log"}</span>
          {showLogs ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
        </Button>

        {showLogs && (
          <div className="mt-2 p-3 rounded-lg bg-background border border-border font-mono text-[11px] leading-relaxed text-muted-foreground max-h-40 overflow-y-auto space-y-1">
            {diagnostics.diagnosticLogs.map((log, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-primary font-bold">›</span>
                <span>{log}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
