import { describe, it, expect } from "vitest";
import { PDFDocument } from "pdf-lib";
import { signPdf } from "../operations/sign";
import { createSamplePdfFile } from "../test-fixtures";

// 1x1 transparent red PNG data URL for testing
const SAMPLE_PNG_BASE64 =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

describe("Phase 12: Sign PDF Operations", () => {
  it("successfully stamps a signature on a specific page", async () => {
    const file = createSamplePdfFile("contract.pdf");
    const result = await signPdf(file, {
      signatureImageBase64: SAMPLE_PNG_BASE64,
      placements: [
        {
          pageNumber: 1,
          x: 100,
          y: 200,
          width: 150,
          height: 60,
        },
      ],
      signerName: "Alex Morgan",
      signDate: "2026-10-14",
    });

    expect(result.pdfBytes).toBeInstanceOf(Uint8Array);
    expect(result.stampedSignaturesCount).toBe(1);
    expect(result.fileName).toBe("contract-signed.pdf");

    const loadedDoc = await PDFDocument.load(result.pdfBytes);
    expect(loadedDoc.getPageCount()).toBe(3);
  });

  it("stamps signatures across multiple pages", async () => {
    const file = createSamplePdfFile("multipage.pdf");
    const result = await signPdf(file, {
      signatureImageBase64: SAMPLE_PNG_BASE64,
      placements: [
        { pageNumber: 1, x: 50, y: 100, width: 120, height: 40 },
        { pageNumber: 2, x: 80, y: 150, width: 120, height: 40 },
        { pageNumber: 3, x: 100, y: 120, width: 120, height: 40 },
      ],
    });

    expect(result.stampedSignaturesCount).toBe(3);
    const loadedDoc = await PDFDocument.load(result.pdfBytes);
    expect(loadedDoc.getPageCount()).toBe(3);
  });

  it("safely ignores out-of-bounds page placements and clamps dimensions", async () => {
    const file = createSamplePdfFile("bounds.pdf");
    const result = await signPdf(file, {
      signatureImageBase64: SAMPLE_PNG_BASE64,
      placements: [
        { pageNumber: 1, x: -50, y: 9999, width: 1000, height: 200 },
        { pageNumber: 99, x: 100, y: 100, width: 100, height: 50 }, // Out-of-bounds page
      ],
    });

    expect(result.stampedSignaturesCount).toBe(1); // Page 99 ignored
  });

  it("throws error when placements array is empty", async () => {
    const file = createSamplePdfFile("empty.pdf");
    await expect(
      signPdf(file, {
        signatureImageBase64: SAMPLE_PNG_BASE64,
        placements: [],
      })
    ).rejects.toThrow("At least one signature placement must be specified.");
  });
});
