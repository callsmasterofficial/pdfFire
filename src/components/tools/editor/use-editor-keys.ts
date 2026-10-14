"use client";

import { useEffect } from "react";
import { AnnotationItem } from "@/types/annotation";

export function moveAnnotation(ann: AnnotationItem, dx: number, dy: number): AnnotationItem {
  if (ann.type === "drawing") {
    return { ...ann, points: ann.points.map((p) => ({ x: p.x + dx, y: p.y + dy })) };
  }
  return { ...ann, x: ann.x + dx, y: ann.y + dy };
}

export function useEditorKeys(
  selectedId: string | null,
  onNudge: (dx: number, dy: number) => void,
  onDelete: (id: string) => void,
  onDeselect: () => void
) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!selectedId) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        onNudge(-5, 0);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        onNudge(5, 0);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        onNudge(0, 5);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        onNudge(0, -5);
      } else if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        onDelete(selectedId);
      } else if (e.key === "Escape") {
        onDeselect();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selectedId, onNudge, onDelete, onDeselect]);
}
