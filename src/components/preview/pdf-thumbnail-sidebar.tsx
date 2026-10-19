"use client";

import React, { useEffect, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { generateThumbnail } from "@/lib/pdf/renderer";
import { Loader2 } from "lucide-react";

interface PDFThumbnailSidebarProps {
  pdfDoc: PDFDocumentProxy;
  currentPage: number;
  onSelectPage: (page: number) => void;
}

export function PDFThumbnailSidebar({
  pdfDoc,
  currentPage,
  onSelectPage,
}: PDFThumbnailSidebarProps) {
  const [thumbnails, setThumbnails] = useState<Record<number, string>>({});
  const totalPages = pdfDoc.numPages;

  useEffect(() => {
    let isCancelled = false;
    const controller = new AbortController();

    const loadThumbnails = async () => {
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        if (isCancelled) break;

        try {
          const page = await pdfDoc.getPage(pageNum);
          if (isCancelled) break;
          const url = await generateThumbnail(page, 130, controller.signal);
          if (isCancelled) break;
          setThumbnails((prev) => (prev[pageNum] ? prev : { ...prev, [pageNum]: url }));
        } catch {
          // If a page thumbnail fails, keep rendering remaining pages
        }
      }
    };

    loadThumbnails();

    return () => {
      isCancelled = true;
      controller.abort();
    };
  }, [pdfDoc, totalPages]);

  return (
    <aside
      className="w-44 sm:w-52 border-r border-border bg-surface-secondary/30 overflow-y-auto p-3 flex flex-col gap-3 shrink-0 max-h-[75vh]"
      aria-label="Document Thumbnails"
    >
      <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1">
        Pages ({totalPages})
      </div>

      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
        const isCurrent = pageNum === currentPage;
        const thumbUrl = thumbnails[pageNum];

        return (
          <button
            key={pageNum}
            type="button"
            onClick={() => onSelectPage(pageNum)}
            className={`group relative flex flex-col items-center p-2 rounded-lg border transition-all text-left ${
              isCurrent
                ? "border-primary bg-primary/10 ring-2 ring-primary/40 shadow-xs"
                : "border-border bg-surface hover:border-primary/40 hover:bg-surface-secondary/70"
            }`}
          >
            <div className="w-full aspect-3/4 rounded bg-surface border border-border/70 flex items-center justify-center overflow-hidden shadow-2xs">
              {thumbUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={thumbUrl}
                  alt={`Page ${pageNum}`}
                  className="w-full h-full object-contain"
                  loading="lazy"
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-1.5 text-muted-foreground">
                  <Loader2 className="size-4 animate-spin text-primary" />
                  <span className="text-[10px] font-mono">P.{pageNum}</span>
                </div>
              )}
            </div>

            <div className="mt-1.5 flex items-center justify-between w-full px-1 text-xs">
              <span
                className={`font-mono text-[11px] ${
                  isCurrent ? "font-bold text-primary" : "text-muted-foreground"
                }`}
              >
                Page {pageNum}
              </span>
              {isCurrent && (
                <span className="size-1.5 rounded-full bg-primary" />
              )}
            </div>
          </button>
        );
      })}
    </aside>
  );
}
