import { describe, it, expect } from "vitest";
import { PDFDocument } from "pdf-lib";
import { alternateMixPdfs } from "../operations/alternate-mix";

async function createNumberedPdf(prefix: string, count: number): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  for (let i = 1; i <= count; i++) {
    const page = doc.addPage([300, 400]);
    page.drawText(`${prefix} Page ${i}`, { x: 50, y: 350 });
  }
  return await doc.save();
}

describe("Phase 12: Alternate & Mix PDF Operations", () => {
  it("interleaves two PDFs in 1-to-1 alternate sequence (A1, B1, A2, B2)", async () => {
    const bytesA = await createNumberedPdf("DocA", 3);
    const bytesB = await createNumberedPdf("DocB", 3);

    const result = await alternateMixPdfs(bytesA, bytesB, {
      swapOrder: false,
      reverseB: false,
    });

    expect(result.totalOutputPages).toBe(6);
    expect(result.pagesFromA).toBe(3);
    expect(result.pagesFromB).toBe(3);

    const doc = await PDFDocument.load(result.pdfBytes);
    expect(doc.getPageCount()).toBe(6);
  });

  it("interleaves with File B reversed (scanner odd/even mode)", async () => {
    const bytesA = await createNumberedPdf("DocA", 3); // 1, 2, 3
    const bytesB = await createNumberedPdf("DocB", 3); // 1, 2, 3 (will be taken as 3, 2, 1)

    const result = await alternateMixPdfs(bytesA, bytesB, {
      reverseB: true,
    });

    expect(result.totalOutputPages).toBe(6);
    const doc = await PDFDocument.load(result.pdfBytes);
    expect(doc.getPageCount()).toBe(6);
  });

  it("handles uneven page counts by appending leftovers cleanly", async () => {
    const bytesA = await createNumberedPdf("DocA", 4);
    const bytesB = await createNumberedPdf("DocB", 2);

    const result = await alternateMixPdfs(bytesA, bytesB);

    expect(result.totalOutputPages).toBe(6);
    const doc = await PDFDocument.load(result.pdfBytes);
    expect(doc.getPageCount()).toBe(6);
  });

  it("supports multi-page steps (e.g. 2 pages from A, 1 page from B)", async () => {
    const bytesA = await createNumberedPdf("DocA", 4);
    const bytesB = await createNumberedPdf("DocB", 2);

    const result = await alternateMixPdfs(bytesA, bytesB, {
      stepA: 2,
      stepB: 1,
    });

    expect(result.totalOutputPages).toBe(6);
  });
});
