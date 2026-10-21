import { describe, expect, it } from "vitest";
import { zipSync, strToU8 } from "fflate";
import { PDFDocument } from "pdf-lib";
import { parseDocxXml, parseDocxBytes } from "../operations/docx-parser";
import { convertDocxToPdf } from "../operations/docx-to-pdf";

function createMockDocx(xmlContent: string): Uint8Array {
  return zipSync({
    "word/document.xml": strToU8(xmlContent),
    "[Content_Types].xml": strToU8('<?xml version="1.0" encoding="UTF-8"?><Types></Types>'),
  });
}

describe("DOCX to PDF Conversion", () => {
  const sampleXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
      <w:body>
        <w:p>
          <w:pPr><w:pStyle w:val="Heading1"/></w:pPr>
          <w:r><w:t>Quarterly Engineering Report</w:t></w:r>
        </w:p>
        <w:p>
          <w:r><w:t>This is an introductory paragraph with </w:t></w:r>
          <w:r><w:rPr><w:b/></w:rPr><w:t>bold text</w:t></w:r>
          <w:r><w:t> and </w:t></w:r>
          <w:r><w:rPr><w:i/></w:rPr><w:t>italic text</w:t></w:r>
          <w:r><w:t>.</w:t></w:r>
        </w:p>
        <w:p>
          <w:pPr><w:numPr><w:ilvl w:val="0"/></w:numPr></w:pPr>
          <w:r><w:t>First bullet item</w:t></w:r>
        </w:p>
        <w:p>
          <w:pPr><w:numPr><w:ilvl w:val="0"/></w:numPr></w:pPr>
          <w:r><w:t>Second bullet item</w:t></w:r>
        </w:p>
        <w:tbl>
          <w:tr>
            <w:tc><w:p><w:r><w:t>Metric</w:t></w:r></w:p></w:tc>
            <w:tc><w:p><w:r><w:t>Value</w:t></w:r></w:p></w:tc>
          </w:tr>
          <w:tr>
            <w:tc><w:p><w:r><w:t>Pass Rate</w:t></w:r></w:p></w:tc>
            <w:tc><w:p><w:r><w:t>99.9%</w:t></w:r></w:p></w:tc>
          </w:tr>
        </w:tbl>
      </w:body>
    </w:document>`;

  it("parses headings, paragraphs, styled runs, bullets, and tables from Word XML", () => {
    const parsed = parseDocxXml(sampleXml);
    expect(parsed.title).toBe("Quarterly Engineering Report");
    expect(parsed.paragraphCount).toBe(4);
    expect(parsed.wordCount).toBeGreaterThan(10);
    expect(parsed.tableCount).toBe(1);

    expect(parsed.blocks[0].type).toBe("heading");
    expect(parsed.blocks[0].text).toBe("Quarterly Engineering Report");

    expect(parsed.blocks[1].type).toBe("paragraph");
    expect(parsed.blocks[1].runs.some((r) => r.bold)).toBe(true);
    expect(parsed.blocks[1].runs.some((r) => r.italic)).toBe(true);

    expect(parsed.blocks[2].type).toBe("bullet");
    expect(parsed.blocks[3].type).toBe("bullet");

    expect(parsed.blocks[4].type).toBe("table");
    expect(parsed.blocks[4].tableRows).toHaveLength(2);
    expect(parsed.blocks[4].tableRows?.[0]).toEqual(["Metric", "Value"]);
    expect(parsed.blocks[4].tableRows?.[1]).toEqual(["Pass Rate", "99.9%"]);
  });

  it("parses binary DOCX bytes through zip decompression", () => {
    const docxBytes = createMockDocx(sampleXml);
    const parsed = parseDocxBytes(docxBytes);
    expect(parsed.title).toBe("Quarterly Engineering Report");
    expect(parsed.blocks.length).toBe(5);
  });

  it("throws a descriptive error when word/document.xml is missing", () => {
    const invalidZip = zipSync({ "other.txt": strToU8("hello") });
    expect(() => parseDocxBytes(invalidZip)).toThrow("Invalid Word document: missing word/document.xml");
  });

  it("generates a clean vector PDF document from DOCX bytes", async () => {
    const docxBytes = createMockDocx(sampleXml);
    const result = await convertDocxToPdf(docxBytes, "Fallback Title");

    expect(result.pageCount).toBe(1);
    expect(result.fileName).toBe("quarterly-engineering-report.pdf");
    expect(result.metrics.paragraphCount).toBe(4);
    expect(result.metrics.tableCount).toBe(1);

    const doc = await PDFDocument.load(result.pdfBytes);
    expect(doc.getPageCount()).toBe(1);
    expect(doc.getTitle()).toBe("Quarterly Engineering Report");
  });

  it("handles explicit page breaks and multi-page documents", async () => {
    const multiPageXml = `<?xml version="1.0" encoding="UTF-8"?>
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body>
          <w:p><w:r><w:t>Page 1 content</w:t></w:r></w:p>
          <w:p><w:r><w:br w:type="page"/></w:r></w:p>
          <w:p><w:r><w:t>Page 2 content</w:t></w:r></w:p>
        </w:body>
      </w:document>`;
    const docxBytes = createMockDocx(multiPageXml);
    const result = await convertDocxToPdf(docxBytes);
    expect(result.pageCount).toBe(2);
  });
});
