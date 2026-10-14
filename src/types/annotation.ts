export type AnnotationType = "text" | "rectangle" | "circle" | "line" | "drawing";
export type EditorToolType = "select" | AnnotationType;

export interface BaseAnnotation {
  id: string;
  type: AnnotationType;
  pageIndex: number; // 0-indexed
}

export interface TextAnnotation extends BaseAnnotation {
  type: "text";
  x: number; // PDF points
  y: number; // PDF points
  text: string;
  fontSize: number;
  colorHex: string;
}

export interface ShapeAnnotation extends BaseAnnotation {
  type: "rectangle" | "circle" | "line";
  x: number;
  y: number;
  width: number;
  height: number;
  strokeColorHex: string;
  strokeWidth: number;
  fillColorHex?: string;
}

export interface DrawingAnnotation extends BaseAnnotation {
  type: "drawing";
  points: { x: number; y: number }[];
  strokeColorHex: string;
  strokeWidth: number;
}

export type AnnotationItem = TextAnnotation | ShapeAnnotation | DrawingAnnotation;
