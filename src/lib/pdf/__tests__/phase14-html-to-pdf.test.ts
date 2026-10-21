import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { parseHtml } from "../operations/html-parser";
import { convertHtmlToPdf } from "../operations/html-to-pdf";

describe("HTML to PDF Conversion", () => {
  const sampleHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Engineering Whitepaper</title>
        <style>body { font-family: sans-serif; }</style>
        <script>console.log("ignore me");</script>
      </head>
      <body>
        <h1>Architecture Overview</h1>
        <p>This is a paragraph explaining <strong>client-side</strong> operations with &amp; entity decoding.</p>
        <blockquote>Privacy is not an add-on; it is our core architecture.</blockquote>
        <h2>Key Modules</h2>
        <ul>
          <li>OpenXML Parser</li>
          <li>Vector Layout Engine</li>
        </ul>
        <h3>Metrics Table</h3>
        <table>
          <tr><th>Module</th><th>Size</th></tr>
          <tr><td>Parser</td><td>12 KB</td></tr>
          <tr><td>Engine</td><td>18 KB</td></tr>
        </table>
        <pre><code>const localOnly = true;</code></pre>
        <hr />
      </body>
    </html>
  `;

  it("parses headings, paragraphs, lists, tables, and code while stripping scripts", () => {
    const parsed = parseHtml(sampleHtml);
    expect(parsed.title).toBe("Engineering Whitepaper");
    expect(parsed.tableCount).toBe(1);
    expect(parsed.wordCount).toBeGreaterThan(15);

    const kinds = parsed.blocks.map((b) => b.kind);
    expect(kinds).toContain("heading");
    expect(kinds).toContain("paragraph");
    expect(kinds).toContain("quote");
    expect(kinds).toContain("bullet");
    expect(kinds).toContain("table");
    expect(kinds).toContain("code");
    expect(kinds).toContain("rule");

    const tableBlock = parsed.blocks.find((b) => b.kind === "table");
    expect(tableBlock?.tableRows).toEqual([
      ["Module", "Size"],
      ["Parser", "12 KB"],
      ["Engine", "18 KB"],
    ]);
  });

  it("converts HTML into a valid vector PDF document", async () => {
    const result = await convertHtmlToPdf(sampleHtml, "Fallback Title");
    expect(result.pageCount).toBe(1);
    expect(result.fileName).toBe("engineering-whitepaper.pdf");
    expect(result.metrics.tableCount).toBe(1);

    const doc = await PDFDocument.load(result.pdfBytes);
    expect(doc.getPageCount()).toBe(1);
    expect(doc.getTitle()).toBe("Engineering Whitepaper");
  });

  it("handles large HTML documents with multi-page pagination", async () => {
    const paragraphs = Array.from(
      { length: 50 },
      (_, i) => `<p>Paragraph ${i + 1}: Continuous vector content rendered safely inside browser memory without uploading to any external server.</p>`
    ).join("\n");

    const bigHtml = `<html><body><h1>Large Document</h1>${paragraphs}</body></html>`;
    const result = await convertHtmlToPdf(bigHtml);

    expect(result.pageCount).toBeGreaterThan(1);
    const doc = await PDFDocument.load(result.pdfBytes);
    expect(doc.getPageCount()).toBe(result.pageCount);
  });
});
