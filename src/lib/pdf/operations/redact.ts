import { PDFDocument, rgb, StandardFonts, PDFName } from "pdf-lib";

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

export interface RedactionResult {
  pdfBytes: Uint8Array;
  redactedCount: number;
  pagesAffected: number;
  totalPages: number;
}

function resolveColor(fill: RedactionArea["fillColor"]) {
  if (fill === "white") return rgb(1, 1, 1);
  if (fill === "charcoal") return rgb(0.12, 0.12, 0.12);
  return rgb(0, 0, 0); // default black
}

export async function applyRedactions(
  pdfBytes: Uint8Array,
  redactions: RedactionArea[],
  sanitizeMetadata = true
): Promise<RedactionResult> {
  const doc = await PDFDocument.load(pdfBytes);
  const totalPages = doc.getPageCount();
  if (totalPages === 0) throw new Error("Document has no pages.");

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
    doc.setProducer("PDFfire");
    doc.setCreator("PDFfire");

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
  };
}
