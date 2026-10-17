import { describe, it, expect } from "vitest";
import { PDFDocument } from "pdf-lib";
import { flipPdf } from "../operations/flip";

async function createTestPdf(pageCount: number, blank = false): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  for (let i = 1; i <= pageCount; i++) {
    const page = doc.addPage([300, 400]);
    if (!blank) {
      page.drawText(`Flip Page ${i}`, { x: 50, y: 350 });
    }
  }
  return await doc.save();
}

describe("Phase 12: Flip & Mirror PDF Operations", () => {
  it("flips document horizontally across all pages", async () => {
    const srcBytes = await createTestPdf(3);
    const result = await flipPdf(srcBytes, {
      direction: "horizontal",
      pageScope: "all",
    });

    expect(result.flippedPagesCount).toBe(3);
    expect(result.totalPages).toBe(3);

    const doc = await PDFDocument.load(result.pdfBytes);
    expect(doc.getPageCount()).toBe(3);
    expect(doc.getPage(0).getWidth()).toBe(300);
  });

  it("flips document vertically (upside-down)", async () => {
    const srcBytes = await createTestPdf(2);
    const result = await flipPdf(srcBytes, {
      direction: "vertical",
    });

    expect(result.flippedPagesCount).toBe(2);
    const doc = await PDFDocument.load(result.pdfBytes);
    expect(doc.getPageCount()).toBe(2);
  });

  it("flips both horizontally and vertically (180 mirror)", async () => {
    const srcBytes = await createTestPdf(2);
    const result = await flipPdf(srcBytes, {
      direction: "both",
    });

    expect(result.flippedPagesCount).toBe(2);
  });

  it("applies flip only to odd pages when pageScope is 'odd'", async () => {
    const srcBytes = await createTestPdf(4);
    const result = await flipPdf(srcBytes, {
      direction: "horizontal",
      pageScope: "odd",
    });

    expect(result.flippedPagesCount).toBe(2); // pages 1 and 3
    const doc = await PDFDocument.load(result.pdfBytes);
    expect(doc.getPageCount()).toBe(4);
  });

  it("resilient to empty pages lacking contents streams", async () => {
    const srcBytes = await createTestPdf(2, true); // blank pages
    const result = await flipPdf(srcBytes, {
      direction: "horizontal",
    });

    expect(result.flippedPagesCount).toBe(2);
    const doc = await PDFDocument.load(result.pdfBytes);
    expect(doc.getPageCount()).toBe(2);
  });
});
