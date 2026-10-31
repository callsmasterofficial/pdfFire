import { PDFDocument, PDFName } from "pdf-lib";
import { drawRedactionBoxes } from "./redact/draw-boxes";
import { removeTextInRects, RedactionVerificationError } from "./redact/remove-text";
import type { Rect } from "../text/text-item-geometry";

export { RedactionVerificationError };

export interface RedactionArea {
  id: string;
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
  fillColor?: "black" | "white" | "charcoal";
  overlayText?: string;
}

/**
 * `remove-text` deletes the covered characters from the page content streams
 * and verifies the export, so the text cannot be extracted afterwards.
 * `cover-only` draws the boxes without touching the underlying content: the
 * text stays recoverable and must never be described as redacted.
 */
export type RedactionMode = "remove-text" | "cover-only";

export interface RedactionResult {
  pdfBytes: Uint8Array;
  redactedCount: number;
  pagesAffected: number;
  totalPages: number;
  mode: RedactionMode;
  /** Show operators deleted from content streams (0 in `cover-only`). */
  removedTextOperations: number;
  /**
   * True only when the exported bytes were re-parsed and the covered text was
   * confirmed gone. Always false in `cover-only`.
   */
  textRemovalVerified: boolean;
  /**
   * Pages where the two views of the page could not be aligned, so deletion
   * fell back to removing every occurrence of the covered text. Identical text
   * elsewhere on those pages may also have gone.
   */
  contentMatchedPages: number[];
  /**
   * Pages where uncovered text shifted slightly under a box. Nothing leaked;
   * the box just hides a little more than intended.
   */
  shiftedPages: number[];
  /**
   * Pages carrying a font whose widths could not be read, so which characters
   * the box edges take was estimated rather than measured.
   */
  estimatedWidthPages: number[];
}

export interface RedactionOptions {
  sanitizeMetadata?: boolean;
  mode?: RedactionMode;
}

function rectsByPage(redactions: RedactionArea[], totalPages: number): Map<number, Rect[]> {
  const map = new Map<number, Rect[]>();
  for (const area of redactions) {
    if (area.pageNumber < 1 || area.pageNumber > totalPages) continue;
    const list = map.get(area.pageNumber) ?? [];
    list.push({
      x: area.x,
      y: area.y,
      width: Math.max(1, area.width),
      height: Math.max(1, area.height),
    });
    map.set(area.pageNumber, list);
  }
  return map;
}

export async function applyRedactions(
  pdfBytes: Uint8Array,
  redactions: RedactionArea[],
  optionsOrSanitize: RedactionOptions | boolean = true
): Promise<RedactionResult> {
  const options: RedactionOptions =
    typeof optionsOrSanitize === "boolean"
      ? { sanitizeMetadata: optionsOrSanitize }
      : optionsOrSanitize;
  const { sanitizeMetadata = true, mode = "remove-text" } = options;

  const probe = await PDFDocument.load(pdfBytes);
  const totalPages = probe.getPageCount();
  if (totalPages === 0) throw new Error("Document has no pages.");

  // Delete the covered characters before anything is drawn over them, so the
  // filled boxes cannot be mistaken for the removal itself.
  let workingBytes = pdfBytes;
  let removedTextOperations = 0;
  let textRemovalVerified = false;
  let contentMatchedPages: number[] = [];
  let shiftedPages: number[] = [];
  let estimatedWidthPages: number[] = [];

  if (mode === "remove-text") {
    const removal = await removeTextInRects(pdfBytes, rectsByPage(redactions, totalPages));
    workingBytes = removal.pdfBytes;
    removedTextOperations = removal.removedOperations;
    textRemovalVerified = removal.verified;
    contentMatchedPages = removal.contentMatchedPages;
    shiftedPages = removal.shiftedPages;
    estimatedWidthPages = removal.estimatedWidthPages;
  }

  const doc = await PDFDocument.load(workingBytes);
  const { redactedCount, pagesAffected } = await drawRedactionBoxes(doc, redactions, totalPages);

  if (sanitizeMetadata) {
    doc.setTitle("");
    doc.setAuthor("");
    doc.setSubject("");
    doc.setKeywords([]);
    doc.setProducer("FileMelo");
    doc.setCreator("FileMelo");

    // Remove XMP metadata stream from catalog if present
    const catalog = doc.catalog;
    if (catalog.has(PDFName.of("Metadata"))) {
      catalog.delete(PDFName.of("Metadata"));
    }
  }

  const outBytes = await doc.save();
  return {
    pdfBytes: outBytes,
    redactedCount,
    pagesAffected,
    totalPages,
    mode,
    removedTextOperations,
    textRemovalVerified,
    contentMatchedPages,
    shiftedPages,
    estimatedWidthPages,
  };
}
