export type PreviewErrorType =
  | "corrupted"
  | "password"
  | "unsupported"
  | "oversized"
  | "render"
  | "generic";

export interface PDFPreviewError {
  type: PreviewErrorType;
  message: string;
  details?: string;
}

export interface ValidationOptions {
  maxSizeBytes?: number;
  allowedTypes?: string[];
  allowedExtensions?: string[];
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  warning?: string;
  file?: File;
}

export interface PDFDocumentMeta {
  name: string;
  size: number;
  pageCount: number;
  title?: string;
  author?: string;
  creator?: string;
  modificationDate?: string;
  version?: string;
  fingerprint?: string | null;
}

export interface PDFPageState {
  pageNumber: number;
  width: number;
  height: number;
  aspectRatio: number;
}

export interface PDFThumbnail {
  pageNumber: number;
  dataUrl: string;
  width: number;
  height: number;
}
