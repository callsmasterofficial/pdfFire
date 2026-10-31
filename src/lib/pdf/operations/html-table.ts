/**
 * Table renderer for the HTML converter.
 *
 * Extracted so html-to-pdf.ts stays within the repository's module size rule.
 * Cells are still clipped at 25 characters, which is a known fidelity limit
 * tracked in the capability matrix rather than something this move changed.
 */
import { PDFFont, PDFPage, rgb } from "pdf-lib";

const PAGE = { width: 595.28, height: 841.89, margin: 54 };

export function drawHtmlTable(
  rows: string[][],
  safe: (value: string) => string,
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
      page.drawRectangle({ x: PAGE.margin, y: rowY - rowHeight + 4, width: tableWidth, height: rowHeight, color: rgb(.92, .94, .97) });
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
