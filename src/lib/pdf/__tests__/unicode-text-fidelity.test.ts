/**
 * Document-language fidelity gates for the local converters.
 *
 * The converters embed the standard PDF fonts, which encode 218 characters
 * (WinAnsi). Everything inside that set must survive conversion untouched —
 * accented Latin text is ordinary content, not an edge case. Characters outside
 * it cannot be drawn with these fonts, so they must be reported rather than
 * quietly swapped for "?".
 */
import { describe, expect, it } from "vitest";
import { zipSync, strToU8 } from "fflate";
import { convertDocxToPdf } from "../operations/docx-to-pdf";
import { convertCsvToPdf } from "../operations/csv-to-pdf";
import { convertMarkdownToPdf } from "../operations/markdown-to-pdf";
import { convertHtmlToPdf } from "../operations/html-to-pdf";
import { convertXlsxToPdf } from "../operations/xlsx-to-pdf";
import { extractPdfText } from "./helpers/pdf-text";

const WINANSI_SAMPLE = "Café résumé naïve Zürich €5 © “quoted” – dash";

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
      <sheets><sheet name="Feuille" sheetId="1" r:id="rId1"/></sheets>
    </workbook>`;
  return zipSync({
    "xl/sharedStrings.xml": strToU8(sst),
    "xl/workbook.xml": strToU8(workbook),
    "xl/worksheets/sheet1.xml": strToU8(sheet),
  });
}

describe("Converter text fidelity", () => {
  it("preserves WinAnsi-encodable text through DOCX conversion", async () => {
    const docx = createMockDocx(`<w:p><w:r><w:t>${WINANSI_SAMPLE}</w:t></w:r></w:p>`);
    const result = await convertDocxToPdf(docx);
    const text = await extractPdfText(result.pdfBytes);

    expect(text).not.toContain("?");
    for (const word of ["Café", "résumé", "naïve", "Zürich", "€5"]) {
      expect(text).toContain(word);
    }
  });

  it("preserves WinAnsi-encodable text through CSV conversion", async () => {
    const csv = "Ville,Coût\nZürich,€120\nMünchen,€95";
    const result = await convertCsvToPdf(csv, "villes.csv");
    const text = await extractPdfText(result.pdfBytes);

    expect(text).toContain("Zürich");
    expect(text).toContain("München");
    expect(text).toContain("Coût");
  });

  it("preserves WinAnsi-encodable text through Markdown conversion", async () => {
    const result = await convertMarkdownToPdf("# Résumé\n\nDéjà vu — naïveté.", "resume.md");
    const text = await extractPdfText(result.pdfBytes);

    expect(text).toContain("Résumé");
    expect(text).toContain("Déjà vu");
  });

  it("reports characters the embedded fonts cannot draw instead of hiding them", async () => {
    const docx = createMockDocx(`<w:p><w:r><w:t>Hello 中文 world</w:t></w:r></w:p>`);
    const result = await convertDocxToPdf(docx);

    expect(result.textFidelity.droppedCharacters).toContain("中");
    expect(result.textFidelity.droppedCharacters).toContain("文");
    expect(result.textFidelity.isLossless).toBe(false);
  });

  it("reports lossless conversion when every character is encodable", async () => {
    const docx = createMockDocx(`<w:p><w:r><w:t>${WINANSI_SAMPLE}</w:t></w:r></w:p>`);
    const result = await convertDocxToPdf(docx);

    expect(result.textFidelity.isLossless).toBe(true);
    expect(result.textFidelity.droppedCharacters).toEqual([]);
  });

  it("approximates Latin letters outside WinAnsi rather than dropping them", async () => {
    // Vietnamese and Polish are Latin-script but largely outside WinAnsi.
    const docx = createMockDocx(`<w:p><w:r><w:t>Łódź Tiếng Việt</w:t></w:r></w:p>`);
    const result = await convertDocxToPdf(docx);
    const text = await extractPdfText(result.pdfBytes);

    expect(text).toContain("Lódz");
    expect(result.textFidelity.approximatedCharacters.length).toBeGreaterThan(0);
  });

  it("preserves WinAnsi-encodable text through HTML conversion", async () => {
    const result = await convertHtmlToPdf("<h1>Übersicht</h1><p>Prix : 12,50 € — déjà payé.</p>");
    const text = await extractPdfText(result.pdfBytes);

    expect(text).toContain("Übersicht");
    expect(text).toContain("déjà payé");
    expect(text).toContain("€");
  });

  it("preserves WinAnsi-encodable text through XLSX conversion", async () => {
    const xlsx = createMockXlsx(["Trimestre", "Chiffre d’affaires", "Bénéfice"]);
    const result = await convertXlsxToPdf(xlsx);
    const text = await extractPdfText(result.pdfBytes);

    expect(text).toContain("Trimestre");
    expect(text).toContain("Bénéfice");
    expect(result.textFidelity.isLossless).toBe(true);
  });

  it("keeps the document's own script in the generated filename", async () => {
    const docx = createMockDocx(
      `<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>Déjà Vu Rapport</w:t></w:r></w:p>`
    );
    const result = await convertDocxToPdf(docx);

    // The previous slug stripped every non-ASCII character, so accented titles
    // collapsed towards "document".
    expect(result.fileName).toContain("déjà");
    expect(result.fileName.endsWith(".pdf")).toBe(true);
  });
});
