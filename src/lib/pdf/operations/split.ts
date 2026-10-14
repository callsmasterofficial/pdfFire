import { PDFDocument } from "pdf-lib";

export interface SplitFileResult {
  name: string;
  data: Uint8Array;
  pageCount: number;
}

export interface SplitPdfOptions {
  mode: "ranges" | "every-page";
  rangesString?: string; // e.g. "1-2, 3-5, 6"
  baseFileName?: string;
}

export function parsePageRanges(rangesString: string, maxPage: number): number[][] {
  const parts = rangesString.split(",").map((s) => s.trim()).filter(Boolean);
  if (parts.length === 0) {
    throw new Error("No page ranges specified.");
  }

  const resultRanges: number[][] = [];

  for (const part of parts) {
    if (part.includes("-")) {
      const [startStr, endStr] = part.split("-").map((s) => s.trim());
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (isNaN(start) || isNaN(end) || start < 1 || end > maxPage || start > end) {
        throw new Error(`Invalid range format: "${part}". Valid pages are 1 to ${maxPage}.`);
      }
      const pageList: number[] = [];
      for (let p = start; p <= end; p++) pageList.push(p);
      resultRanges.push(pageList);
    } else {
      const page = parseInt(part, 10);
      if (isNaN(page) || page < 1 || page > maxPage) {
        throw new Error(`Invalid page number: "${part}". Valid pages are 1 to ${maxPage}.`);
      }
      resultRanges.push([page]);
    }
  }

  return resultRanges;
}

export async function splitPdfDocument(
  fileOrBytes: File | Uint8Array | ArrayBuffer,
  options: SplitPdfOptions
): Promise<SplitFileResult[]> {
  const { mode, rangesString = "", baseFileName = "document" } = options;

  let bytes: Uint8Array | ArrayBuffer;
  if (fileOrBytes instanceof File) {
    bytes = await fileOrBytes.arrayBuffer();
  } else {
    bytes = fileOrBytes;
  }

  const srcDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const totalPages = srcDoc.getPageCount();

  let targetGroups: number[][];

  if (mode === "every-page") {
    targetGroups = Array.from({ length: totalPages }, (_, i) => [i + 1]);
  } else {
    targetGroups = parsePageRanges(rangesString, totalPages);
  }

  const splitOutputs: SplitFileResult[] = [];

  for (let idx = 0; idx < targetGroups.length; idx++) {
    const pageGroup = targetGroups[idx];
    const newDoc = await PDFDocument.create();
    const indicesToCopy = pageGroup.map((p) => p - 1);
    const copiedPages = await newDoc.copyPages(srcDoc, indicesToCopy);

    for (const page of copiedPages) {
      newDoc.addPage(page);
    }

    const data = await newDoc.save();
    const rangeLabel =
      pageGroup.length === 1
        ? `page-${pageGroup[0]}`
        : `pages-${pageGroup[0]}-to-${pageGroup[pageGroup.length - 1]}`;

    splitOutputs.push({
      name: `${baseFileName}-${rangeLabel}.pdf`,
      data,
      pageCount: pageGroup.length,
    });
  }

  return splitOutputs;
}
