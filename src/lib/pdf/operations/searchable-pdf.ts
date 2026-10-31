import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { OcrDocumentResult } from "../../ocr/ocr-types";
import { FontTextSanitizer } from "../text/font-safe-text";

export interface SearchablePdfResult {
  pdfBytes: Uint8Array;
  fileName: string;
}

export async function createSearchablePdf(
  originalPdfBytes: Uint8Array | ArrayBuffer,
  ocrResult: OcrDocumentResult,
  outputFileName = "searchable-document.pdf"
): Promise<SearchablePdfResult> {
  const pdfDoc = await PDFDocument.load(originalPdfBytes, { ignoreEncryption: true });
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  // Blanking accented characters would make the OCR layer unsearchable for the
  // very words a user is most likely to look for.
  const sanitizer = new FontTextSanitizer([font]);

  const pageCount = pdfDoc.getPageCount();

  for (const pageRes of ocrResult.pages) {
    if (pageRes.pageNumber > pageCount) continue;
    const page = pdfDoc.getPage(pageRes.pageNumber - 1);
    const { height } = page.getSize();

    // Draw words or lines as invisible text layer (opacity: 0.0)
    const lines = pageRes.text.split(/\r?\n/).filter(Boolean);
    const fontSize = 10;
    const lineHeight = 14;
    let yPos = height - 40;

    for (const line of lines) {
      if (yPos < 20) break;
      try {
        const cleanLine = sanitizer.sanitize(line).trim();
        if (cleanLine) {
          page.drawText(cleanLine, {
            x: 40,
            y: yPos,
            size: fontSize,
            font,
            color: rgb(0, 0, 0),
            opacity: 0.0, // Invisible searchable overlay
          });
        }
      } catch {
        // Ignore font encoding issues for special symbols
      }
      yPos -= lineHeight;
    }
  }

  const pdfBytes = await pdfDoc.save({ useObjectStreams: true });
  return {
    pdfBytes,
    fileName: outputFileName,
  };
}
