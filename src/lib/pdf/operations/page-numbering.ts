import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export type NumberingPosition =
  | "bottom-center"
  | "bottom-right"
  | "bottom-left"
  | "top-center"
  | "top-right"
  | "top-left";

export interface PageNumberingOptions {
  position?: NumberingPosition;
  format?: "page-of-total" | "page-only" | "numbers-only" | "number-only";
  startNumber?: number;
  skipFirstPage?: boolean;
  headerText?: string;
  footerText?: string;
  fontSize?: number;
  margin?: number;
  colorHex?: string;
  outputFileName?: string;
}

export interface PageNumberingResult {
  pdfBytes: Uint8Array;
  pageCount: number;
  fileName: string;
}

function hexToRgb(hex: string) {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16) / 255 || 0.2;
  const g = parseInt(clean.substring(2, 4), 16) / 255 || 0.2;
  const b = parseInt(clean.substring(4, 6), 16) / 255 || 0.2;
  return rgb(r, g, b);
}

function formatLabel(
  style: PageNumberingOptions["format"],
  current: number,
  total: number
): string {
  switch (style) {
    case "page-only":
      return `Page ${current}`;
    case "numbers-only":
      return `${current} / ${total}`;
    case "number-only":
      return `${current}`;
    case "page-of-total":
    default:
      return `Page ${current} of ${total}`;
  }
}

export async function addPageNumbersToPdf(
  fileOrBytes: File | Uint8Array | ArrayBuffer,
  options: PageNumberingOptions = {}
): Promise<PageNumberingResult> {
  const {
    position = "bottom-center",
    format = "page-of-total",
    startNumber = 1,
    skipFirstPage = false,
    headerText = "",
    footerText = "",
    fontSize = 10,
    margin = 36,
    colorHex = "#333333",
    outputFileName = "numbered-document.pdf",
  } = options;

  let bytes: Uint8Array | ArrayBuffer;
  if (fileOrBytes instanceof File) {
    bytes = await fileOrBytes.arrayBuffer();
  } else {
    bytes = fileOrBytes;
  }

  const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const color = hexToRgb(colorHex);
  const totalPages = pdfDoc.getPageCount();

  for (let i = 0; i < totalPages; i++) {
    if (skipFirstPage && i === 0) continue;

    const page = pdfDoc.getPage(i);
    const { width, height } = page.getSize();
    const currentNumber = startNumber + (skipFirstPage ? i - 1 : i);
    const effectiveTotal = skipFirstPage ? totalPages - 1 : totalPages;
    const label = formatLabel(format, currentNumber, effectiveTotal);

    const textWidth = font.widthOfTextAtSize(label, fontSize);
    let x = margin;
    let y = margin;

    if (position.includes("center")) {
      x = (width - textWidth) / 2;
    } else if (position.includes("right")) {
      x = width - margin - textWidth;
    } else {
      x = margin;
    }

    if (position.startsWith("top")) {
      y = height - margin - fontSize;
    } else {
      y = margin;
    }

    page.drawText(label, { x, y, size: fontSize, font, color });

    // Header text support
    if (headerText && !position.startsWith("top")) {
      const hw = font.widthOfTextAtSize(headerText, fontSize);
      page.drawText(headerText, {
        x: (width - hw) / 2,
        y: height - margin - fontSize,
        size: fontSize,
        font,
        color,
      });
    }

    // Footer text support
    if (footerText && !position.startsWith("bottom")) {
      const fw = font.widthOfTextAtSize(footerText, fontSize);
      page.drawText(footerText, {
        x: (width - fw) / 2,
        y: margin,
        size: fontSize,
        font,
        color,
      });
    }
  }

  const pdfBytes = await pdfDoc.save({ useObjectStreams: true });
  return { pdfBytes, pageCount: totalPages, fileName: outputFileName };
}
