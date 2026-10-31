/**
 * Precision gates for redaction (FM-010).
 *
 * Deletion used to match by content: the covered text was extracted as a
 * string and every occurrence of that string on the page was blanked. Covering
 * one account number therefore removed an identical number elsewhere that the
 * user never covered, and covering a short word removed every instance of it.
 *
 * Removal must follow the rectangles, not the characters that happen to be
 * inside them.
 */
import { describe, expect, it } from "vitest";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { applyRedactions, type RedactionArea } from "../operations/redact";
import { extractPdfText, extractPdfTextPerPage } from "./helpers/pdf-text";

const SIZE = 14;

/** Occurrence count that reads clearly when the answer is zero. */
function countOf(haystack: string, needle: string): number {
  let count = 0;
  let index = haystack.indexOf(needle);
  while (index !== -1) {
    count++;
    index = haystack.indexOf(needle, index + needle.length);
  }
  return count;
}

/** Three lines, where line 1 and line 3 say exactly the same thing. */
async function repeatedTextDoc(): Promise<{
  bytes: Uint8Array;
  firstLine: RedactionArea;
}> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([520, 300]);
  const font = await doc.embedFont(StandardFonts.Helvetica);

  const repeated = "Account 55512345";
  page.drawText(repeated, { x: 50, y: 220, size: SIZE, font });
  page.drawText("Unrelated middle line", { x: 50, y: 170, size: SIZE, font });
  page.drawText(repeated, { x: 50, y: 120, size: SIZE, font });

  const width = font.widthOfTextAtSize(repeated, SIZE);
  return {
    bytes: await doc.save(),
    firstLine: {
      id: "r1",
      pageNumber: 1,
      x: 45,
      y: 214,
      width: width + 10,
      height: SIZE + 8,
      fillColor: "black",
    },
  };
}

describe("Redaction precision", () => {
  it("harness confirms the text appears twice to begin with", async () => {
    const { bytes } = await repeatedTextDoc();
    const text = await extractPdfText(bytes);

    expect(countOf(text, "Account 55512345")).toBe(2);
  });

  it("removes only the covered occurrence, leaving the identical one alone", async () => {
    const { bytes, firstLine } = await repeatedTextDoc();
    const result = await applyRedactions(bytes, [firstLine]);
    const text = await extractPdfText(result.pdfBytes);

    // Exactly one of the two identical lines should survive.
    expect(countOf(text, "Account 55512345")).toBe(1);
    expect(text).toContain("Unrelated middle line");
  });

  it("does not strip a short covered word from the rest of the page", async () => {
    const doc = await PDFDocument.create();
    const page = doc.addPage([520, 300]);
    const font = await doc.embedFont(StandardFonts.Helvetica);
    page.drawText("the secret", { x: 50, y: 220, size: SIZE, font });
    page.drawText("keep the other sentence the same", { x: 50, y: 160, size: SIZE, font });
    const bytes = await doc.save();

    // Cover only the leading word "the" on the first line.
    const theWidth = font.widthOfTextAtSize("the", SIZE);
    const result = await applyRedactions(bytes, [
      { id: "r1", pageNumber: 1, x: 48, y: 214, width: theWidth + 2, height: SIZE + 8, fillColor: "black" },
    ]);
    const text = await extractPdfText(result.pdfBytes);

    // The second line says "the" twice and must survive untouched.
    expect(text).toContain("keep the other sentence the same");
    // The covered word is gone, but the uncovered rest of its own line stays.
    expect(text).toContain("secret");
  });

  it("still removes every occurrence the boxes actually cover", async () => {
    const { bytes, firstLine } = await repeatedTextDoc();
    const result = await applyRedactions(bytes, [
      firstLine,
      { ...firstLine, id: "r2", y: 114 },
    ]);
    const text = await extractPdfText(result.pdfBytes);

    expect(text).not.toContain("Account 55512345");
    expect(text).toContain("Unrelated middle line");
  });

  it("keeps identical text on another page untouched", async () => {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    for (let i = 0; i < 2; i++) {
      const page = doc.addPage([400, 200]);
      page.drawText("Shared marker 9001", { x: 40, y: 120, size: SIZE, font });
    }
    const bytes = await doc.save();
    const width = font.widthOfTextAtSize("Shared marker 9001", SIZE);

    const result = await applyRedactions(bytes, [
      { id: "r1", pageNumber: 1, x: 35, y: 114, width: width + 10, height: SIZE + 8, fillColor: "black" },
    ]);
    const pages = await extractPdfTextPerPage(result.pdfBytes);

    expect(pages[0]).not.toContain("Shared marker 9001");
    expect(pages[1]).toContain("Shared marker 9001");
  });

  it("reports that it matched by position, not by content", async () => {
    const { bytes, firstLine } = await repeatedTextDoc();
    const result = await applyRedactions(bytes, [firstLine]);

    // An empty list means no page needed the content-matching fallback.
    expect(result.contentMatchedPages).toEqual([]);
    expect(result.textRemovalVerified).toBe(true);
  });

  it("keeps the far side of a partly covered line, erring outward at the edges", async () => {
    const doc = await PDFDocument.create();
    const page = doc.addPage([520, 300]);
    const font = await doc.embedFont(StandardFonts.Helvetica);
    page.drawText("Phone 555-0100 and more text after it", { x: 50, y: 200, size: SIZE, font });
    const bytes = await doc.save();

    // Cover only the number, leaving text either side of it.
    const prefix = font.widthOfTextAtSize("Phone ", SIZE);
    const number = font.widthOfTextAtSize("555-0100", SIZE);
    const result = await applyRedactions(bytes, [
      {
        id: "r1",
        pageNumber: 1,
        x: 50 + prefix,
        y: 194,
        width: number,
        height: SIZE + 8,
        fillColor: "black",
      },
    ]);
    const text = await extractPdfText(result.pdfBytes);

    expect(text).not.toContain("555-0100");
    expect(text).toContain("Phone");
    // PDF.js reports one width per run, so which characters a box edge touches
    // is estimated from an average width and can be out by a character or two.
    // Selection rounds outward, so the far side of the line survives while a
    // few characters next to the box may not. See FM-013.
    expect(text).toContain("more text after it");
  });

  it("over-removes at a box edge rather than leaving part of the text", async () => {
    const doc = await PDFDocument.create();
    const page = doc.addPage([520, 300]);
    const font = await doc.embedFont(StandardFonts.Helvetica);
    page.drawText("ID 4471 tail", { x: 50, y: 200, size: SIZE, font });
    const bytes = await doc.save();

    // A box ending in the middle of the digits must still take all of them.
    const prefix = font.widthOfTextAtSize("ID ", SIZE);
    const half = font.widthOfTextAtSize("44", SIZE);
    const result = await applyRedactions(bytes, [
      { id: "r1", pageNumber: 1, x: 50 + prefix, y: 194, width: half, height: SIZE + 8, fillColor: "black" },
    ]);
    const text = await extractPdfText(result.pdfBytes);

    // Partial digits would be worse than none: no fragment of the number is left.
    expect(text).not.toContain("44");
    expect(text).toContain("ID");
  });

  it("leaves no layout shift when the font's metrics are available", async () => {
    const doc = await PDFDocument.create();
    const page = doc.addPage([520, 300]);
    const font = await doc.embedFont(StandardFonts.Helvetica);
    page.drawText("Phone 555-0100 and more text after it", { x: 50, y: 200, size: SIZE, font });
    const bytes = await doc.save();

    const prefix = font.widthOfTextAtSize("Phone ", SIZE);
    const number = font.widthOfTextAtSize("555-0100", SIZE);
    const result = await applyRedactions(bytes, [
      {
        id: "r1",
        pageNumber: 1,
        x: 50 + prefix,
        y: 194,
        width: number,
        height: SIZE + 8,
        fillColor: "black",
      },
    ]);

    // The deleted characters' advance is restored from the font's own widths,
    // so nothing downstream drifts under the box. See FM-013.
    expect(result.shiftedPages).toEqual([]);
    expect(result.textRemovalVerified).toBe(true);
  });
});
