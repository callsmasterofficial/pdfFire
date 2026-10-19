import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { convertCsvToPdf, parseCsv } from "../operations/csv-to-pdf";
import { transformRgbaPixels } from "../operations/invert-colors";

describe("Phase 14: CSV authoring and colour transforms", () => {
  it("parses quoted CSV fields and escaped quotes", () => {
    const table = parseCsv('Name,Note\nAvery,"North, team"\nRiley,"Said ""hello"""');
    expect(table.headers).toEqual(["Name", "Note"]);
    expect(table.rows[0][1]).toBe("North, team");
    expect(table.rows[1][1]).toBe('Said "hello"');
  });
  it("creates a valid multipage landscape table PDF", async () => {
    const rows = Array.from({ length: 60 }, (_, index) => `Person ${index},Engineering,Active`).join("\n");
    const result = await convertCsvToPdf(`Name,Team,Status\n${rows}`, "Roster");
    const doc = await PDFDocument.load(result.pdfBytes);
    expect(result.fileName).toBe("roster.pdf"); expect(result.pageCount).toBeGreaterThan(1); expect(doc.getPageCount()).toBe(result.pageCount);
    expect(doc.getPage(0).getWidth()).toBeGreaterThan(doc.getPage(0).getHeight());
  });
  it("transforms pixels for inversion, sepia, and high contrast", () => {
    const inverse = new Uint8ClampedArray([10, 20, 30, 255]); transformRgbaPixels(inverse, "invert"); expect([...inverse]).toEqual([245, 235, 225, 255]);
    const contrast = new Uint8ClampedArray([30, 30, 30, 255]); transformRgbaPixels(contrast, "high-contrast"); expect([...contrast]).toEqual([0, 0, 0, 255]);
    const sepia = new Uint8ClampedArray([200, 100, 50, 255]); transformRgbaPixels(sepia, "sepia"); expect(sepia[0]).toBeGreaterThan(sepia[2]);
  });
});
