/**
 * Release-gate tests for redaction (project-overview.md: "Covering text with a
 * black shape is not secure redaction").
 *
 * These assert the property the product claims: after redaction the covered
 * text must not be recoverable by an independent reader, nor present in the
 * exported content streams.
 */
import { describe, it, expect } from "vitest";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { applyRedactions } from "../operations/redact";
import {
  extractPdfText,
  extractPdfTextPerPage,
  extractContentStreamStrings,
} from "./helpers/pdf-text";

const SECRET = "SSN 123-45-6789";
const KEPT = "Public summary line";

async function buildDoc(): Promise<{ bytes: Uint8Array; rect: { x: number; y: number; width: number; height: number } }> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([500, 300]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const size = 14;

  page.drawText(SECRET, { x: 60, y: 200, size, font });
  page.drawText(KEPT, { x: 60, y: 120, size, font });

  const width = font.widthOfTextAtSize(SECRET, size);
  return {
    bytes: await doc.save(),
    // Cover the secret line generously, as a user dragging a box would.
    rect: { x: 55, y: 194, width: width + 10, height: size + 8 },
  };
}

describe("Redaction release gate", () => {
  // Guards against a vacuous suite: both detectors must see the secret in an
  // unredacted document, otherwise "not.toContain" proves nothing.
  it("harness detects the secret before redaction", async () => {
    const { bytes } = await buildDoc();
    expect(await extractPdfText(bytes)).toContain("123-45-6789");
    expect(await extractContentStreamStrings(bytes)).toContain("123-45-6789");
  });

  it("removes covered text from independent-reader extraction", async () => {
    const { bytes, rect } = await buildDoc();
    const result = await applyRedactions(bytes, [
      { id: "r1", pageNumber: 1, ...rect, fillColor: "black" },
    ]);

    const text = await extractPdfText(result.pdfBytes);
    expect(text).not.toContain("123-45-6789");
    expect(text).not.toContain(SECRET);
  });

  it("removes covered text from the exported content streams", async () => {
    const { bytes, rect } = await buildDoc();
    const result = await applyRedactions(bytes, [
      { id: "r1", pageNumber: 1, ...rect, fillColor: "black" },
    ]);

    const shown = await extractContentStreamStrings(result.pdfBytes);
    expect(shown).not.toContain("123-45-6789");
  });

  it("preserves text outside the redaction area", async () => {
    const { bytes, rect } = await buildDoc();
    const result = await applyRedactions(bytes, [
      { id: "r1", pageNumber: 1, ...rect, fillColor: "black" },
    ]);

    const text = await extractPdfText(result.pdfBytes);
    expect(text).toContain(KEPT);
  });

  it("reports verified removal and the operators it deleted", async () => {
    const { bytes, rect } = await buildDoc();
    const result = await applyRedactions(bytes, [
      { id: "r1", pageNumber: 1, ...rect, fillColor: "black" },
    ]);

    expect(result.mode).toBe("remove-text");
    expect(result.textRemovalVerified).toBe(true);
    expect(result.removedTextOperations).toBeGreaterThan(0);
  });

  it("cover-only mode leaves text recoverable and does not claim verification", async () => {
    const { bytes, rect } = await buildDoc();
    const result = await applyRedactions(
      bytes,
      [{ id: "r1", pageNumber: 1, ...rect, fillColor: "black" }],
      { mode: "cover-only" }
    );

    // Documents the behaviour so it can never be relabelled as redaction.
    expect(result.textRemovalVerified).toBe(false);
    expect(result.removedTextOperations).toBe(0);
    expect(await extractPdfText(result.pdfBytes)).toContain("123-45-6789");
  });

  it("removes text on the requested page only", async () => {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    for (const marker of ["ALPHA-9001", "BETA-9002"]) {
      const page = doc.addPage([400, 200]);
      page.drawText(marker, { x: 50, y: 100, size: 14, font });
    }
    const bytes = await doc.save();

    const result = await applyRedactions(bytes, [
      { id: "r1", pageNumber: 2, x: 45, y: 94, width: 200, height: 22, fillColor: "black" },
    ]);

    const pages = await extractPdfTextPerPage(result.pdfBytes);
    expect(pages[0]).toContain("ALPHA-9001");
    expect(pages[1]).not.toContain("BETA-9002");
  });
});
