import { PDFDocument, rgb, StandardFonts, PDFName } from "pdf-lib";
import { removeTextInRects, RedactionVerificationError } from "./redact/remove-text";
import type { Rect } from "./redact/text-items";

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
}

export interface RedactionOptions {
  sanitizeMetadata?: boolean;
  mode?: RedactionMode;
}

function resolveColor(fill: RedactionArea["fillColor"]) {
  if (fill === "white") return rgb(1, 1, 1);
  if (fill === "charcoal") return rgb(0.12, 0.12, 0.12);
  return rgb(0, 0, 0); // default black
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

  if (mode === "remove-text") {
    const removal = await removeTextInRects(pdfBytes, rectsByPage(redactions, totalPages));
    workingBytes = removal.pdfBytes;
    removedTextOperations = removal.removedOperations;
    textRemovalVerified = removal.verified;
  }

  const doc = await PDFDocument.load(workingBytes);
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  const affectedPagesSet = new Set<number>();
  let redactedCount = 0;

  for (const r of redactions) {
    if (r.pageNumber < 1 || r.pageNumber > totalPages) continue;
    const page = doc.getPage(r.pageNumber - 1);
    affectedPagesSet.add(r.pageNumber);
    redactedCount++;

    const fillRgb = resolveColor(r.fillColor);
    page.drawRectangle({
      x: r.x,
      y: r.y,
      width: Math.max(1, r.width),
      height: Math.max(1, r.height),
      color: fillRgb,
    });

    if (r.overlayText && r.width >= 40 && r.height >= 10) {
      const fontSize = Math.min(10, Math.max(6, r.height * 0.55));
      const textWidth = font.widthOfTextAtSize(r.overlayText, fontSize);
      if (textWidth <= r.width) {
        const textX = r.x + (r.width - textWidth) / 2;
        const textY = r.y + (r.height - fontSize) / 2;
        const textColor = r.fillColor === "white" ? rgb(0, 0, 0) : rgb(0.9, 0.9, 0.9);
        page.drawText(r.overlayText, {
          x: textX,
          y: textY,
          size: fontSize,
          font,
          color: textColor,
        });
      }
    }
  }

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
    pagesAffected: affectedPagesSet.size,
    totalPages,
    mode,
    removedTextOperations,
    textRemovalVerified,
  };
}
