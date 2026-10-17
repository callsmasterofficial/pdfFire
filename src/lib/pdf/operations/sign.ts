import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export interface SignaturePlacement {
  /** In PDF points (72 points = 1 inch) from bottom-left origin */
  x: number;
  y: number;
  width: number;
  height: number;
  pageNumber: number; // 1-indexed
}

export interface SignPdfOptions {
  /** Base64 PNG data URL */
  signatureImageBase64: string;
  placements: SignaturePlacement[];
  signerName?: string;
  signDate?: string;
  outputFileName?: string;
}

export interface SignPdfResult {
  pdfBytes: Uint8Array;
  fileName: string;
  stampedSignaturesCount: number;
}

/**
 * Converts a base64 data URL to an ArrayBuffer/Uint8Array
 */
function base64ToUint8Array(dataUrl: string): Uint8Array {
  const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Signs a PDF document by embedding and placing transparent signature stamps.
 */
export async function signPdf(
  file: File | ArrayBuffer | Uint8Array,
  options: SignPdfOptions
): Promise<SignPdfResult> {
  const buffer = file instanceof File ? await file.arrayBuffer() : file;
  const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
  const totalPages = pdfDoc.getPageCount();

  if (options.placements.length === 0) {
    throw new Error("At least one signature placement must be specified.");
  }

  // Convert base64 image and embed as PNG
  const imageBytes = base64ToUint8Array(options.signatureImageBase64);
  const signatureImage = await pdfDoc.embedPng(imageBytes);

  let font;
  if (options.signerName || options.signDate) {
    font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  }

  let stampedCount = 0;

  for (const placement of options.placements) {
    if (placement.pageNumber < 1 || placement.pageNumber > totalPages) {
      continue;
    }

    const page = pdfDoc.getPage(placement.pageNumber - 1);
    const { width: pageWidth, height: pageHeight } = page.getSize();

    // Clamp placement within page bounds
    const safeX = Math.max(0, Math.min(placement.x, pageWidth - 10));
    const safeY = Math.max(0, Math.min(placement.y, pageHeight - 10));
    const safeWidth = Math.min(placement.width, pageWidth - safeX);
    const safeHeight = Math.min(placement.height, pageHeight - safeY);

    page.drawImage(signatureImage, {
      x: safeX,
      y: safeY,
      width: safeWidth,
      height: safeHeight,
    });

    // Optional metadata label below signature
    if (font && (options.signerName || options.signDate)) {
      const parts: string[] = [];
      if (options.signerName) parts.push(`Digitally signed: ${options.signerName}`);
      if (options.signDate) parts.push(`Date: ${options.signDate}`);
      const caption = parts.join(" • ");

      const labelY = Math.max(5, safeY - 10);
      page.drawText(caption, {
        x: safeX,
        y: labelY,
        size: 7.5,
        font,
        color: rgb(0.35, 0.35, 0.35),
      });
    }

    stampedCount++;
  }

  const pdfBytes = await pdfDoc.save({ useObjectStreams: true });
  const baseName = file instanceof File ? file.name.replace(/\.[^/.]+$/, "") : "document";
  const fileName = options.outputFileName || `${baseName}-signed.pdf`;

  return {
    pdfBytes,
    fileName,
    stampedSignaturesCount: stampedCount,
  };
}
