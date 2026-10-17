import { PDFDocument } from "pdf-lib";

export interface CropResizeOptions {
  mode: "crop" | "resize_standard" | "scale_factor";
  cropMargins?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  standardSize?: "A4" | "LETTER" | "A3" | "A5";
  scaleFactor?: number; // e.g. 0.75, 1.25, 1.5
  pageScope?: "all" | "odd" | "even" | "custom";
  customPages?: number[];
}

export interface CropResizeResult {
  pdfBytes: Uint8Array;
  modifiedPagesCount: number;
  totalPages: number;
}

const STANDARD_SIZES: Record<string, [number, number]> = {
  A4: [595.28, 841.89],
  LETTER: [612.0, 792.0],
  A3: [841.89, 1190.55],
  A5: [419.53, 595.28],
};

function shouldProcessPage(idx: number, options: CropResizeOptions): boolean {
  const pNum = idx + 1;
  if (options.pageScope === "odd") return pNum % 2 !== 0;
  if (options.pageScope === "even") return pNum % 2 === 0;
  if (options.pageScope === "custom" && options.customPages) {
    return options.customPages.includes(pNum);
  }
  return true;
}

export async function cropAndResizePdf(
  pdfBytes: Uint8Array,
  options: CropResizeOptions
): Promise<CropResizeResult> {
  const doc = await PDFDocument.load(pdfBytes);
  const totalPages = doc.getPageCount();
  if (totalPages === 0) throw new Error("Document has no pages.");

  let modifiedPagesCount = 0;

  for (let i = 0; i < totalPages; i++) {
    if (!shouldProcessPage(i, options)) continue;

    const page = doc.getPage(i);
    const { width, height } = page.getSize();

    if (options.mode === "crop") {
      const { top = 0, bottom = 0, left = 0, right = 0 } = options.cropMargins || {};
      const newWidth = Math.max(10, width - left - right);
      const newHeight = Math.max(10, height - top - bottom);
      const newX = left;
      const newY = bottom;

      page.setCropBox(newX, newY, newWidth, newHeight);
      page.setMediaBox(newX, newY, newWidth, newHeight);
      modifiedPagesCount++;
    } else if (options.mode === "scale_factor") {
      const factor = options.scaleFactor ?? 1.0;
      if (factor > 0 && factor !== 1.0) {
        page.scale(factor, factor);
        modifiedPagesCount++;
      }
    } else if (options.mode === "resize_standard") {
      const targetSize = STANDARD_SIZES[options.standardSize || "A4"];
      const isSrcLandscape = width > height;
      const tW = isSrcLandscape ? Math.max(...targetSize) : Math.min(...targetSize);
      const tH = isSrcLandscape ? Math.min(...targetSize) : Math.max(...targetSize);

      const scaleX = tW / width;
      const scaleY = tH / height;
      const scale = Math.min(scaleX, scaleY);

      page.setSize(tW, tH);
      page.scaleContent(scale, scale);
      modifiedPagesCount++;
    }
  }

  const outBytes = await doc.save();
  return {
    pdfBytes: outBytes,
    modifiedPagesCount,
    totalPages,
  };
}
