import { describe, it, expect } from "vitest";
import { PDFDocument } from "pdf-lib";
import {
  convertTextToPdf,
  createSearchablePdf,
  OCR_LANGUAGES,
  OcrDocumentResult,
} from "../operations";

describe("Phase 7 Operations (OCR & Advanced Conversions)", () => {
  it("Text to PDF: converts multiline text into a standardized formatted PDF", async () => {
    const textContent = `First paragraph of test document.\n\nSecond paragraph containing longer sentences that should test word wrapping logic inside client-side pdf-lib generation cleanly without any server involvement.\n\nThird paragraph.`;

    const result = await convertTextToPdf(textContent, {
      title: "Sample Report",
      fontSize: 12,
      outputFileName: "my-doc.pdf",
    });

    expect(result.pageCount).toBeGreaterThanOrEqual(1);
    expect(result.fileName).toBe("my-doc.pdf");
    expect(result.pdfBytes.length).toBeGreaterThan(500);

    // Verify magic bytes
    const header = new TextDecoder().decode(result.pdfBytes.slice(0, 5));
    expect(header).toBe("%PDF-");

    // Verify Title metadata in generated PDF
    const loadedDoc = await PDFDocument.load(result.pdfBytes);
    expect(loadedDoc.getTitle()).toBe("Sample Report");
  });

  it("Searchable PDF: overlays recognized OCR text layer into PDF document", async () => {
    // Create simple 1-page PDF
    const baseDoc = await PDFDocument.create();
    baseDoc.addPage([500, 700]);
    const baseBytes = await baseDoc.save();

    const mockOcrResult: OcrDocumentResult = {
      fullText: "Invoice 1002\nTotal: $450.00",
      pages: [
        {
          pageNumber: 1,
          text: "Invoice 1002\nTotal: $450.00",
          confidence: 96,
        },
      ],
      averageConfidence: 96,
      language: "eng",
      processingTimeMs: 120,
    };

    const res = await createSearchablePdf(baseBytes, mockOcrResult, "searchable-output.pdf");

    expect(res.fileName).toBe("searchable-output.pdf");
    expect(res.pdfBytes.length).toBeGreaterThan(baseBytes.length);

    // Verify loadable
    const outputDoc = await PDFDocument.load(res.pdfBytes);
    expect(outputDoc.getPageCount()).toBe(1);
  });

  it("OCR Languages: provides language pack configs with valid codes and size estimates", () => {
    expect(OCR_LANGUAGES.length).toBeGreaterThanOrEqual(5);

    const eng = OCR_LANGUAGES.find((l) => l.code === "eng");
    expect(eng).toBeDefined();
    expect(eng?.name).toBe("English");
    expect(eng?.sizeEstimate).toContain("MB");

    const jpn = OCR_LANGUAGES.find((l) => l.code === "jpn");
    expect(jpn).toBeDefined();
  });
});
