import { PDFDocument } from "pdf-lib";

export interface AlternateMixOptions {
  reverseA?: boolean;
  reverseB?: boolean;
  stepA?: number;
  stepB?: number;
  swapOrder?: boolean;
}

export interface AlternateMixResult {
  pdfBytes: Uint8Array;
  totalOutputPages: number;
  pagesFromA: number;
  pagesFromB: number;
}

export async function alternateMixPdfs(
  bytesA: Uint8Array,
  bytesB: Uint8Array,
  options: AlternateMixOptions = {}
): Promise<AlternateMixResult> {
  const docA = await PDFDocument.load(bytesA);
  const docB = await PDFDocument.load(bytesB);
  const outDoc = await PDFDocument.create();

  const countA = docA.getPageCount();
  const countB = docB.getPageCount();
  if (countA === 0 && countB === 0) throw new Error("Both documents are empty.");

  let indicesA = docA.getPageIndices();
  let indicesB = docB.getPageIndices();

  if (options.reverseA) indicesA = indicesA.reverse();
  if (options.reverseB) indicesB = indicesB.reverse();

  const stepA = Math.max(1, options.stepA ?? 1);
  const stepB = Math.max(1, options.stepB ?? 1);
  const swap = options.swapOrder ?? false;

  let posA = 0;
  let posB = 0;

  const orderQueue: Array<{ source: "A" | "B"; idx: number }> = [];

  while (posA < indicesA.length || posB < indicesB.length) {
    if (!swap) {
      for (let s = 0; s < stepA && posA < indicesA.length; s++, posA++) {
        orderQueue.push({ source: "A", idx: indicesA[posA] });
      }
      for (let s = 0; s < stepB && posB < indicesB.length; s++, posB++) {
        orderQueue.push({ source: "B", idx: indicesB[posB] });
      }
    } else {
      for (let s = 0; s < stepB && posB < indicesB.length; s++, posB++) {
        orderQueue.push({ source: "B", idx: indicesB[posB] });
      }
      for (let s = 0; s < stepA && posA < indicesA.length; s++, posA++) {
        orderQueue.push({ source: "A", idx: indicesA[posA] });
      }
    }
  }

  // Pre-copy all needed pages into outDoc
  const copiedA = await outDoc.copyPages(docA, docA.getPageIndices());
  const copiedB = await outDoc.copyPages(docB, docB.getPageIndices());

  for (const item of orderQueue) {
    const page = item.source === "A" ? copiedA[item.idx] : copiedB[item.idx];
    outDoc.addPage(page);
  }

  const outBytes = await outDoc.save();
  return {
    pdfBytes: outBytes,
    totalOutputPages: orderQueue.length,
    pagesFromA: countA,
    pagesFromB: countB,
  };
}
