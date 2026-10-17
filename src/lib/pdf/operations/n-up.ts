import { PDFDocument, PDFName, rgb } from "pdf-lib";

export interface NUpOptions {
  pagesPerSheet: 2 | 4 | 6 | 9 | 16;
  sheetSize?: "A4" | "LETTER" | "SAME_AS_SOURCE";
  orientation?: "auto" | "portrait" | "landscape";
  pageOrder?: "horizontal" | "vertical";
  drawBorders?: boolean;
  margin?: number;
  spacing?: number;
  repeatSinglePage?: boolean;
}

export interface NUpResult {
  pdfBytes: Uint8Array;
  sheetCount: number;
  sourcePageCount: number;
  pagesPerSheet: number;
}

const SHEET_DIMENSIONS: Record<string, [number, number]> = {
  A4: [595.28, 841.89],
  LETTER: [612.0, 792.0],
};

function getGridDimensions(n: number, isLandscape: boolean): { cols: number; rows: number } {
  switch (n) {
    case 2:
      return isLandscape ? { cols: 2, rows: 1 } : { cols: 1, rows: 2 };
    case 6:
      return isLandscape ? { cols: 3, rows: 2 } : { cols: 2, rows: 3 };
    case 9:
      return { cols: 3, rows: 3 };
    case 16:
      return { cols: 4, rows: 4 };
    case 4:
    default:
      return { cols: 2, rows: 2 };
  }
}

function resolveSheetSize(
  option: NUpOptions["sheetSize"],
  orientation: NUpOptions["orientation"],
  firstPageDim: [number, number],
  n: number
): { width: number; height: number; isLandscape: boolean } {
  const baseDim = option === "LETTER" ? SHEET_DIMENSIONS.LETTER
    : option === "SAME_AS_SOURCE" ? firstPageDim
    : SHEET_DIMENSIONS.A4;

  const wantLandscape = orientation === "landscape" ? true
    : orientation === "portrait" ? false
    : n === 2 ? true
    : baseDim[0] > baseDim[1];

  const w = wantLandscape ? Math.max(...baseDim) : Math.min(...baseDim);
  const h = wantLandscape ? Math.min(...baseDim) : Math.max(...baseDim);
  return { width: w, height: h, isLandscape: wantLandscape };
}

export async function createNUpPdf(pdfBytes: Uint8Array, options: NUpOptions): Promise<NUpResult> {
  const srcDoc = await PDFDocument.load(pdfBytes);
  const totalSrcPages = srcDoc.getPageCount();
  if (totalSrcPages === 0) throw new Error("PDF document contains no pages.");

  // Fix empty pages lacking contents stream
  for (const p of srcDoc.getPages()) {
    if (!p.node.get(PDFName.of("Contents"))) {
      const emptyStream = srcDoc.context.flateStream(new Uint8Array(0));
      p.node.set(PDFName.of("Contents"), srcDoc.context.register(emptyStream));
    }
  }

  const outDoc = await PDFDocument.create();
  const pageIndices = srcDoc.getPageIndices();
  const embeddedPages = await outDoc.embedPdf(srcDoc, pageIndices);

  const firstDim: [number, number] = [embeddedPages[0].width, embeddedPages[0].height];
  const { width: sW, height: sH, isLandscape } = resolveSheetSize(
    options.sheetSize || "A4",
    options.orientation || "auto",
    firstDim,
    options.pagesPerSheet
  );

  const { cols, rows } = getGridDimensions(options.pagesPerSheet, isLandscape);
  const margin = options.margin ?? 24;
  const spacing = options.spacing ?? 12;
  const drawBorders = options.drawBorders ?? true;
  const isVertical = options.pageOrder === "vertical";

  const availW = sW - 2 * margin - (cols - 1) * spacing;
  const availH = sH - 2 * margin - (rows - 1) * spacing;
  const cellW = availW / cols;
  const cellH = availH / rows;

  const n = options.pagesPerSheet;
  const pagesToPlace: typeof embeddedPages = [];

  if (options.repeatSinglePage && totalSrcPages === 1) {
    for (let i = 0; i < n; i++) pagesToPlace.push(embeddedPages[0]);
  } else {
    pagesToPlace.push(...embeddedPages);
  }

  let sheetCount = 0;
  for (let idx = 0; idx < pagesToPlace.length; idx += n) {
    const chunk = pagesToPlace.slice(idx, idx + n);
    const outPage = outDoc.addPage([sW, sH]);
    sheetCount++;

    for (let cIdx = 0; cIdx < chunk.length; cIdx++) {
      const col = isVertical ? Math.floor(cIdx / rows) : cIdx % cols;
      const row = isVertical ? cIdx % rows : Math.floor(cIdx / cols);

      const cellX = margin + col * (cellW + spacing);
      const cellY = sH - margin - (row + 1) * cellH - row * spacing;

      const emb = chunk[cIdx];
      const scale = Math.min(cellW / emb.width, cellH / emb.height);
      const dw = emb.width * scale;
      const dh = emb.height * scale;
      const dx = cellX + (cellW - dw) / 2;
      const dy = cellY + (cellH - dh) / 2;

      outPage.drawPage(emb, { x: dx, y: dy, width: dw, height: dh });

      if (drawBorders) {
        outPage.drawRectangle({
          x: dx,
          y: dy,
          width: dw,
          height: dh,
          borderColor: rgb(0.8, 0.8, 0.8),
          borderWidth: 0.75,
        });
      }
    }
  }

  const outBytes = await outDoc.save();
  return {
    pdfBytes: outBytes,
    sheetCount,
    sourcePageCount: totalSrcPages,
    pagesPerSheet: n,
  };
}
