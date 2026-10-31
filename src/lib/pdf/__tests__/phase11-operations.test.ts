import { describe, it, expect } from "vitest";
import { PDFDocument } from "pdf-lib";
import { computeWordDiff, tokenizeWords } from "../operations/diff-algorithm";
import { comparePageTexts } from "../operations/compare";
import { repairPdfDocument } from "../operations/repair";

describe("Phase 11: Document Comparison & Diagnostics", () => {
  describe("Diff Algorithm", () => {
    it("tokenizes sentences and words preserving whitespace", () => {
      const tokens = tokenizeWords("Hello World! 123");
      expect(tokens).toEqual(["Hello", " ", "World", "!", " ", "123"]);
    });

    it("returns identical similarity and zero diffs for matching text", () => {
      const diff = computeWordDiff("This is a confidential agreement.", "This is a confidential agreement.");
      expect(diff.stats.similarityRatio).toBe(1);
      expect(diff.stats.addedCount).toBe(0);
      expect(diff.stats.removedCount).toBe(0);
      expect(diff.tokens).toHaveLength(1);
      expect(diff.tokens[0].type).toBe("unchanged");
    });

    it("detects added and removed words accurately", () => {
      const textA = "The quick brown fox jumps";
      const textB = "The fast brown fox leaps";
      const diff = computeWordDiff(textA, textB);

      expect(diff.stats.removedCount).toBe(2);
      expect(diff.stats.addedCount).toBe(2);
      expect(diff.stats.similarityRatio).toBeLessThan(1);
    });

    it("handles empty or boundary strings gracefully", () => {
      const emptyDiff = computeWordDiff("", "");
      expect(emptyDiff.stats.similarityRatio).toBe(1);

      const oneEmpty = computeWordDiff("Sample text", "");
      expect(oneEmpty.stats.removedCount).toBe(2);
      expect(oneEmpty.stats.addedCount).toBe(0);
    });
  });

  describe("PDF Document Comparison", () => {
    it("compares page texts and computes document diff matrix", () => {
      const pagesA = [
        "Confidential Non-Disclosure Agreement between Party Alpha and Party Beta.",
        "Terms: 12 months duration. Jurisdiction: New York.",
      ];
      const pagesB = [
        "Confidential Non-Disclosure Agreement between Party Alpha and Party Gamma.",
        "Terms: 24 months duration. Jurisdiction: California.",
      ];

      const result = comparePageTexts(pagesA, pagesB, "Contract-v1.pdf", "Contract-v2.pdf");
      expect(result.docA.name).toBe("Contract-v1.pdf");
      expect(result.docB.name).toBe("Contract-v2.pdf");
      expect(result.maxPages).toBe(2);
      expect(result.pages).toHaveLength(2);
      expect(result.changedPagesCount).toBe(2);
      expect(result.totalAddedWords).toBeGreaterThan(0);
      expect(result.totalRemovedWords).toBeGreaterThan(0);
      expect(result.overallSimilarity).toBeGreaterThan(0.5);
    });
  });

  describe("PDF Repair Diagnostics", () => {
    it("repairs damaged header with leading junk bytes", async () => {
      const sampleDoc = await PDFDocument.create();
      sampleDoc.addPage([400, 600]);
      const validBytes = await sampleDoc.save();

      const junk = new TextEncoder().encode("HTTP/1.1 200 OK\r\nServer: nginx\r\n\r\n");
      const corruptedBytes = new Uint8Array(junk.length + validBytes.length);
      corruptedBytes.set(junk, 0);
      corruptedBytes.set(validBytes, junk.length);

      const { diagnostics, pdfBytes } = await repairPdfDocument(corruptedBytes);
      expect(diagnostics.headerRepaired).toBe(true);
      expect(diagnostics.pagesRecovered).toBe(1);
      expect(diagnostics.repairedSizeBytes).toBeGreaterThan(0);

      const verified = await PDFDocument.load(pdfBytes);
      expect(verified.getPageCount()).toBe(1);
    });

    it("repairs truncated trailer missing %%EOF terminator", async () => {
      const sampleDoc = await PDFDocument.create();
      sampleDoc.addPage([500, 700]);
      sampleDoc.addPage([500, 700]);
      const validBytes = await sampleDoc.save();

      // Find %%EOF and slice right before it to truncate the trailer
      let eofIndex = -1;
      for (let i = validBytes.length - 10; i >= 0; i--) {
        if (
          validBytes[i] === 0x25 &&
          validBytes[i + 1] === 0x25 &&
          validBytes[i + 2] === 0x45 &&
          validBytes[i + 3] === 0x4f &&
          validBytes[i + 4] === 0x46
        ) {
          eofIndex = i;
          break;
        }
      }

      const corruptedBytes = eofIndex > 0 ? validBytes.slice(0, eofIndex) : validBytes.slice(0, -6);

      const { diagnostics, pdfBytes } = await repairPdfDocument(corruptedBytes);
      expect(diagnostics.eofRepaired).toBe(true);
      expect(diagnostics.pagesRecovered).toBe(2);

      const verified = await PDFDocument.load(pdfBytes);
      expect(verified.getPageCount()).toBe(2);
    });

    it("reserialises a valid document without claiming it was broken", async () => {
      const sampleDoc = await PDFDocument.create();
      sampleDoc.addPage([300, 300]);
      const validBytes = await sampleDoc.save();

      const { diagnostics, pdfBytes } = await repairPdfDocument(validBytes);
      // This previously asserted xrefRebuilt === true for a healthy file,
      // which is what made the diagnostic report meaningless: every document
      // was told its cross-reference table had been rebuilt. See FM-009.
      expect(diagnostics.xrefRebuilt).toBe(false);
      expect(diagnostics.recoverySucceeded).toBe(true);
      expect(diagnostics.pagesRecovered).toBe(1);
      expect(pdfBytes.length).toBeGreaterThan(100);
    });
  });
});
