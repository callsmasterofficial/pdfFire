import { describe, expect, it } from "vitest";
import { zipSync, strToU8 } from "fflate";
import { PDFDocument } from "pdf-lib";
import { parseSharedStrings, parseWorksheet, parseXlsxBytes } from "../operations/xlsx-parser";
import { convertXlsxToPdf } from "../operations/xlsx-to-pdf";

function createMockXlsx(): Uint8Array {
  const sharedStringsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
      <si><t>Quarter</t></si>
      <si><t>Revenue</t></si>
      <si><t>Profit</t></si>
      <si><t>Q1</t></si>
      <si><t>Q2</t></si>
    </sst>`;

  const sheet1Xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
      <sheetData>
        <row r="1">
          <c r="A1" t="s"><v>0</v></c>
          <c r="B1" t="s"><v>1</v></c>
          <c r="C1" t="s"><v>2</v></c>
        </row>
        <row r="2">
          <c r="A2" t="s"><v>3</v></c>
          <c r="B2"><v>125000</v></c>
          <c r="C2"><v>45000</v></c>
        </row>
        <row r="3">
          <c r="A3" t="s"><v>4</v></c>
          <c r="B3"><v>180000</v></c>
          <c r="C3"><v>62000</v></c>
        </row>
      </sheetData>
    </worksheet>`;

  const workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
      <sheets>
        <sheet name="Financials" sheetId="1" r:id="rId1"/>
      </sheets>
    </workbook>`;

  return zipSync({
    "xl/sharedStrings.xml": strToU8(sharedStringsXml),
    "xl/workbook.xml": strToU8(workbookXml),
    "xl/worksheets/sheet1.xml": strToU8(sheet1Xml),
  });
}

describe("XLSX to PDF Conversion", () => {
  it("parses shared string tables and worksheet cell grids", () => {
    const mockBytes = createMockXlsx();
    const parsed = parseXlsxBytes(mockBytes);

    expect(parsed.sheetCount).toBe(1);
    expect(parsed.sheets[0].name).toBe("Financials");
    expect(parsed.rowCount).toBe(3);
    expect(parsed.sheets[0].rows[0]).toEqual(["Quarter", "Revenue", "Profit"]);
    expect(parsed.sheets[0].rows[1]).toEqual(["Q1", "125000", "45000"]);
    expect(parsed.sheets[0].rows[2]).toEqual(["Q2", "180000", "62000"]);
  });

  it("handles inline strings and missing cell columns cleanly", () => {
    const ss = parseSharedStrings("<sst><si><t>Hello</t></si></sst>");
    expect(ss).toEqual(["Hello"]);

    const sheetXml = `<worksheet><sheetData>
      <row r="1"><c r="A1"><is><t>Direct text</t></is></c><c r="C1"><v>99</v></c></row>
    </sheetData></worksheet>`;
    const rows = parseWorksheet(sheetXml, []);
    expect(rows[0][0]).toBe("Direct text");
    expect(rows[0][1]).toBe("");
    expect(rows[0][2]).toBe("99");
  });

  it("converts XLSX bytes to a paginated landscape PDF document", async () => {
    const mockBytes = createMockXlsx();
    const result = await convertXlsxToPdf(mockBytes, "Report");

    expect(result.pageCount).toBe(1);
    expect(result.fileName).toBe("financials.pdf");
    expect(result.metrics.sheetCount).toBe(1);
    expect(result.metrics.rowCount).toBe(3);

    const doc = await PDFDocument.load(result.pdfBytes);
    expect(doc.getPageCount()).toBe(1);
    expect(doc.getPage(0).getWidth()).toBeGreaterThan(doc.getPage(0).getHeight()); // Landscape
  });

  it("supports multi-page pagination for large spreadsheets", async () => {
    // Generate sheet with 50 rows
    const rowsXml: string[] = ['<row r="1"><c r="A1"><is><t>Item</t></is></c><c r="B1"><is><t>Cost</t></is></c></row>'];
    for (let i = 2; i <= 60; i++) {
      rowsXml.push(`<row r="${i}"><c r="A${i}"><is><t>SKU-${i}</t></is></c><c r="B${i}"><v>${i * 10}</v></c></row>`);
    }
    const bigSheet = `<worksheet><sheetData>${rowsXml.join("")}</sheetData></worksheet>`;
    const bigXlsx = zipSync({
      "xl/worksheets/sheet1.xml": strToU8(bigSheet),
    });

    const result = await convertXlsxToPdf(bigXlsx, "Big Catalog");
    expect(result.pageCount).toBeGreaterThan(1);
  });
});
