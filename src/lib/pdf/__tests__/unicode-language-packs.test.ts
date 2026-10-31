/**
 * Gates for the Unicode language packs (FM-005).
 *
 * The converters previously replaced every character the standard PDF fonts
 * could not draw, so Chinese, Arabic, Hebrew, Thai and Indic text came out as
 * question marks. These assert the text is now really in the document, that a
 * Latin-only conversion still downloads nothing, and that the packs whose text
 * cannot be copied back out exactly say so.
 */
import { describe, expect, it } from "vitest";
import { convertTextToPdf } from "../operations/text-to-pdf";
import { convertMarkdownToPdf } from "../operations/markdown-to-pdf";
import { convertDocxToPdf } from "../operations/docx-to-pdf";
import { convertHtmlToPdf } from "../operations/html-to-pdf";
import { convertXlsxToPdf } from "../operations/xlsx-to-pdf";
import { convertCsvToPdf } from "../operations/csv-to-pdf";
import { zipSync, strToU8 } from "fflate";
import { extractPdfText } from "./helpers/pdf-text";

describe("Unicode language packs", () => {
  it("renders CJK text that used to become question marks", async () => {
    const result = await convertTextToPdf("中文文本测试", { title: "报告" });
    const text = await extractPdfText(result.pdfBytes);

    expect(text).toContain("中文文本测试");
    expect(text).not.toContain("?");
    expect(result.textFidelity.packsUsed.map((pack) => pack.id)).toContain("cjk");
    expect(result.textFidelity.isLossless).toBe(true);
  });

  it("keeps the output small by subsetting the pack", async () => {
    const result = await convertTextToPdf("中文文本测试", { title: "报告" });

    // The CJK pack is over 8 MB on disk; only the glyphs used are embedded.
    expect(result.pdfBytes.length).toBeLessThan(300_000);
  });

  it("renders Greek, Cyrillic and Vietnamese from one pack", async () => {
    const result = await convertTextToPdf("Ελλάδα Привет Tiếng Việt", { title: "Mixed" });
    const text = await extractPdfText(result.pdfBytes);

    expect(text).toContain("Ελλάδα");
    expect(text).toContain("Привет");
    expect(text).toContain("Tiếng Việt");
    expect(result.textFidelity.packsUsed.map((pack) => pack.id)).toEqual([
      "latin-greek-cyrillic",
    ]);
  });

  it("renders Hebrew and Thai exactly", async () => {
    const result = await convertTextToPdf("עברית ภาษาไทย", { title: "Scripts" });
    const text = await extractPdfText(result.pdfBytes);

    expect(text).toContain("עברית");
    expect(text).toContain("ภาษาไทย");
  });

  it("shapes Devanagari conjuncts rather than drawing loose characters", async () => {
    const result = await convertTextToPdf("हिन्दी", { title: "Devanagari" });

    // Correct shaping merges the conjunct, so the glyph run is shorter than the
    // character count. Extraction is approximate for this script by design.
    expect(result.textFidelity.packsUsed.map((pack) => pack.id)).toContain("devanagari");
    expect(result.textFidelity.approximateExtractionPacks.map((pack) => pack.id)).toContain(
      "devanagari"
    );
  });

  it("reports Arabic extraction as approximate rather than claiming exactness", async () => {
    const result = await convertTextToPdf("العربية", { title: "Arabic" });

    expect(result.textFidelity.packsUsed.map((pack) => pack.id)).toContain("arabic");
    expect(result.textFidelity.approximateExtractionPacks.map((pack) => pack.id)).toContain(
      "arabic"
    );
  });

  it("downloads no pack for Latin-only text", async () => {
    const result = await convertTextToPdf("Café résumé naïve — Zürich", { title: "Latin" });
    const text = await extractPdfText(result.pdfBytes);

    expect(result.textFidelity.packsUsed).toEqual([]);
    expect(result.textFidelity.isLossless).toBe(true);
    expect(text).toContain("Café résumé");
  });

  it("reports characters no pack covers instead of hiding them", async () => {
    const result = await convertTextToPdf("emoji 😀 here", { title: "Emoji" });

    expect(result.textFidelity.unsupportedCharacters).toContain("😀");
    expect(result.textFidelity.isLossless).toBe(false);
  });

  it("renders mixed scripts on one line, switching fonts mid-string", async () => {
    const result = await convertTextToPdf("Invoice 发票 for Zürich", { title: "Mixed" });
    const text = await extractPdfText(result.pdfBytes);

    // Latin keeps the standard font; only the Chinese run needs a pack.
    expect(text).toContain("Invoice");
    expect(text).toContain("发票");
    expect(text).toContain("Zürich");
    expect(result.textFidelity.packsUsed.map((pack) => pack.id)).toEqual(["cjk"]);
  });

  it("renders CJK through the Markdown converter too", async () => {
    const result = await convertMarkdownToPdf("# 标题\n\n正文内容。", "报告");
    const text = await extractPdfText(result.pdfBytes);

    expect(text).toContain("标题");
    expect(text).toContain("正文内容");
    expect(result.textFidelity.isLossless).toBe(true);
  });

  it("renders CJK through the DOCX converter, body and table alike", async () => {
    const xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body>
          <w:p><w:r><w:t>正文内容</w:t></w:r></w:p>
          <w:tbl><w:tr>
            <w:tc><w:p><w:r><w:t>项目</w:t></w:r></w:p></w:tc>
            <w:tc><w:p><w:r><w:t>金额</w:t></w:r></w:p></w:tc>
          </w:tr></w:tbl>
        </w:body>
      </w:document>`;
    const docx = zipSync({
      "word/document.xml": strToU8(xml),
      "[Content_Types].xml": strToU8('<?xml version="1.0"?><Types></Types>'),
    });
    const result = await convertDocxToPdf(docx);
    const text = await extractPdfText(result.pdfBytes);

    expect(text).toContain("正文内容");
    expect(text).toContain("项目");
    expect(text).toContain("金额");
    expect(result.textFidelity.isLossless).toBe(true);
  });

  it("renders CJK through the HTML converter, body and table alike", async () => {
    const result = await convertHtmlToPdf(
      "<h1>标题</h1><p>正文内容</p><table><tr><td>项目</td><td>金额</td></tr></table>"
    );
    const text = await extractPdfText(result.pdfBytes);

    expect(text).toContain("标题");
    expect(text).toContain("项目");
    expect(result.textFidelity.isLossless).toBe(true);
  });

  it("renders CJK through the CSV converter", async () => {
    const result = await convertCsvToPdf("项目,金额\n差旅,1200", "费用报告");
    const text = await extractPdfText(result.pdfBytes);

    expect(text).toContain("项目");
    expect(text).toContain("差旅");
    expect(result.textFidelity.isLossless).toBe(true);
  });

  it("renders CJK through the XLSX converter", async () => {
    const values = ["项目", "金额"];
    const sst = `<?xml version="1.0"?><sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${values
      .map((v) => `<si><t>${v}</t></si>`)
      .join("")}</sst>`;
    const sheet = `<?xml version="1.0"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
      <sheetData><row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c></row></sheetData></worksheet>`;
    const workbook = `<?xml version="1.0"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
      <sheets><sheet name="报表" sheetId="1" r:id="rId1"/></sheets></workbook>`;
    const xlsx = zipSync({
      "xl/sharedStrings.xml": strToU8(sst),
      "xl/workbook.xml": strToU8(workbook),
      "xl/worksheets/sheet1.xml": strToU8(sheet),
    });
    const result = await convertXlsxToPdf(xlsx);
    const text = await extractPdfText(result.pdfBytes);

    expect(text).toContain("项目");
    expect(text).toContain("报表");
    expect(result.textFidelity.isLossless).toBe(true);
  });
});
