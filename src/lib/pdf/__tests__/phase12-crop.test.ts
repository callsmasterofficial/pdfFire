import { describe, it, expect } from "vitest";
import { PDFDocument } from "pdf-lib";
import { cropAndResizePdf } from "../operations/crop";

async function createTestPdf(pageCount: number, width = 600, height = 800): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  for (let i = 1; i <= pageCount; i++) {
    const page = doc.addPage([width, height]);
    page.drawText(`Page ${i}`, { x: 50, y: 700 });
  }
  return await doc.save();
}

describe("Phase 12: Crop & Resize PDF Operations", () => {
  it("crops page margins across all pages", async () => {
    const srcBytes = await createTestPdf(2, 600, 800);
    const result = await cropAndResizePdf(srcBytes, {
      mode: "crop",
      cropMargins: { top: 50, bottom: 50, left: 40, right: 40 },
      pageScope: "all",
    });

    expect(result.modifiedPagesCount).toBe(2);
    expect(result.totalPages).toBe(2);

    const doc = await PDFDocument.load(result.pdfBytes);
    const page0 = doc.getPage(0);
    const cropBox = page0.getCropBox();
    expect(cropBox.x).toBe(40);
    expect(cropBox.y).toBe(50);
    expect(cropBox.width).toBe(600 - 80);
    expect(cropBox.height).toBe(800 - 100);
  });

  it("crops only odd pages when pageScope is 'odd'", async () => {
    const srcBytes = await createTestPdf(3, 500, 700);
    const result = await cropAndResizePdf(srcBytes, {
      mode: "crop",
      cropMargins: { top: 20, bottom: 20, left: 20, right: 20 },
      pageScope: "odd",
    });

    expect(result.modifiedPagesCount).toBe(2); // pages 1 and 3
    const doc = await PDFDocument.load(result.pdfBytes);
    expect(doc.getPage(0).getCropBox().width).toBe(460);
    expect(doc.getPage(1).getCropBox().width).toBe(500); // untouched even page
    expect(doc.getPage(2).getCropBox().width).toBe(460);
  });

  it("resizes pages to standard A4 paper size", async () => {
    const srcBytes = await createTestPdf(1, 400, 500);
    const result = await cropAndResizePdf(srcBytes, {
      mode: "resize_standard",
      standardSize: "A4",
    });

    expect(result.modifiedPagesCount).toBe(1);
    const doc = await PDFDocument.load(result.pdfBytes);
    const page = doc.getPage(0);
    expect(Math.round(page.getWidth())).toBe(595);
    expect(Math.round(page.getHeight())).toBe(842);
  });

  it("scales document pages by percentage factor", async () => {
    const srcBytes = await createTestPdf(1, 300, 400);
    const result = await cropAndResizePdf(srcBytes, {
      mode: "scale_factor",
      scaleFactor: 1.5,
    });

    expect(result.modifiedPagesCount).toBe(1);
    const doc = await PDFDocument.load(result.pdfBytes);
    const page = doc.getPage(0);
    expect(page.getWidth()).toBe(450);
    expect(page.getHeight()).toBe(600);
  });
});
