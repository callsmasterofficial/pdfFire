/**
 * Draws the redaction boxes and their optional labels.
 *
 * Separate from the deletion step on purpose: the boxes are only the visible
 * marker, and keeping them apart makes it harder to mistake drawing one for
 * removing what is underneath.
 */
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import type { RedactionArea } from "../redact";

function resolveColor(fill: RedactionArea["fillColor"]) {
  if (fill === "white") return rgb(1, 1, 1);
  if (fill === "charcoal") return rgb(0.12, 0.12, 0.12);
  return rgb(0, 0, 0); // default black
}

export async function drawRedactionBoxes(
  doc: PDFDocument,
  redactions: RedactionArea[],
  totalPages: number
): Promise<{ redactedCount: number; pagesAffected: number }> {
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  const affectedPagesSet = new Set<number>();
  let redactedCount = 0;

  for (const r of redactions) {
    if (r.pageNumber < 1 || r.pageNumber > totalPages) continue;
    const page = doc.getPage(r.pageNumber - 1);
    affectedPagesSet.add(r.pageNumber);
    redactedCount++;

    page.drawRectangle({
      x: r.x,
      y: r.y,
      width: Math.max(1, r.width),
      height: Math.max(1, r.height),
      color: resolveColor(r.fillColor),
    });

    if (r.overlayText && r.width >= 40 && r.height >= 10) {
      const fontSize = Math.min(10, Math.max(6, r.height * 0.55));
      const textWidth = font.widthOfTextAtSize(r.overlayText, fontSize);
      if (textWidth <= r.width) {
        page.drawText(r.overlayText, {
          x: r.x + (r.width - textWidth) / 2,
          y: r.y + (r.height - fontSize) / 2,
          size: fontSize,
          font,
          color: r.fillColor === "white" ? rgb(0, 0, 0) : rgb(0.9, 0.9, 0.9),
        });
      }
    }
  }

  return { redactedCount, pagesAffected: affectedPagesSet.size };
}
