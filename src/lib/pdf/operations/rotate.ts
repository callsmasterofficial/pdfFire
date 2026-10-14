import { PDFDocument, degrees } from "pdf-lib";

export interface RotatePdfOptions {
  angleDegrees: 90 | 180 | 270;
  pages?: number[]; // 1-indexed page numbers. If omitted or empty, rotates all pages.
  outputFileName?: string;
}

export interface RotatePdfResult {
  pdfBytes: Uint8Array;
  pageCount: number;
  fileName: string;
}

export async function rotatePdfDocument(
  fileOrBytes: File | Uint8Array | ArrayBuffer,
  options: RotatePdfOptions
): Promise<RotatePdfResult> {
  const { angleDegrees, pages, outputFileName = "rotated-document.pdf" } = options;

  let bytes: Uint8Array | ArrayBuffer;
  if (fileOrBytes instanceof File) {
    bytes = await fileOrBytes.arrayBuffer();
  } else {
    bytes = fileOrBytes;
  }

  const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const totalPages = pdfDoc.getPageCount();
  const targetPages = pages && pages.length > 0 ? new Set(pages) : null;

  for (let i = 0; i < totalPages; i++) {
    const pageNumber = i + 1;
    if (targetPages === null || targetPages.has(pageNumber)) {
      const page = pdfDoc.getPage(i);
      const currentRotation = page.getRotation().angle;
      const newRotation = (currentRotation + angleDegrees) % 360;
      page.setRotation(degrees(newRotation));
    }
  }

  const pdfBytes = await pdfDoc.save();

  return {
    pdfBytes,
    pageCount: totalPages,
    fileName: outputFileName,
  };
}
