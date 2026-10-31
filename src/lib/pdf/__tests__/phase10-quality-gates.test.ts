import { describe, it, expect } from "vitest";
import { PDFDocument, PageSizes } from "pdf-lib";
import { validatePdfFile } from "../validator";
import {
  rotatePdfDocument,
  reorderPdfPages,
  updatePdfMetadata,
  readPdfMetadata,
  addPageNumbersToPdf,
} from "../operations";
import { summarizeDocumentText, askDocumentQuestion } from "../../ai";

describe("Phase 10: Release Readiness & Quality Gates", () => {
  it("rejects zero-length and corrupt non-PDF files", async () => {
    const emptyFile = new File([], "empty.pdf", { type: "application/pdf" });
    const emptyResult = await validatePdfFile(emptyFile);
    expect(emptyResult.valid).toBe(false);

    const corruptBytes = new Uint8Array([0x00, 0x11, 0x22, 0x33, 0x44]);
    const corruptFile = new File([corruptBytes], "corrupt.pdf", {
      type: "application/pdf",
    });
    const corruptResult = await validatePdfFile(corruptFile);
    expect(corruptResult.valid).toBe(false);
  });

  it("handles mixed orientation and custom dimensions in multi-page documents", async () => {
    const doc = await PDFDocument.create();
    // Page 1: Portrait A4
    doc.addPage(PageSizes.A4);
    // Page 2: Landscape Letter
    doc.addPage([PageSizes.Letter[1], PageSizes.Letter[0]]);
    // Page 3: Custom square banner
    doc.addPage([300, 300]);
    const bytes = await doc.save();
    const testFile = new File([bytes.buffer as ArrayBuffer], "mixed.pdf", {
      type: "application/pdf",
    });

    // Rotate page 2 by 90 degrees
    const rotated = await rotatePdfDocument(testFile, {
      angleDegrees: 90,
      pages: [2],
    });
    const rotatedDoc = await PDFDocument.load(rotated.pdfBytes);
    expect(rotatedDoc.getPageCount()).toBe(3);
    expect(rotatedDoc.getPage(1).getRotation().angle).toBe(90);

    // Apply page numbering across mixed dimensions
    const numbered = await addPageNumbersToPdf(testFile, {
      position: "bottom-center",
      format: "page-of-total",
      fontSize: 10,
      margin: 20,
    });
    const numberedDoc = await PDFDocument.load(numbered.pdfBytes);
    expect(numberedDoc.getPageCount()).toBe(3);
  });

  it("handles Unicode, emoji, and special characters across metadata and text", async () => {
    const doc = await PDFDocument.create();
    doc.addPage();
    const bytes = await doc.save();
    const file = new File([bytes.buffer as ArrayBuffer], "unicode.pdf", {
      type: "application/pdf",
    });

    const titleWithSpecialChars = "FileMelo ™ — Über & Accents «100%» 🚀";
    const updated = await updatePdfMetadata(file, {
      title: titleWithSpecialChars,
      author: "René François — 小明",
      subject: "Testing UTF-8 chars & symbols: © § ¶ 漢字",
    });

    const meta = await readPdfMetadata(updated.pdfBytes);
    expect(meta.title).toBe(titleWithSpecialChars);
    expect(meta.author).toBe("René François — 小明");
  });

  it("safely handles boundary edge cases in reordering and deletion", async () => {
    const doc = await PDFDocument.create();
    doc.addPage();
    doc.addPage();
    doc.addPage();
    const bytes = await doc.save();
    const file = new File([bytes.buffer as ArrayBuffer], "boundary.pdf", {
      type: "application/pdf",
    });

    // Reorder: reverse 3-page document (3, 2, 1)
    const reversed = await reorderPdfPages(file, { pageOrder: [3, 2, 1] });
    const revDoc = await PDFDocument.load(reversed.pdfBytes);
    expect(revDoc.getPageCount()).toBe(3);

    // Keep only single middle page (page 2)
    const single = await reorderPdfPages(file, { pageOrder: [2] });
    const singleDoc = await PDFDocument.load(single.pdfBytes);
    expect(singleDoc.getPageCount()).toBe(1);
  });

  it("handles text extraction and AI operations with unusual whitespace and punctuation", async () => {
    const unusualText = `
      --- SECTION 1 ---
      Invoice Number: #INV-2026-999!!!   Amount Due: $1,450.00.
      Contact: support.desk+urgent@filemelo.internal.
      
      --- SECTION 2 ---
      Terms: Net 30 days... All rights reserved (C) 2026.
      Please submit remittances before 2026-11-15.
    `;

    const summary = summarizeDocumentText(unusualText, "Invoice", 2);
    expect(summary.keyTakeaways.length).toBeGreaterThan(0);
    expect(summary.wordCount).toBeGreaterThan(0);
    expect(summary.entities.length).toBeGreaterThan(0);

    const qa = askDocumentQuestion("What is the invoice amount due?", [
      {
        pageNumber: 1,
        text: unusualText,
        characterCount: unusualText.length,
      },
    ]);
    expect(qa.confidence).toBeGreaterThan(0);
    expect(qa.answer).toContain("1,450.00");
  });
});
