/**
 * Shared table renderer for the DOCX and HTML converters.
 *
 * Both had the same loop with the same character-count clipping, so wrapping
 * is implemented once here. Row height follows the tallest cell in the row
 * rather than being fixed, which is what lets a long cell wrap instead of
 * being cut.
 */
import { PDFFont, PDFPage, rgb } from "pdf-lib";
import { TableFidelityTracker, type CellLayout } from "../text/table-cell-layout";

export interface TableStyle {
  pageWidth: number;
  margin: number;
  maxCols: number;
  headerFill: ReturnType<typeof rgb>;
}

export interface TableContext {
  safe: (value: string) => string;
  regular: PDFFont;
  bold: PDFFont;
  getPage: () => PDFPage;
  getY: () => number;
  setY: (y: number) => void;
  ensure: (height: number) => void;
  tracker: TableFidelityTracker;
}

export const CELL_PADDING = 6;
export const ROW_PADDING = 8;
export const LINE_RATIO = 1.25;
export const MAX_LINES = 6;

export interface RowLayout {
  cells: CellLayout[];
  /** Height the row needs for its tallest cell. */
  height: number;
}

/**
 * Lays a row out before any space is reserved, so the row's height can follow
 * its content instead of a fixed guess.
 */
export function layoutRow(
  values: string[],
  columnCount: number,
  safe: (value: string) => string,
  tracker: TableFidelityTracker,
  font: PDFFont,
  size: number,
  textWidth: number,
  maxLines = MAX_LINES
): RowLayout {
  const cells = Array.from({ length: columnCount }, (_, index) =>
    tracker.layout(safe(values[index] || ""), font, size, textWidth, maxLines)
  );
  const lineCount = Math.max(1, ...cells.map((cell) => cell.lines.length));
  return { cells, height: ROW_PADDING + lineCount * size * LINE_RATIO };
}

/** Draws a laid-out row's text, top line first. */
export function drawRowCells(
  page: PDFPage,
  row: RowLayout,
  options: {
    rowTop: number;
    columnX: (column: number) => number;
    size: number;
    font: PDFFont;
    color: ReturnType<typeof rgb>;
  }
): void {
  const lineHeight = options.size * LINE_RATIO;
  row.cells.forEach((cell, column) => {
    let lineY = options.rowTop - options.size - 2;
    for (const line of cell.lines) {
      page.drawText(line, {
        x: options.columnX(column),
        y: lineY,
        size: options.size,
        font: options.font,
        color: options.color,
      });
      lineY -= lineHeight;
    }
  });
}
const BODY_SIZE = 8.5;

export function drawTableRows(rows: string[][], context: TableContext, style: TableStyle): void {
  const { safe, regular, bold, getPage, getY, setY, ensure, tracker } = context;
  const maxCols = Math.min(Math.max(...rows.map((row) => row.length), 1), style.maxCols);
  const tableWidth = style.pageWidth - style.margin * 2;
  const colWidth = tableWidth / maxCols;
  const textWidth = colWidth - CELL_PADDING * 2;

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const isHeader = rowIndex === 0;
    const font = isHeader ? bold : regular;
    const row = layoutRow(rows[rowIndex], maxCols, safe, tracker, font, BODY_SIZE, textWidth);

    ensure(row.height);
    const page = getPage();
    const rowTop = getY();

    if (isHeader) {
      page.drawRectangle({
        x: style.margin, y: rowTop - row.height + 4,
        width: tableWidth, height: row.height, color: style.headerFill,
      });
    } else if (rowIndex % 2 === 1) {
      page.drawRectangle({
        x: style.margin, y: rowTop - row.height + 4,
        width: tableWidth, height: row.height, color: rgb(.98, .98, .99),
      });
    }

    drawRowCells(page, row, {
      rowTop,
      columnX: (column) => style.margin + column * colWidth + CELL_PADDING,
      size: BODY_SIZE,
      font,
      color: rgb(.15, .15, .18),
    });

    setY(rowTop - row.height);
  }
}
