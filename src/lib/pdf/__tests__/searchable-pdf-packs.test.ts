/**
 * The OCR text layer must hold the scanned language and stay invisible.
 *
 * Both halves matter. If the layer cannot represent Chinese, OCR of a Chinese
 * scan produces nothing searchable. If it stops being invisible, the overlay
 * prints on top of the page image and ruins the document — which is exactly
 * what happened once while migrating this to the language packs.
 */
import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { createSearchablePdf } from "../operations/searchable-pdf";
import { extractPdfText, decodeContentStreams } from "./helpers/pdf-text";
import type { OcrDocumentResult } from "../../ocr/ocr-types";

async function scanLikePdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.addPage([400, 300]);
  return doc.save();
}

function ocrResult(text: string): OcrDocumentResult {
  return {
    fullText: text,
    pages: [{ pageNumber: 1, text, confidence: 90 }],
    averageConfidence: 90,
    language: "eng",
    processingTimeMs: 1,
  } as OcrDocumentResult;
}

describe("Searchable OCR layer", () => {
  it("makes a Chinese scan searchable", async () => {
    const result = await createSearchablePdf(await scanLikePdf(), ocrResult("发票 金额 1200"));
    const text = await extractPdfText(result.pdfBytes);

    expect(text).toContain("发票");
    expect(text).toContain("金额");
  });

  it("keeps the layer invisible", async () => {
    const result = await createSearchablePdf(await scanLikePdf(), ocrResult("发票 金额"));
    const streams = await decodeContentStreams(result.pdfBytes);

    // pdf-lib expresses opacity through a graphics state, so the text must be
    // drawn under one rather than painted straight onto the page.
    // Checked on the decoded stream, not the raw bytes: content streams are
    // Flate-compressed on save, so grepping the file for the operator or for
    // "/ca 0" finds nothing even when both are present.
    expect(streams).toMatch(/\/GS[-\d]*\s+gs/);
  });

  it("still handles Latin OCR text", async () => {
    const result = await createSearchablePdf(await scanLikePdf(), ocrResult("Invoice total 1200"));

    expect(await extractPdfText(result.pdfBytes)).toContain("Invoice total");
  });
});
