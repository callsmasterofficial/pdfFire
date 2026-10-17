import { describe, it, expect } from "vitest";
import { PDFDocument } from "pdf-lib";
import { createNUpPdf } from "../operations/n-up";

async function createTestPdf(pageCount: number, blank = false): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  for (let i = 1; i <= pageCount; i++) {
    const page = doc.addPage([300, 400]);
    if (!blank) {
      page.drawText(`Test Document Page ${i}`, { x: 40, y: 350 });
    }
  }
  return await doc.save();
}

describe("Phase 12: Pages per Sheet / N-Up PDF Operations", () => {
  it("imposes 2 pages side-by-side onto a single landscape sheet", async () => {
    const srcBytes = await createTestPdf(2);
    const result = await createNUpPdf(srcBytes, {
      pagesPerSheet: 2,
      sheetSize: "A4",
      orientation: "auto",
      drawBorders: true,
    });

    expect(result.sheetCount).toBe(1);
    expect(result.sourcePageCount).toBe(2);
    expect(result.pagesPerSheet).toBe(2);

    const doc = await PDFDocument.load(result.pdfBytes);
    expect(doc.getPageCount()).toBe(1);
    const page = doc.getPage(0);
    // Landscape A4 width is > height
    expect(page.getWidth()).toBeGreaterThan(page.getHeight());
  });

  it("imposes 8 pages into 2 sheets with 4-Up grid (2x2)", async () => {
    const srcBytes = await createTestPdf(8);
    const result = await createNUpPdf(srcBytes, {
      pagesPerSheet: 4,
      sheetSize: "A4",
      orientation: "portrait",
      drawBorders: true,
    });

    expect(result.sheetCount).toBe(2);
    expect(result.sourcePageCount).toBe(8);

    const doc = await PDFDocument.load(result.pdfBytes);
    expect(doc.getPageCount()).toBe(2);
  });

  it("supports 9-Up grid with vertical ordering", async () => {
    const srcBytes = await createTestPdf(9);
    const result = await createNUpPdf(srcBytes, {
      pagesPerSheet: 9,
      pageOrder: "vertical",
      drawBorders: true,
    });

    expect(result.sheetCount).toBe(1);
    const doc = await PDFDocument.load(result.pdfBytes);
    expect(doc.getPageCount()).toBe(1);
  });

  it("repeats a 1-page document across all N cells when repeatSinglePage is enabled", async () => {
    const srcBytes = await createTestPdf(1);
    const result = await createNUpPdf(srcBytes, {
      pagesPerSheet: 4,
      repeatSinglePage: true,
      drawBorders: true,
    });

    expect(result.sheetCount).toBe(1);
    expect(result.sourcePageCount).toBe(1);
    const doc = await PDFDocument.load(result.pdfBytes);
    expect(doc.getPageCount()).toBe(1);
  });

  it("handles blank pages lacking contents streams without crashing", async () => {
    const srcBytes = await createTestPdf(2, true); // blank pages
    const result = await createNUpPdf(srcBytes, {
      pagesPerSheet: 2,
      drawBorders: false,
    });

    expect(result.sheetCount).toBe(1);
    const doc = await PDFDocument.load(result.pdfBytes);
    expect(doc.getPageCount()).toBe(1);
  });
});
