import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { FontTextSanitizer, toFileSlug, type TextFidelityReport } from "../text/font-safe-text";

export interface CsvTable { headers: string[]; rows: string[][]; }
export interface CsvToPdfResult {
  pdfBytes: Uint8Array; pageCount: number; fileName: string; rowCount: number;
  /** Which characters the embedded fonts could not draw as authored. */
  textFidelity: TextFidelityReport;
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

const clipped = (value: string, max: number) => value.length > max ? `${value.slice(0, max - 3)}...` : value;

export async function convertCsvToPdf(csv: string, title = "Data table"): Promise<CsvToPdfResult> {
  const table = parseCsv(csv);
  if (!table.headers.length) throw new Error("Add a header row before generating a PDF.");
  const columns = Math.min(table.headers.length, 6);
  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica); const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const sanitizer = new FontTextSanitizer([regular, bold]);
  const safe = (value: string) => sanitizer.sanitize(value);
  const width = 841.89; const height = 595.28; const margin = 36; const tableWidth = width - margin * 2;
  const columnWidth = tableWidth / columns; const rowHeight = 22;
  let page = doc.addPage([width, height]); let y = height - margin;
  const header = () => {
    page.drawText(safe(title), { x: margin, y, size: 16, font: bold, color: rgb(.1, .1, .12) }); y -= 30;
    for (let col = 0; col < columns; col++) {
      const x = margin + col * columnWidth;
      page.drawRectangle({ x, y: y - rowHeight + 4, width: columnWidth, height: rowHeight, color: rgb(.92, .29, .17) });
      page.drawText(clipped(safe(table.headers[col] || ""), 26), { x: x + 5, y: y - 11, size: 8, font: bold, color: rgb(1, 1, 1) });
    }
    y -= rowHeight;
  };
  header();
  for (const [index, values] of table.rows.entries()) {
    if (y - rowHeight < margin) { page = doc.addPage([width, height]); y = height - margin; header(); }
    if (index % 2 === 0) page.drawRectangle({ x: margin, y: y - rowHeight + 4, width: tableWidth, height: rowHeight, color: rgb(.96, .96, .95) });
    for (let col = 0; col < columns; col++) {
      const x = margin + col * columnWidth;
      page.drawText(clipped(safe(values[col] || ""), 31), { x: x + 5, y: y - 11, size: 8, font: regular, color: rgb(.16, .16, .17) });
    }
    y -= rowHeight;
  }
  doc.setTitle(title); doc.setCreator("FileMelo Client");
  return {
    pdfBytes: await doc.save(), pageCount: doc.getPageCount(), rowCount: table.rows.length,
    fileName: `${toFileSlug(title, "csv-table")}.pdf`, textFidelity: sanitizer.report(),
  };
}
