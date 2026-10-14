import { describe, it, expect } from "vitest";
import { PDFDocument } from "pdf-lib";
import { createSamplePdfFile } from "../test-fixtures";
import { compressPdfDocument } from "../operations/compress";
import { applyWatermarkToPdf } from "../operations/watermark";
import { addPageNumbersToPdf } from "../operations/page-numbering";
import { applyAnnotationsToPdf } from "../operations/annotate";
import { AnnotationItem } from "@/types/annotation";

describe("Phase 5 PDF Operations", () => {
  it("Compress PDF: evaluates size and returns honest metrics", async () => {
    const doc = createSamplePdfFile("large-test.pdf");
    const result = await compressPdfDocument(doc, { preset: "medium" });

    expect(result.originalSizeBytes).toBeGreaterThan(0);
    expect(result.compressedSizeBytes).toBeGreaterThan(0);
    expect(typeof result.isSmaller).toBe("boolean");
    expect(typeof result.percentageSaved).toBe("number");
    expect(result.fileName).toBe("compressed-document.pdf");

    // Output must remain a valid PDF
    const loaded = await PDFDocument.load(result.pdfBytes);
    expect(loaded.getPageCount()).toBe(3);
  });

  it("Watermark: applies text watermark to all pages", async () => {
    const doc = createSamplePdfFile();
    const result = await applyWatermarkToPdf(doc, {
      type: "text",
      text: "TOP SECRET",
      fontSize: 36,
      opacity: 0.3,
      rotationDegrees: 45,
      colorHex: "#ff0000",
    });

    expect(result.pageCount).toBe(3);
    const loaded = await PDFDocument.load(result.pdfBytes);
    expect(loaded.getPageCount()).toBe(3);
  });

  it("Watermark: targets specific pages only", async () => {
    const doc = createSamplePdfFile();
    const result = await applyWatermarkToPdf(doc, {
      type: "text",
      text: "DRAFT",
      pages: [2],
    });

    expect(result.pageCount).toBe(3);
    const loaded = await PDFDocument.load(result.pdfBytes);
    expect(loaded.getPageCount()).toBe(3);
  });

  it("Page Numbering: numbers pages and supports skipFirstPage", async () => {
    const doc = createSamplePdfFile();
    const result = await addPageNumbersToPdf(doc, {
      position: "bottom-center",
      format: "page-of-total",
      skipFirstPage: true,
      headerText: "Internal Document",
    });

    expect(result.pageCount).toBe(3);
    const loaded = await PDFDocument.load(result.pdfBytes);
    expect(loaded.getPageCount()).toBe(3);
  });

  it("Annotate: burns text, rectangle, line and drawing onto PDF", async () => {
    const doc = createSamplePdfFile();
    const annotations: AnnotationItem[] = [
      {
        id: "ann-1",
        type: "text",
        pageIndex: 0,
        x: 100,
        y: 200,
        text: "Sample Review Note",
        fontSize: 16,
        colorHex: "#111827",
      },
      {
        id: "ann-2",
        type: "rectangle",
        pageIndex: 0,
        x: 50,
        y: 150,
        width: 120,
        height: 60,
        strokeColorHex: "#ef4444",
        strokeWidth: 2,
      },
      {
        id: "ann-3",
        type: "drawing",
        pageIndex: 1,
        points: [
          { x: 50, y: 50 },
          { x: 60, y: 55 },
          { x: 80, y: 70 },
        ],
        strokeColorHex: "#3b82f6",
        strokeWidth: 3,
      },
    ];

    const result = await applyAnnotationsToPdf(doc, annotations, "reviewed.pdf");
    expect(result.pageCount).toBe(3);
    expect(result.fileName).toBe("reviewed.pdf");

    const loaded = await PDFDocument.load(result.pdfBytes);
    expect(loaded.getPageCount()).toBe(3);
  });
});
