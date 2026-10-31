/**
 * Table cell fidelity gates (FM-008).
 *
 * The four table renderers clipped cell text at a fixed character count and
 * appended "...". Anything longer was simply gone from the output, with no
 * warning anywhere — unlike the font-coverage loss, which is reported.
 *
 * Cells should wrap to fit their column. Where a cell genuinely cannot fit,
 * the loss has to be reported rather than hidden.
 */
import { describe, expect, it } from "vitest";
import { zipSync, strToU8 } from "fflate";
import { convertDocxToPdf } from "../operations/docx-to-pdf";
import { convertHtmlToPdf } from "../operations/html-to-pdf";
import { convertXlsxToPdf } from "../operations/xlsx-to-pdf";
import { convertCsvToPdf } from "../operations/csv-to-pdf";
import { extractPdfText } from "./helpers/pdf-text";

/** Comfortably past every old character limit (22, 25, 26, 31). */
const LONG_CELL =
  "Quarterly revenue recognised across the EMEA reporting entities";

function createMockDocx(bodyXml: string): Uint8Array {
  const xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
      <w:body>${bodyXml}</w:body>
    </w:document>`;
  return zipSync({
    "word/document.xml": strToU8(xml),
    "[Content_Types].xml": strToU8('<?xml version="1.0" encoding="UTF-8"?><Types></Types>'),
  });
}

function createMockXlsx(values: string[]): Uint8Array {
  const sst = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
      ${values.map((value) => `<si><t>${value}</t></si>`).join("")}
    </sst>`;
  const sheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
      <sheetData><row r="1">${values
        .map((_v, i) => `<c r="${String.fromCharCode(65 + i)}1" t="s"><v>${i}</v></c>`)
        .join("")}</row></sheetData>
    </worksheet>`;
  const workbook = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
      <sheets><sheet name="Sheet1" sheetId="1" r:id="rId1"/></sheets>
    </workbook>`;
  return zipSync({
    "xl/sharedStrings.xml": strToU8(sst),
    "xl/workbook.xml": strToU8(workbook),
    "xl/worksheets/sheet1.xml": strToU8(sheet),
  });
}

/** Extracted text with wrapping whitespace collapsed, for word checks. */
function normalise(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

describe("Table cell fidelity", () => {
  it("keeps long DOCX table cells in the output", async () => {
    const docx = createMockDocx(
      `<w:tbl><w:tr><w:tc><w:p><w:r><w:t>${LONG_CELL}</w:t></w:r></w:p></w:tc></w:tr></w:tbl>`
    );
    const result = await convertDocxToPdf(docx);
    const text = normalise(await extractPdfText(result.pdfBytes));

    expect(text).toContain("reporting entities");
    expect(text).not.toContain("...");
  });

  it("keeps long HTML table cells in the output", async () => {
    const result = await convertHtmlToPdf(`<table><tr><td>${LONG_CELL}</td></tr></table>`);
    const text = normalise(await extractPdfText(result.pdfBytes));

    expect(text).toContain("reporting entities");
    expect(text).not.toContain("...");
  });

  it("keeps long XLSX cells in the output", async () => {
    const result = await convertXlsxToPdf(createMockXlsx([LONG_CELL]));
    const text = normalise(await extractPdfText(result.pdfBytes));

    expect(text).toContain("reporting entities");
    expect(text).not.toContain("...");
  });

  it("keeps long CSV cells in the output", async () => {
    const result = await convertCsvToPdf(`Description\n"${LONG_CELL}"`);
    const text = normalise(await extractPdfText(result.pdfBytes));

    expect(text).toContain("reporting entities");
    expect(text).not.toContain("...");
  });

  it("reports truncation when a cell genuinely cannot fit", async () => {
    // One unbreakable token far wider than any column.
    const giant = "X".repeat(4000);
    const result = await convertCsvToPdf(`Code\n${giant}`);

    expect(result.tableFidelity.truncatedCells).toBeGreaterThan(0);
  });

  it("reports no truncation when everything fits", async () => {
    const result = await convertCsvToPdf("City,Cost\nZurich,120\nMunich,95");

    expect(result.tableFidelity.truncatedCells).toBe(0);
  });
});
