import { PDFDocument } from "pdf-lib";

export interface ReorderPdfOptions {
  pageOrder: number[]; // 1-indexed ordered list of pages to retain
  outputFileName?: string;
}

export interface ReorderPdfResult {
  pdfBytes: Uint8Array;
  pageCount: number;
  fileName: string;
}

export async function reorderPdfPages(
  fileOrBytes: File | Uint8Array | ArrayBuffer,
  options: ReorderPdfOptions
): Promise<ReorderPdfResult> {
  const { pageOrder, outputFileName = "reordered-document.pdf" } = options;

  if (!pageOrder || pageOrder.length === 0) {
    throw new Error("Page order cannot be empty (at least 1 page must be retained).");
  }

  let bytes: Uint8Array | ArrayBuffer;
  if (fileOrBytes instanceof File) {
    bytes = await fileOrBytes.arrayBuffer();
  } else {
    bytes = fileOrBytes;
  }

  const srcDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const totalPages = srcDoc.getPageCount();

  const indicesToCopy: number[] = [];
  for (const pageNum of pageOrder) {
    if (pageNum < 1 || pageNum > totalPages) {
      throw new Error(`Page ${pageNum} is out of bounds (document has ${totalPages} pages).`);
    }
    indicesToCopy.push(pageNum - 1);
  }

  const newDoc = await PDFDocument.create();
  const copiedPages = await newDoc.copyPages(srcDoc, indicesToCopy);

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
