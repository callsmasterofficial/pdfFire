import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { AnnotationItem } from "@/types/annotation";

export interface AnnotatePdfResult {
  pdfBytes: Uint8Array;
  pageCount: number;
  fileName: string;
}

function hexToRgb(hex?: string) {
  if (!hex) return undefined;
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16) / 255 || 0;
  const g = parseInt(clean.substring(2, 4), 16) / 255 || 0;
  const b = parseInt(clean.substring(4, 6), 16) / 255 || 0;
  return rgb(r, g, b);
}

export async function applyAnnotationsToPdf(
  fileOrBytes: File | Uint8Array | ArrayBuffer,
  annotations: AnnotationItem[],
  outputFileName = "annotated-document.pdf"
): Promise<AnnotatePdfResult> {
  let bytes: Uint8Array | ArrayBuffer;
  if (fileOrBytes instanceof File) {
    bytes = await fileOrBytes.arrayBuffer();
  } else {
    bytes = fileOrBytes;
  }

  const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const totalPages = pdfDoc.getPageCount();

  for (const ann of annotations) {
    if (ann.pageIndex < 0 || ann.pageIndex >= totalPages) continue;
    const page = pdfDoc.getPage(ann.pageIndex);

    if (ann.type === "text") {
      const color = hexToRgb(ann.colorHex) || rgb(0, 0, 0);
      // ann.y is stored from bottom or converted
      page.drawText(ann.text, {
        x: ann.x,
        y: ann.y,
        size: ann.fontSize,
        font,
        color,
      });
    } else if (ann.type === "rectangle") {
      const stroke = hexToRgb(ann.strokeColorHex) || rgb(0, 0, 0);
      const fill = hexToRgb(ann.fillColorHex);
      page.drawRectangle({
        x: ann.x,
        y: ann.y,
        width: ann.width,
        height: ann.height,
        borderColor: stroke,
        borderWidth: ann.strokeWidth,
        color: fill,
      });
    } else if (ann.type === "circle") {
      const stroke = hexToRgb(ann.strokeColorHex) || rgb(0, 0, 0);
      const fill = hexToRgb(ann.fillColorHex);
      const rx = Math.abs(ann.width / 2);
      const ry = Math.abs(ann.height / 2);
      page.drawEllipse({
        x: ann.x + rx,
        y: ann.y + ry,
        xScale: rx,
        yScale: ry,
        borderColor: stroke,
        borderWidth: ann.strokeWidth,
        color: fill,
      });
    } else if (ann.type === "line") {
      const stroke = hexToRgb(ann.strokeColorHex) || rgb(0, 0, 0);
      page.drawLine({
        start: { x: ann.x, y: ann.y },
        end: { x: ann.x + ann.width, y: ann.y + ann.height },
        thickness: ann.strokeWidth,
        color: stroke,
      });
    } else if (ann.type === "drawing") {
      const stroke = hexToRgb(ann.strokeColorHex) || rgb(0, 0, 0);
      const pts = ann.points;
      for (let i = 0; i < pts.length - 1; i++) {
        page.drawLine({
          start: { x: pts[i].x, y: pts[i].y },
          end: { x: pts[i + 1].x, y: pts[i + 1].y },
          thickness: ann.strokeWidth,
          color: stroke,
        });
      }
    }
  }

  const pdfBytes = await pdfDoc.save({ useObjectStreams: true });
  return { pdfBytes, pageCount: totalPages, fileName: outputFileName };
}
