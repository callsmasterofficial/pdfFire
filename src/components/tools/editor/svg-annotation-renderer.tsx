"use client";

import React from "react";
import { AnnotationItem } from "@/types/annotation";

interface SvgAnnotationItemProps {
  ann: AnnotationItem;
  pageHeight: number;
  isSelected?: boolean;
  onSelect?: (id: string, e: React.PointerEvent) => void;
}

export function SvgAnnotationItem({
  ann,
  pageHeight,
  isSelected = false,
  onSelect,
}: SvgAnnotationItemProps) {
  if (ann.type === "text") {
    const textWidth = Math.max(20, ann.text.length * (ann.fontSize * 0.55));
    const boxY = pageHeight - ann.y - ann.fontSize - 2;

    return (
      <g
        style={{ cursor: "move", pointerEvents: "all" }}
        onPointerDown={(e) => {
          e.stopPropagation();
          onSelect?.(ann.id, e);
        }}
      >
        <rect
          x={ann.x - 4}
          y={boxY}
          width={textWidth + 8}
          height={ann.fontSize + 8}
          fill={isSelected ? "#c85a32" : "transparent"}
          fillOpacity={isSelected ? 0.08 : 0}
          stroke={isSelected ? "#c85a32" : "transparent"}
          strokeWidth={1.5}
          strokeDasharray="4 2"
          rx={3}
        />
        <text
          x={ann.x}
          y={pageHeight - ann.y}
          fill={ann.colorHex}
          fontSize={ann.fontSize}
          fontWeight="bold"
          className="select-none"
        >
          {ann.text}
        </text>
      </g>
    );
  }

  if (ann.type === "rectangle") {
    return (
      <g
        style={{ cursor: "move", pointerEvents: "all" }}
        onPointerDown={(e) => {
          e.stopPropagation();
          onSelect?.(ann.id, e);
        }}
      >
        <rect
          x={ann.x}
          y={pageHeight - ann.y - ann.height}
          width={ann.width}
          height={ann.height}
          stroke={isSelected ? "#c85a32" : ann.strokeColorHex}
          strokeWidth={ann.strokeWidth + (isSelected ? 1 : 0)}
          fill="transparent"
        />
      </g>
    );
  }

  if (ann.type === "circle") {
    const rx = Math.abs(ann.width / 2);
    const ry = Math.abs(ann.height / 2);
    return (
      <g
        style={{ cursor: "move", pointerEvents: "all" }}
        onPointerDown={(e) => {
          e.stopPropagation();
          onSelect?.(ann.id, e);
        }}
      >
        <ellipse
          cx={ann.x + rx}
          cy={pageHeight - (ann.y + ry)}
          rx={rx}
          ry={ry}
          stroke={isSelected ? "#c85a32" : ann.strokeColorHex}
          strokeWidth={ann.strokeWidth + (isSelected ? 1 : 0)}
          fill="transparent"
        />
      </g>
    );
  }

  if (ann.type === "drawing") {
    const d = ann.points
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${pageHeight - p.y}`)
      .join(" ");
    return (
      <path
        d={d}
        stroke={ann.strokeColorHex}
        strokeWidth={ann.strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    );
  }

  return null;
}
