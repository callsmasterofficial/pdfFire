/**
 * Pagination gates for the DOCX and HTML converters.
 *
 * Both converters page with a mutable `page` binding plus an `ensure()` helper
 * that swaps in a new page. Any helper that receives `page` as an argument
 * keeps drawing on the page it was handed, so content that crosses a page
 * boundary can end up painted below the bottom of the previous page.
 */
import { describe, expect, it } from "vitest";
import { zipSync, strToU8 } from "fflate";
import { convertDocxToPdf } from "../operations/docx-to-pdf";
import { convertHtmlToPdf } from "../operations/html-to-pdf";
import { extractPdfTextItemsPerPage } from "./helpers/pdf-text";

const PAGE_HEIGHT = 841.89;

/** Long enough that a single paragraph must break across pages. */
const LONG_PARAGRAPH = Array.from({ length: 1600 }, (_, i) => `word${i}`).join(" ");

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

function offPageItems(pages: { y: number }[][]): { y: number }[] {
  return pages.flat().filter((item) => item.y < 0 || item.y > PAGE_HEIGHT);
}

const isFooter = (text: string) => /^Page \d+ of \d+$/.test(text.trim());

/** Body text, i.e. everything that is not the running footer. */
function bodyItems(items: { text: string }[]) {
  return items.filter((item) => !isFooter(item.text) && item.text.trim() !== "");
}

describe("Converter pagination", () => {
  it("keeps DOCX paragraph text inside the page bounds", async () => {
    const docx = createMockDocx(`<w:p><w:r><w:t>${LONG_PARAGRAPH}</w:t></w:r></w:p>`);
    const result = await convertDocxToPdf(docx);
    const pages = await extractPdfTextItemsPerPage(result.pdfBytes);

    expect(result.pageCount).toBeGreaterThan(1);
    expect(offPageItems(pages)).toEqual([]);
  });

  it("continues a long DOCX paragraph onto the next page", async () => {
    const docx = createMockDocx(`<w:p><w:r><w:t>${LONG_PARAGRAPH}</w:t></w:r></w:p>`);
    const result = await convertDocxToPdf(docx);
    const pages = await extractPdfTextItemsPerPage(result.pdfBytes);

    // Page 2 must carry body text, not just the running footer.
    expect(bodyItems(pages[1]).length).toBeGreaterThan(0);
  });

  it("keeps DOCX table rows inside the page bounds", async () => {
    const rows = Array.from(
      { length: 60 },
      (_, i) =>
        `<w:tr><w:tc><w:p><w:r><w:t>Row ${i}</w:t></w:r></w:p></w:tc>` +
        `<w:tc><w:p><w:r><w:t>Value ${i}</w:t></w:r></w:p></w:tc></w:tr>`
    ).join("");
    const docx = createMockDocx(`<w:tbl>${rows}</w:tbl>`);
    const result = await convertDocxToPdf(docx);
    const pages = await extractPdfTextItemsPerPage(result.pdfBytes);

    expect(result.pageCount).toBeGreaterThan(1);
    expect(offPageItems(pages)).toEqual([]);
    expect(bodyItems(pages[1]).length).toBeGreaterThan(0);
  });

  it("keeps HTML table rows inside the page bounds", async () => {
    const rows = Array.from(
      { length: 60 },
      (_, i) => `<tr><td>Row ${i}</td><td>Value ${i}</td></tr>`
    ).join("");
    const result = await convertHtmlToPdf(`<table>${rows}</table>`);
    const pages = await extractPdfTextItemsPerPage(result.pdfBytes);

    expect(result.pageCount).toBeGreaterThan(1);
    expect(offPageItems(pages)).toEqual([]);
    expect(bodyItems(pages[1]).length).toBeGreaterThan(0);
  });
});
