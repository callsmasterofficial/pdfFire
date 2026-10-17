import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export interface TextToPdfOptions {
  title?: string;
  fontSize?: number;
  lineHeightMultiplier?: number;
  margin?: number;
  outputFileName?: string;
}

export interface TextToPdfResult {
  pdfBytes: Uint8Array;
  pageCount: number;
  fileName: string;
}

export async function convertTextToPdf(
  rawText: string,
  options: TextToPdfOptions = {},
): Promise<TextToPdfResult> {
  const {
    title = "Untitled Document",
    fontSize = 11,
    lineHeightMultiplier = 1.4,
    margin = 50,
    outputFileName = "converted-document.pdf",
  } = options;

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 595.28; // Standard A4 width in pt
  const pageHeight = 841.89; // Standard A4 height in pt
  const contentWidth = pageWidth - margin * 2;
  const lineHeight = fontSize * lineHeightMultiplier;

  // Word wrapping helper
  const wrapParagraph = (text: string): string[] => {
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let currentLine = "";

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = font.widthOfTextAtSize(testLine, fontSize);
      if (testWidth <= contentWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
  };

  const paragraphs = rawText.split(/\r?\n/);
  const allLines: string[] = [];

  for (const para of paragraphs) {
    if (!para.trim()) {
      allLines.push(""); // empty line for paragraph separation
    } else {
      allLines.push(...wrapParagraph(para));
    }
  }

  // Header Title
  let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
  let currentY = pageHeight - margin;

  if (title) {
    currentPage.drawText(title, {
      x: margin,
      y: currentY - 14,
      size: 16,
      font: boldFont,
      color: rgb(0.12, 0.12, 0.14),
    });
    currentY -= 36;
  }

  for (const line of allLines) {
    if (currentY - lineHeight < margin) {
      currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
      currentY = pageHeight - margin;
    }

    if (line) {
      currentPage.drawText(line, {
        x: margin,
        y: currentY,
        size: fontSize,
        font,
        color: rgb(0.2, 0.2, 0.2),
      });
    }
    currentY -= lineHeight;
  }

  pdfDoc.setTitle(title);
  pdfDoc.setCreator("PDFfire Client");
  pdfDoc.setModificationDate(new Date());

  const pdfBytes = await pdfDoc.save({ useObjectStreams: true });

  return {
    pdfBytes,
    pageCount: pdfDoc.getPageCount(),
    fileName: outputFileName,
  };
}
