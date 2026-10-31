import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { FontTextSanitizer, toFileSlug, type TextFidelityReport } from "../text/font-safe-text";
import { TableFidelityTracker, type TableFidelityReport } from "../text/table-cell-layout";
import { CELL_PADDING, drawRowCells, layoutRow } from "./table-renderer";

export interface CsvTable { headers: string[]; rows: string[][]; }
export interface CsvToPdfResult {
  pdfBytes: Uint8Array; pageCount: number; fileName: string; rowCount: number;
  /** Which characters the embedded fonts could not draw as authored. */
  textFidelity: TextFidelityReport;
  /** Table cells whose text did not fit their column, even wrapped. */
  tableFidelity: TableFidelityReport;
}

/** Parses RFC 4180-style quoted cells without sending tabular data anywhere. */
export function parseCsv(source: string): CsvTable {
  const rows: string[][] = []; let row: string[] = []; let cell = ""; let quoted = false;
  for (let i = 0; i < source.length; i++) {
    const char = source[i]; const next = source[i + 1];
    if (char === '"' && quoted && next === '"') { cell += '"'; i++; }
    else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) { row.push(cell.trim()); cell = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") i++;
      row.push(cell.trim()); if (row.some(Boolean)) rows.push(row); row = []; cell = "";
    } else cell += char;
  }
  row.push(cell.trim()); if (row.some(Boolean)) rows.push(row);
  const [headers = [], ...data] = rows;
  return { headers, rows: data };
}


export async function convertCsvToPdf(csv: string, title = "Data table"): Promise<CsvToPdfResult> {
  const table = parseCsv(csv);
  if (!table.headers.length) throw new Error("Add a header row before generating a PDF.");
  const columns = Math.min(table.headers.length, 6);
  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica); const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const sanitizer = new FontTextSanitizer([regular, bold]);
  const safe = (value: string) => sanitizer.sanitize(value);
  const tracker = new TableFidelityTracker();
  const width = 841.89; const height = 595.28; const margin = 36; const tableWidth = width - margin * 2;
  const columnWidth = tableWidth / columns;
  const textWidth = columnWidth - CELL_PADDING * 2;
  const columnX = (column: number) => margin + column * columnWidth + CELL_PADDING;
  let page = doc.addPage([width, height]); let y = height - margin;
  const header = () => {
    page.drawText(safe(title), { x: margin, y, size: 16, font: bold, color: rgb(.1, .1, .12) }); y -= 30;
    const row = layoutRow(table.headers, columns, safe, tracker, bold, 8, textWidth);
    for (let col = 0; col < columns; col++) {
      page.drawRectangle({ x: margin + col * columnWidth, y: y - row.height + 4, width: columnWidth, height: row.height, color: rgb(.92, .29, .17) });
    }
    drawRowCells(page, row, { rowTop: y, columnX, size: 8, font: bold, color: rgb(1, 1, 1) });
    y -= row.height;
  };
  header();
  for (const [index, values] of table.rows.entries()) {
    // Lay the row out first: its height depends on how much its cells wrap.
    const row = layoutRow(values, columns, safe, tracker, regular, 8, textWidth);
    if (y - row.height < margin) { page = doc.addPage([width, height]); y = height - margin; header(); }
    if (index % 2 === 0) page.drawRectangle({ x: margin, y: y - row.height + 4, width: tableWidth, height: row.height, color: rgb(.96, .96, .95) });
    drawRowCells(page, row, { rowTop: y, columnX, size: 8, font: regular, color: rgb(.16, .16, .17) });
    y -= row.height;
  }
  doc.setTitle(title); doc.setCreator("FileMelo Client");
  return {
    pdfBytes: await doc.save(), pageCount: doc.getPageCount(), rowCount: table.rows.length,
    fileName: `${toFileSlug(title, "csv-table")}.pdf`, textFidelity: sanitizer.report(),
    tableFidelity: tracker.report(),
  };
}
