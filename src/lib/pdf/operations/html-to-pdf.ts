import { PDFDocument, PDFFont, StandardFonts, rgb } from "pdf-lib";
import { parseHtml } from "./html-parser";
import { FontTextSanitizer, toFileSlug, type TextFidelityReport } from "../text/font-safe-text";
import { TableFidelityTracker, type TableFidelityReport } from "../text/table-cell-layout";
import { drawTableRows } from "./table-renderer";

export interface HtmlToPdfResult {
  pdfBytes: Uint8Array;
  pageCount: number;
  fileName: string;
  metrics: { elementCount: number; wordCount: number; tableCount: number };
  /** Which characters the embedded fonts could not draw as authored. */
  textFidelity: TextFidelityReport;
  /** Table cells whose text did not fit their column, even wrapped. */
  tableFidelity: TableFidelityReport;
}

const PAGE = { width: 595.28, height: 841.89, margin: 54 };

function wrap(text: string, font: PDFFont, size: number, maxW: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    if (!w) continue;
    const cand = line ? `${line} ${w}` : w;
    if (font.widthOfTextAtSize(cand, size) <= maxW || !line) line = cand;
    else { lines.push(line); line = w; }
  }
  if (line) lines.push(line);
  return lines;
}

export async function convertHtmlToPdf(html: string, fallbackTitle = "HTML Document"): Promise<HtmlToPdfResult> {
  const parsed = parseHtml(html);
  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const mono = await doc.embedFont(StandardFonts.Courier);
  const sanitizer = new FontTextSanitizer([regular, bold, mono]);
  const safe = (value: string) => sanitizer.sanitize(value);
  const tableTracker = new TableFidelityTracker();

  let page = doc.addPage([PAGE.width, PAGE.height]);
  let y = PAGE.height - PAGE.margin;
  const newPage = () => { page = doc.addPage([PAGE.width, PAGE.height]); y = PAGE.height - PAGE.margin; };
  const ensure = (h: number) => { if (y - h < PAGE.margin) newPage(); };

  for (const block of parsed.blocks) {
    if (block.kind === "rule") {
      ensure(16);
      page.drawLine({ start: { x: PAGE.margin, y }, end: { x: PAGE.width - PAGE.margin, y }, thickness: 1, color: rgb(.8, .8, .82) });
      y -= 14;
      continue;
    }
    if (block.kind === "heading") {
      const size = block.level === 1 ? 20 : block.level === 2 ? 15 : 12;
      const leading = size * 1.4;
      ensure(leading + 10);
      y -= 6;
      for (const line of wrap(safe(block.text), bold, size, PAGE.width - PAGE.margin * 2)) {
        ensure(leading);
        page.drawText(line, { x: PAGE.margin, y, size, font: bold, color: rgb(.1, .12, .18) });
        y -= leading;
      }
      y -= 4;
      continue;
    }
    if (block.kind === "bullet" || block.kind === "ordered") {
      const size = 10.5; const leading = 15;
      const isBullet = block.kind === "bullet";
      const lines = wrap(safe(block.text), regular, size, PAGE.width - PAGE.margin * 2 - 18);
      for (let i = 0; i < lines.length; i++) {
        ensure(leading);
        if (i === 0 && isBullet) page.drawText("•", { x: PAGE.margin + 4, y, size, font: bold, color: rgb(.2, .4, .7) });
        page.drawText(lines[i], { x: PAGE.margin + 18, y, size, font: regular, color: rgb(.14, .14, .16) });
        y -= leading;
      }
      continue;
    }
    if (block.kind === "code") {
      const size = 9; const leading = 13;
      for (const rawLine of block.text.split("\n")) {
        for (const line of wrap(safe(rawLine) || " ", mono, size, PAGE.width - PAGE.margin * 2 - 20)) {
          ensure(leading);
          page.drawRectangle({ x: PAGE.margin, y: y - 2, width: PAGE.width - PAGE.margin * 2, height: leading, color: rgb(.95, .96, .97) });
          page.drawText(line, { x: PAGE.margin + 10, y, size, font: mono, color: rgb(.18, .22, .28) });
          y -= leading;
        }
      }
      y -= 4;
      continue;
    }
    if (block.kind === "quote") {
      const size = 10; const leading = 15;
      for (const line of wrap(safe(block.text), regular, size, PAGE.width - PAGE.margin * 2 - 20)) {
        ensure(leading);
        page.drawLine({ start: { x: PAGE.margin + 4, y: y + leading - 2 }, end: { x: PAGE.margin + 4, y: y - 2 }, thickness: 2, color: rgb(.8, .4, .2) });
        page.drawText(line, { x: PAGE.margin + 16, y, size, font: regular, color: rgb(.35, .35, .38) });
        y -= leading;
      }
      y -= 4;
      continue;
    }
    if (block.kind === "paragraph") {
      const size = 10.5; const leading = 15;
      for (const line of wrap(safe(block.text), regular, size, PAGE.width - PAGE.margin * 2)) {
        ensure(leading);
        page.drawText(line, { x: PAGE.margin, y, size, font: regular, color: rgb(.14, .14, .16) });
        y -= leading;
      }
      y -= 4;
      continue;
    }
    if (block.kind === "table" && block.tableRows?.length) {
      drawTableRows(
        block.tableRows,
        { safe, regular, bold, getPage: () => page, getY: () => y, setY: (newY) => { y = newY; }, ensure, tracker: tableTracker },
        { pageWidth: PAGE.width, margin: PAGE.margin, maxCols: 6, headerFill: rgb(.92, .94, .97) }
      );
      y -= 6;
    }
  }

  const totalPages = doc.getPageCount();
  const pages = doc.getPages();
  for (let i = 0; i < totalPages; i++) {
    const footer = `Page ${i + 1} of ${totalPages}`;
    const fw = regular.widthOfTextAtSize(footer, 8.5);
    pages[i].drawText(footer, { x: (PAGE.width - fw) / 2, y: 26, size: 8.5, font: regular, color: rgb(.5, .5, .55) });
  }

  const title = parsed.title && parsed.title !== "HTML Document" ? parsed.title : fallbackTitle;
  doc.setTitle(title);
  doc.setCreator("PDFfire Pure-Client Converter");

  const pdfBytes = await doc.save({ useObjectStreams: true });
  const fileName = `${toFileSlug(title)}.pdf`;

  return {
    pdfBytes,
    pageCount: totalPages,
    fileName,
    metrics: { elementCount: parsed.elementCount, wordCount: parsed.wordCount, tableCount: parsed.tableCount },
    textFidelity: sanitizer.report(),
    tableFidelity: tableTracker.report(),
  };
}
