"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { AnnotationItem } from "@/types/annotation";
import { EditorSettings } from "./editor-toolbar";
import { SvgAnnotationItem } from "./svg-annotation-renderer";
import { TextAnnotationModal } from "./text-annotation-modal";
import { AnnotationMoveControls } from "./annotation-move-controls";
import { useEditorKeys, moveAnnotation } from "./use-editor-keys";
import { renderPdfPageToCanvas } from "@/lib/pdf/renderer";
import type { PDFDocumentProxy } from "pdfjs-dist";

interface EditorCanvasStageProps {
  pdfDoc: PDFDocumentProxy;
  pageIndex: number;
  settings: EditorSettings;
  annotations: AnnotationItem[];
  onAddAnnotation: (ann: AnnotationItem) => void;
  onUpdateAnnotation: (ann: AnnotationItem) => void;
  onDeleteAnnotation: (id: string) => void;
}

let idCounter = 0;
function createAnnotationId(prefix: string) {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

export function EditorCanvasStage({
  pdfDoc,
  pageIndex,
  settings,
  annotations,
  onAddAnnotation,
  onUpdateAnnotation,
  onDeleteAnnotation,
}: EditorCanvasStageProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [pageSize, setPageSize] = useState({ width: 612, height: 792 });
  const [currentDraft, setCurrentDraft] = useState<AnnotationItem | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [isTextModalOpen, setIsTextModalOpen] = useState(false);
  const [pendingTextCoords, setPendingTextCoords] = useState<{ x: number; y: number } | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);
  const [isDraggingSelected, setIsDraggingSelected] = useState(false);

  useEffect(() => {
    let cancelFn: (() => void) | undefined;
    if (canvasRef.current) {
      pdfDoc.getPage(pageIndex + 1).then((p) => {
        const vp = p.getViewport({ scale: 1.0 });
        setPageSize({ width: vp.width, height: vp.height });
        cancelFn = renderPdfPageToCanvas(p, canvasRef.current!, { scale: 1.0 }).cancel;
      });
    }
    return () => cancelFn?.();
  }, [pdfDoc, pageIndex]);

  const toPdfCoords = useCallback((clientX: number, clientY: number) => {
    const r = containerRef.current?.getBoundingClientRect();
    if (!r) return { x: 0, y: 0 };
    return {
      x: Math.max(0, Math.min(r.width, clientX - r.left)) * (pageSize.width / r.width),
      y: (r.height - Math.max(0, Math.min(r.height, clientY - r.top))) * (pageSize.height / r.height),
    };
  }, [pageSize]);

  const handleNudge = useCallback((dx: number, dy: number) => {
    const ann = annotations.find((a) => a.id === selectedId);
    if (ann) onUpdateAnnotation(moveAnnotation(ann, dx, dy));
  }, [selectedId, annotations, onUpdateAnnotation]);

  useEditorKeys(selectedId, handleNudge, (id) => { onDeleteAnnotation(id); setSelectedId(null); }, () => setSelectedId(null));

  const handleSelect = useCallback((id: string, e: React.PointerEvent) => {
    setSelectedId(id);
    const ann = annotations.find((a) => a.id === id);
    if (!ann) return;
    const pt = toPdfCoords(e.clientX, e.clientY);
    const orig = ann.type === "drawing" ? ann.points[0] || { x: 0, y: 0 } : { x: ann.x, y: ann.y };
    setDragOffset({ x: pt.x - orig.x, y: pt.y - orig.y });
    setIsDraggingSelected(true);
  }, [annotations, toPdfCoords]);

  const handlePointerDown = (e: React.PointerEvent) => {
    const pt = toPdfCoords(e.clientX, e.clientY);
    if (settings.activeTool === "select") { setSelectedId(null); return; }
    setDragStart(pt);
    if (settings.activeTool === "text") {
      setPendingTextCoords(pt); setIsTextModalOpen(true); setDragStart(null);
    } else if (settings.activeTool === "drawing") {
      setCurrentDraft({ id: createAnnotationId("draft"), type: "drawing", pageIndex, points: [pt], strokeColorHex: settings.colorHex, strokeWidth: settings.strokeWidth || 3 });
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const pt = toPdfCoords(e.clientX, e.clientY);
    if (isDraggingSelected && selectedId && dragOffset) {
      const ann = annotations.find((a) => a.id === selectedId);
      if (!ann) return;
      const orig = ann.type === "drawing" ? ann.points[0] || { x: 0, y: 0 } : { x: ann.x, y: ann.y };
      onUpdateAnnotation(moveAnnotation(ann, Math.round(pt.x - dragOffset.x) - orig.x, Math.round(pt.y - dragOffset.y) - orig.y));
      return;
    }
    if (!dragStart) return;
    if (settings.activeTool === "drawing" && currentDraft?.type === "drawing") {
      setCurrentDraft({ ...currentDraft, points: [...currentDraft.points, pt] });
    } else if (settings.activeTool === "rectangle" || settings.activeTool === "circle") {
      const x = Math.min(dragStart.x, pt.x); const y = Math.min(dragStart.y, pt.y);
      setCurrentDraft({
        id: settings.activeTool === "circle" ? "draft-circle" : "draft-rect",
        type: settings.activeTool === "circle" ? "circle" : "rectangle",
        pageIndex, x, y, width: Math.abs(pt.x - dragStart.x), height: Math.abs(pt.y - dragStart.y),
        strokeColorHex: settings.colorHex, strokeWidth: settings.strokeWidth || 2,
      });
    }
  };

  const handlePointerUp = () => {
    if (isDraggingSelected) { setIsDraggingSelected(false); setDragOffset(null); return; }
    if (currentDraft) {
      const isShape = currentDraft.type === "rectangle" || currentDraft.type === "circle";
      if (isShape && currentDraft.width > 5) onAddAnnotation({ ...currentDraft, id: createAnnotationId("ann") });
      else if (currentDraft.type === "drawing" && currentDraft.points.length > 1) onAddAnnotation(currentDraft);
    }
    setCurrentDraft(null); setDragStart(null);
  };

  const pageAnnotations = annotations.filter((a) => a.pageIndex === pageIndex);
  const selectedAnnotation = annotations.find((a) => a.id === selectedId);

  return (
    <div className="flex flex-col gap-3 items-center">
      {selectedAnnotation && (
        <AnnotationMoveControls
          selectedAnnotation={selectedAnnotation}
          onMove={handleNudge}
          onDelete={(id) => { onDeleteAnnotation(id); setSelectedId(null); }}
          onDeselect={() => setSelectedId(null)}
        />
      )}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="relative mx-auto rounded-lg border border-border shadow-md overflow-hidden bg-white select-none cursor-crosshair touch-none"
        style={{ width: pageSize.width, height: pageSize.height }}
      >
        <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />
        <svg className="absolute inset-0 w-full h-full">
          {pageAnnotations.map((ann) => (
            <SvgAnnotationItem key={ann.id} ann={ann} pageHeight={pageSize.height} isSelected={ann.id === selectedId} onSelect={handleSelect} />
          ))}
          {currentDraft && <SvgAnnotationItem ann={currentDraft} pageHeight={pageSize.height} />}
        </svg>
      </div>

      <TextAnnotationModal
        isOpen={isTextModalOpen}
        initialColor={settings.colorHex}
        initialFontSize={settings.fontSize}
        onConfirm={(text, fontSize, colorHex) => {
          if (pendingTextCoords) onAddAnnotation({ id: createAnnotationId("ann"), type: "text", pageIndex, x: pendingTextCoords.x, y: pendingTextCoords.y, text, fontSize, colorHex });
          setIsTextModalOpen(false); setPendingTextCoords(null);
        }}
        onClose={() => { setIsTextModalOpen(false); setPendingTextCoords(null); }}
      />
    </div>
  );
}
