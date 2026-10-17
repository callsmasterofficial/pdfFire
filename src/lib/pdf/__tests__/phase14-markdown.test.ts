import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { convertMarkdownToPdf } from "../operations/markdown-to-pdf";
import { parseMarkdown } from "../operations/markdown-parser";

describe("Phase 14: Markdown to PDF", () => {
  it("parses headings, list items, code, and inline Markdown", () => {
    const blocks = parseMarkdown("# Title\n\n- **Bold** item\n\n```\nconst x = 1;\n```");
    expect(blocks.map((block) => block.kind)).toEqual(["heading", "bullet", "code"]);
    expect(blocks[1].text).toBe("Bold item");
  });

  it("creates a paginated PDF with safe filename and metadata", async () => {
    const result = await convertMarkdownToPdf("# Hello\n\n" + "A printable paragraph. ".repeat(500), "My Brief!");
    const document = await PDFDocument.load(result.pdfBytes);
    expect(result.fileName).toBe("my-brief.pdf");
    expect(result.pageCount).toBeGreaterThan(1);
    expect(document.getPageCount()).toBe(result.pageCount);
    expect(document.getTitle()).toBe("My Brief!");
  });
});
