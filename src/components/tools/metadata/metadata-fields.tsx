"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PdfMetadataInfo } from "@/lib/pdf/operations";

interface MetadataFieldsProps {
  metadata: Partial<PdfMetadataInfo>;
  stripAll: boolean;
  onChange: (field: keyof PdfMetadataInfo, value: string) => void;
}

export function MetadataFields({ metadata, stripAll, onChange }: MetadataFieldsProps) {
  if (stripAll) {
    return (
      <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/5 text-destructive text-sm flex items-start gap-3">
        <span className="text-base font-bold">⚠️</span>
        <div>
          <p className="font-semibold">Privacy Sanitization Mode Active</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            All metadata (Title, Author, Subject, Keywords, Creator, and Producer) will be completely wiped from the document dictionary upon export.
          </p>
        </div>
      </div>
    );
  }

  const fields: Array<{ id: keyof PdfMetadataInfo; label: string; placeholder: string }> = [
    { id: "title", label: "Document Title", placeholder: "e.g. Quarterly Financial Report" },
    { id: "author", label: "Author", placeholder: "e.g. Jane Doe" },
    { id: "subject", label: "Subject / Topic", placeholder: "e.g. Q4 Executive Summary" },
    { id: "keywords", label: "Keywords (comma separated)", placeholder: "finance, 2026, report" },
    { id: "creator", label: "Creator Application", placeholder: "e.g. PDFfire Local" },
    { id: "producer", label: "Producer Engine", placeholder: "e.g. PDFfire Browser Client" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {fields.map(({ id, label, placeholder }) => (
        <div key={id} className="space-y-1.5">
          <Label htmlFor={id} className="text-xs font-semibold text-foreground/80">
            {label}
          </Label>
          <Input
            id={id}
            value={(metadata[id] as string) || ""}
            onChange={(e) => onChange(id, e.target.value)}
            placeholder={placeholder}
            className="h-9 text-xs bg-muted/40 font-mono focus:bg-background transition-colors"
          />
        </div>
      ))}
    </div>
  );
}
