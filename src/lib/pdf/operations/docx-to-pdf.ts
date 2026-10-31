import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from "pdf-lib";
import { DocxBlock, parseDocxBytes } from "./docx-parser";
import {
  FontTextSanitizer,
  toFileSlug,
  type TextFidelityReport,
} from "../text/font-safe-text";

export interface DocxToPdfResult {
  pdfBytes: Uint8Array;
  pageCount: number;
  fileName: string;
  metrics: { paragraphCount: number; wordCount: number; tableCount: number };
  /** Which characters the embedded fonts could not draw as authored. */
  textFidelity: TextFidelityReport;
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

export async function convertDocxToPdf(bytes: Uint8Array, fallbackTitle = "Word Document"): Promise<DocxToPdfResult> {
  const parsed = parseDocxBytes(bytes);
  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const italic = await doc.embedFont(StandardFonts.HelveticaOblique);
  const sanitizer = new FontTextSanitizer([regular, bold, italic]);
  const safe = (text: string) => sanitizer.sanitize(text);

  let page = doc.addPage([PAGE.width, PAGE.height]);
  let y = PAGE.height - PAGE.margin;
  const newPage = () => { page = doc.addPage([PAGE.width, PAGE.height]); y = PAGE.height - PAGE.margin; };
  const ensure = (h: number) => { if (y - h < PAGE.margin) newPage(); };

  for (const block of parsed.blocks) {
    if (block.type === "page-break") { newPage(); continue; }
    if (block.type === "heading") {
      const size = block.level === 1 ? 20 : block.level === 2 ? 15 : 12;
      const leading = size * 1.4;
      ensure(leading + 10);
      y -= 6;
      const lines = wrap(safe(block.text), bold, size, PAGE.width - PAGE.margin * 2);
      for (const line of lines) { ensure(leading); page.drawText(line, { x: PAGE.margin, y, size, font: bold, color: rgb(.1, .12, .18) }); y -= leading; }
      y -= 4;
      continue;
    }
    if (block.type === "bullet") {
      const size = 10.5; const leading = 15;
      const lines = wrap(safe(block.text), regular, size, PAGE.width - PAGE.margin * 2 - 18);
      for (let i = 0; i < lines.length; i++) {
        ensure(leading);
        if (i === 0) page.drawText("•", { x: PAGE.margin + 4, y, size, font: bold, color: rgb(.2, .4, .7) });
        page.drawText(lines[i], { x: PAGE.margin + 18, y, size, font: regular, color: rgb(.15, .15, .17) });
        y -= leading;
      }
      continue;
    }
    if (block.type === "paragraph") {
      drawParagraph(block, safe, regular, bold, italic, page, () => y, (newY) => { y = newY; }, ensure);
      y -= 4;
      continue;
    }
    if (block.type === "table" && block.tableRows?.length) {
      drawTable(block.tableRows, safe, regular, bold, page, () => y, (newY) => { y = newY; }, ensure);
      y -= 8;
    }
  }

  // Draw running footer
  const totalPages = doc.getPageCount();
  const pages = doc.getPages();
  for (let i = 0; i < totalPages; i++) {
    const p = pages[i];
    const footerText = `Page ${i + 1} of ${totalPages}`;
    const w = regular.widthOfTextAtSize(footerText, 9);
    p.drawText(footerText, { x: (PAGE.width - w) / 2, y: 28, size: 9, font: regular, color: rgb(.5, .5, .55) });
  }

  const title = parsed.title && parsed.title !== "Document" ? parsed.title : fallbackTitle;
  doc.setTitle(title);
  doc.setCreator("PDFfire Pure-Client Converter");

  const pdfBytes = await doc.save({ useObjectStreams: true });
  const fileName = `${toFileSlug(title)}.pdf`;
  return {
    pdfBytes,
    pageCount: totalPages,
    fileName,
    metrics: { paragraphCount: parsed.paragraphCount, wordCount: parsed.wordCount, tableCount: parsed.tableCount },
    textFidelity: sanitizer.report(),
  };
}

function drawParagraph(
  block: DocxBlock,
  safe: (text: string) => string,
  regular: PDFFont,
  bold: PDFFont,
  italic: PDFFont,
  page: PDFPage,
  getY: () => number,
  setY: (y: number) => void,
  ensure: (h: number) => void
) {
  const size = 10.5;
  const leading = 15;
  const hasBold = block.runs.some((r) => r.bold);
  const hasItalic = block.runs.some((r) => r.italic);
  const font = hasBold ? bold : hasItalic ? italic : regular;
  const lines = wrap(safe(block.text), font, size, PAGE.width - PAGE.margin * 2);
  for (const line of lines) {
    ensure(leading);
    page.drawText(line, { x: PAGE.margin, y: getY(), size, font, color: rgb(.14, .14, .16) });
    setY(getY() - leading);
  }
}

function drawTable(
  rows: string[][],
  safe: (text: string) => string,
  regular: PDFFont,
  bold: PDFFont,
  page: PDFPage,
  getY: () => number,
  setY: (y: number) => void,
  ensure: (h: number) => void
) {
  const maxCols = Math.min(Math.max(...rows.map((r) => r.length), 1), 6);
  const tableWidth = PAGE.width - PAGE.margin * 2;
  const colWidth = tableWidth / maxCols;
  const rowHeight = 22;

  for (let rIdx = 0; rIdx < rows.length; rIdx++) {
    ensure(rowHeight);
    const rowY = getY();
    const isHeader = rIdx === 0;
    if (isHeader) {
      page.drawRectangle({ x: PAGE.margin, y: rowY - rowHeight + 4, width: tableWidth, height: rowHeight, color: rgb(.93, .94, .96) });
    } else if (rIdx % 2 === 1) {
      page.drawRectangle({ x: PAGE.margin, y: rowY - rowHeight + 4, width: tableWidth, height: rowHeight, color: rgb(.98, .98, .99) });
    }
    const cols = rows[rIdx];
    for (let cIdx = 0; cIdx < maxCols; cIdx++) {
      const cellText = safe(cols[cIdx] || "");
      const font = isHeader ? bold : regular;
      const x = PAGE.margin + cIdx * colWidth;
      const clipped = cellText.length > 25 ? `${cellText.slice(0, 22)}...` : cellText;
      page.drawText(clipped, { x: x + 6, y: rowY - 11, size: 8.5, font, color: rgb(.15, .15, .18) });
    }
    setY(rowY - rowHeight);
  }
}
