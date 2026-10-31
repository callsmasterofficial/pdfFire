import { PDFDocument, PDFFont, StandardFonts, rgb } from "pdf-lib";
import { MarkdownBlock, parseMarkdown } from "./markdown-parser";
import { FontTextSanitizer, toFileSlug, type TextFidelityReport } from "../text/font-safe-text";

export interface MarkdownToPdfResult {
  pdfBytes: Uint8Array; pageCount: number; fileName: string;
  /** Which characters the embedded fonts could not draw as authored. */
  textFidelity: TextFidelityReport;
}

const PAGE = { width: 595.28, height: 841.89, margin: 54 };

function wrap(text: string, font: PDFFont, size: number, width: number): string[] {
  const words = text.split(/\s+/); const lines: string[] = []; let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= width || !line) line = candidate;
    else { lines.push(line); line = word; }
  }
  if (line) lines.push(line);
  return lines;
}

export async function convertMarkdownToPdf(markdown: string, title = "Untitled Markdown"): Promise<MarkdownToPdfResult> {
  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const mono = await doc.embedFont(StandardFonts.Courier);
  const sanitizer = new FontTextSanitizer([regular, bold, mono]);
  const safe = (value: string) => sanitizer.sanitize(value);
  let page = doc.addPage([PAGE.width, PAGE.height]); let y = PAGE.height - PAGE.margin;
  const nextPage = () => { page = doc.addPage([PAGE.width, PAGE.height]); y = PAGE.height - PAGE.margin; };
  const ensure = (height: number) => { if (y - height < PAGE.margin) nextPage(); };
  const drawLines = (lines: string[], font: PDFFont, size: number, color = rgb(.14, .14, .15), indent = 0) => {
    const leading = size * 1.48;
    for (const line of lines) { ensure(leading); page.drawText(line, { x: PAGE.margin + indent, y, size, font, color }); y -= leading; }
  };
  const blocks = parseMarkdown(markdown);
  for (const block of blocks) drawBlock(block, safe, regular, bold, mono, drawLines, ensure, () => page.drawLine({ start: { x: PAGE.margin, y }, end: { x: PAGE.width - PAGE.margin, y }, thickness: 1, color: rgb(.75, .75, .75) }), () => { y -= 15; });
  doc.setTitle(title); doc.setCreator("FileMelo Client"); doc.setSubject("Markdown to PDF");
  const pdfBytes = await doc.save({ useObjectStreams: true });
  return {
    pdfBytes, pageCount: doc.getPageCount(),
    fileName: `${toFileSlug(title, "markdown-document")}.pdf`, textFidelity: sanitizer.report(),
  };
}

type DrawLines = (lines: string[], font: PDFFont, size: number, color?: ReturnType<typeof rgb>, indent?: number) => void;
function drawBlock(block: MarkdownBlock, safe: (value: string) => string, regular: PDFFont, bold: PDFFont, mono: PDFFont, draw: DrawLines, ensure: (height: number) => void, rule: () => void, gap: () => void) {
  if (block.kind === "rule") { ensure(18); rule(); gap(); return; }
  if (block.kind === "heading") { const size = block.level === 1 ? 22 : block.level === 2 ? 17 : 14; ensure(size * 2); draw(wrap(safe(block.text), bold, size, PAGE.width - PAGE.margin * 2), bold, size); gap(); return; }
  if (block.kind === "code") { const size = 9; for (const line of block.text.split("\n")) draw(wrap(safe(line) || " ", mono, size, PAGE.width - PAGE.margin * 2 - 18), mono, size, rgb(.19, .24, .29), 18); gap(); return; }
  const prefix = block.kind === "bullet" ? "• " : "";
  const indent = block.kind === "quote" ? 16 : block.kind === "bullet" ? 12 : 0;
  const font = block.kind === "quote" ? bold : regular;
  const size = 11;
  draw(wrap(`${prefix}${safe(block.text)}`, font, size, PAGE.width - PAGE.margin * 2 - indent), font, size, block.kind === "quote" ? rgb(.42, .3, .22) : undefined, indent);
  if (block.kind !== "bullet" && block.kind !== "ordered") gap();
}