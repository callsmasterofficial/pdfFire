"use client";

import React from "react";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Sidebar,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface PDFPreviewToolbarProps {
  currentPage: number;
  totalPages: number;
  scale: number;
  sidebarOpen: boolean;
  onPageChange: (page: number) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitWidth: () => void;
  onRotate: () => void;
  onToggleSidebar: () => void;
  onClose: () => void;
}

export function PDFPreviewToolbar({
  currentPage,
  totalPages,
  scale,
  sidebarOpen,
  onPageChange,
  onZoomIn,
  onZoomOut,
  onFitWidth,
  onRotate,
  onToggleSidebar,
  onClose,
}: PDFPreviewToolbarProps) {
  const zoomPercent = Math.round(scale * 100);

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 sm:px-4 bg-surface border-b border-border text-foreground">
      {/* Left section: Sidebar toggle & Page Navigation */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <Button
          variant={sidebarOpen ? "default" : "outline"}
          size="sm"
          onClick={onToggleSidebar}
          title="Toggle Thumbnail Sidebar"
          className="h-8 px-2.5"
        >
          <Sidebar className="size-4" />
          <span className="hidden sm:inline text-xs ml-1.5">Thumbnails</span>
        </Button>

        <div className="h-4 w-px bg-border mx-1 hidden sm:block" />

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            title="Previous Page"
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="size-4" />
          </Button>

          <span className="text-xs font-mono font-medium px-2">
            {currentPage} / {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            title="Next Page"
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {/* Middle/Right: Zoom & Rotation Controls */}
      <div className="flex items-center gap-1 sm:gap-1.5">
        <Button
          variant="outline"
          size="sm"
          onClick={onZoomOut}
          disabled={scale <= 0.4}
          title="Zoom Out"
          className="h-8 w-8 p-0"
        >
          <ZoomOut className="size-4" />
        </Button>

        <span className="text-xs font-mono w-12 text-center select-none text-muted-foreground">
          {zoomPercent}%
        </span>

        <Button
          variant="outline"
          size="sm"
          onClick={onZoomIn}
          disabled={scale >= 3.0}
          title="Zoom In"
          className="h-8 w-8 p-0"
        >
          <ZoomIn className="size-4" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onFitWidth}
          title="Fit Width"
          className="h-8 w-8 p-0"
        >
          <Maximize2 className="size-3.5" />
        </Button>

        <div className="h-4 w-px bg-border mx-1" />

        <Button
          variant="outline"
          size="sm"
          onClick={onRotate}
          title="Rotate 90° Clockwise"
          className="h-8 w-8 p-0"
        >
          <RotateCw className="size-4 text-primary" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          title="Close Document"
          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
        >
          <X className="size-4" />
        </Button>
      </div>
    </div>
  );
}
