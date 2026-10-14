import { describe, it, expect } from "vitest";
import { PDFDocument } from "pdf-lib";
import { createSamplePdfFile } from "../test-fixtures";
import { mergePdfFiles } from "../operations/merge";
import { rotatePdfDocument } from "../operations/rotate";
import { extractPdfPages } from "../operations/extract";
import { splitPdfDocument, parsePageRanges } from "../operations/split";
import { reorderPdfPages } from "../operations/reorder";
import { createZipArchive } from "../download";

describe("Phase 3 PDF Operations", () => {
  it("Merge PDF: combines two 3-page PDFs into a 6-page PDF", async () => {
    const doc1 = createSamplePdfFile("doc1.pdf");
    const doc2 = createSamplePdfFile("doc2.pdf");

    const result = await mergePdfFiles([doc1, doc2], "merged.pdf");
    expect(result.pageCount).toBe(6);
    expect(result.fileName).toBe("merged.pdf");

    const loaded = await PDFDocument.load(result.pdfBytes);
    expect(loaded.getPageCount()).toBe(6);
  });

  it("Rotate PDF: rotates pages by 90 degrees", async () => {
    const doc = createSamplePdfFile();
    const result = await rotatePdfDocument(doc, { angleDegrees: 90 });
    expect(result.pageCount).toBe(3);

    const loaded = await PDFDocument.load(result.pdfBytes);
    expect(loaded.getPage(0).getRotation().angle).toBe(90);
    expect(loaded.getPage(1).getRotation().angle).toBe(90);
  });

  it("Extract Pages: extracts specific pages 1 and 3 into a 2-page PDF", async () => {
    const doc = createSamplePdfFile();
    const result = await extractPdfPages(doc, { pageNumbers: [1, 3] });
    expect(result.pageCount).toBe(2);

    const loaded = await PDFDocument.load(result.pdfBytes);
    expect(loaded.getPageCount()).toBe(2);
  });

  it("Split PDF: splits by ranges and every-page mode", async () => {
    const doc = createSamplePdfFile(); // 3 pages

    // Range test: "1", "2-3"
    const rangeOutputs = await splitPdfDocument(doc, {
      mode: "ranges",
      rangesString: "1, 2-3",
    });
    expect(rangeOutputs.length).toBe(2);
    expect(rangeOutputs[0].pageCount).toBe(1);
    expect(rangeOutputs[1].pageCount).toBe(2);

    // Every page test
    const everyPageOutputs = await splitPdfDocument(doc, {
      mode: "every-page",
    });
    expect(everyPageOutputs.length).toBe(3);
    expect(everyPageOutputs[0].pageCount).toBe(1);
    expect(everyPageOutputs[1].pageCount).toBe(1);
    expect(everyPageOutputs[2].pageCount).toBe(1);
  });

  it("parsePageRanges: correctly parses comma-separated ranges and handles errors", () => {
    expect(parsePageRanges("1, 2-3", 3)).toEqual([[1], [2, 3]]);
    expect(parsePageRanges("1-3", 3)).toEqual([[1, 2, 3]]);
    expect(() => parsePageRanges("4", 3)).toThrow("Invalid page number");
    expect(() => parsePageRanges("3-1", 3)).toThrow("Invalid range");
  });

  it("Reorder Pages: reorders and deletes pages [3, 1]", async () => {
    const doc = createSamplePdfFile(); // 3 pages
    const result = await reorderPdfPages(doc, { pageOrder: [3, 1] });
    expect(result.pageCount).toBe(2);

    const loaded = await PDFDocument.load(result.pdfBytes);
    expect(loaded.getPageCount()).toBe(2);
  });

  it("createZipArchive: bundles multiple files into valid zip archive", () => {
    const file1 = { name: "test1.txt", data: new Uint8Array([65, 66, 67]) };
    const file2 = { name: "test2.txt", data: new Uint8Array([68, 69, 70]) };

    const zip = createZipArchive([file1, file2]);
    expect(zip).toBeInstanceOf(Uint8Array);
    expect(zip.byteLength).toBeGreaterThan(0);
    // Standard ZIP signature (PK\x03\x04)
    expect(zip[0]).toBe(0x50);
    expect(zip[1]).toBe(0x4b);
  });
});
