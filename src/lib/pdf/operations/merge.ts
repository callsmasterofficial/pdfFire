import { PDFDocument } from "pdf-lib";

export interface MergePdfResult {
  pdfBytes: Uint8Array;
  pageCount: number;
  fileName: string;
}

export async function mergePdfFiles(
  files: (File | Uint8Array | ArrayBuffer)[],
  outputFileName = "merged-document.pdf"
): Promise<MergePdfResult> {
  if (!files || files.length < 2) {
    throw new Error("At least 2 PDF files are required to perform a merge.");
  }

  const mergedDoc = await PDFDocument.create();

  for (const item of files) {
    let bytes: Uint8Array | ArrayBuffer;
    if (item instanceof File) {
      bytes = await item.arrayBuffer();
    } else {
      bytes = item;
    }

    const srcDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const pageIndices = srcDoc.getPageIndices();
    const copiedPages = await mergedDoc.copyPages(srcDoc, pageIndices);

    for (const page of copiedPages) {
      mergedDoc.addPage(page);
    }
  }

  const pdfBytes = await mergedDoc.save();

  return {
    pdfBytes,
    pageCount: mergedDoc.getPageCount(),
    fileName: outputFileName,
  };
}
