import { PDFDocument } from "pdf-lib";

export interface ExtractPdfOptions {
  pageNumbers: number[]; // 1-indexed page numbers
  outputFileName?: string;
}

export interface ExtractPdfResult {
  pdfBytes: Uint8Array;
  pageCount: number;
  fileName: string;
}

export async function extractPdfPages(
  fileOrBytes: File | Uint8Array | ArrayBuffer,
  options: ExtractPdfOptions
): Promise<ExtractPdfResult> {
  const { pageNumbers, outputFileName = "extracted-pages.pdf" } = options;

  if (!pageNumbers || pageNumbers.length === 0) {
    throw new Error("No pages selected for extraction.");
  }

  let bytes: Uint8Array | ArrayBuffer;
  if (fileOrBytes instanceof File) {
    bytes = await fileOrBytes.arrayBuffer();
  } else {
    bytes = fileOrBytes;
  }

  const srcDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const totalPages = srcDoc.getPageCount();

  // Validate page numbers
  const validIndices: number[] = [];
  for (const pageNum of pageNumbers) {
    if (pageNum < 1 || pageNum > totalPages) {
      throw new Error(`Page number ${pageNum} is out of bounds (document has ${totalPages} pages).`);
    }
    validIndices.push(pageNum - 1);
  }

  const newDoc = await PDFDocument.create();
  const copiedPages = await newDoc.copyPages(srcDoc, validIndices);

  for (const page of copiedPages) {
    newDoc.addPage(page);
  }

  const pdfBytes = await newDoc.save();

  return {
    pdfBytes,
    pageCount: newDoc.getPageCount(),
    fileName: outputFileName,
  };
}
