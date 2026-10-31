import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from "pdf-lib";
import { parseXlsxBytes, XlsxSheet } from "./xlsx-parser";
import { canEncodeWith, toFileSlug } from "../text/font-safe-text";
import { UnicodeTextWriter, type UnicodeFidelityReport } from "../text/unicode-text";
import { writerEngine, type TextEngine } from "../text/text-engine";
import { TableFidelityTracker, type TableFidelityReport } from "../text/table-cell-layout";
import { CELL_PADDING, drawRowCells, layoutRow } from "./table-renderer";

export interface XlsxToPdfResult {
  pdfBytes: Uint8Array;
  pageCount: number;
  fileName: string;
  metrics: { sheetCount: number; rowCount: number; cellCount: number };
  /** Language packs used, and anything still unrepresentable. */
  textFidelity: UnicodeFidelityReport;
  /** Table cells whose text did not fit their column, even wrapped. */
  tableFidelity: TableFidelityReport;
}

const PAGE = { width: 841.89, height: 595.28, margin: 40 };

export async function convertXlsxToPdf(
  bytes: Uint8Array,
  fallbackTitle = "Spreadsheet",
  selectedSheetIndex?: number
): Promise<XlsxToPdfResult> {
  const parsed = parseXlsxBytes(bytes);
  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  // Non-Latin cells come from a language pack, downloaded only if needed.
  const writer = UnicodeTextWriter.create(doc, canEncodeWith([regular, bold]));
  await writer.prepare(
    parsed.sheets.flatMap((sheet) => [sheet.name, ...sheet.rows.flat()]).join("\n")
  );
  const engine = writerEngine(writer);
  const tableTracker = new TableFidelityTracker(engine);

  const sheetsToRender =
    selectedSheetIndex !== undefined && parsed.sheets[selectedSheetIndex]
      ? [parsed.sheets[selectedSheetIndex]]
      : parsed.sheets.filter((s) => s.rows.length > 0);

  if (!sheetsToRender.length) {
    throw new Error("The selected Excel workbook contains no readable data.");
  }

  for (const sheet of sheetsToRender) {
    renderSheetToPages(sheet, doc, engine, regular, bold, tableTracker);
  }

  const totalPages = doc.getPageCount();
  const pages = doc.getPages();
  for (let i = 0; i < totalPages; i++) {
    const p = pages[i];
    const footer = `Page ${i + 1} of ${totalPages}`;
    const fw = regular.widthOfTextAtSize(footer, 8.5);
    p.drawText(footer, { x: (PAGE.width - fw) / 2, y: 20, size: 8.5, font: regular, color: rgb(.5, .5, .55) });
  }

  const title = sheetsToRender.length === 1 ? sheetsToRender[0].name : fallbackTitle;
  doc.setTitle(title);
  doc.setCreator("FileMelo Pure-Client Converter");

  const pdfBytes = await doc.save({ useObjectStreams: true });
  const fileName = `${toFileSlug(title, "spreadsheet")}.pdf`;

  return {
    pdfBytes,
    textFidelity: writer.report(),
    tableFidelity: tableTracker.report(),
    pageCount: totalPages,
    fileName,
    metrics: { sheetCount: parsed.sheetCount, rowCount: parsed.rowCount, cellCount: parsed.cellCount },
  };
}

function renderSheetToPages(
  sheet: XlsxSheet,
  doc: PDFDocument,
  engine: TextEngine,
  regular: PDFFont,
  bold: PDFFont,
  tracker: TableFidelityTracker
) {
  const rows = sheet.rows;
  if (!rows.length) return;

  const maxCols = Math.min(Math.max(...rows.map((r) => r.length), 1), 8);
  const tableWidth = PAGE.width - PAGE.margin * 2;
  const colWidth = tableWidth / maxCols;
  const textWidth = colWidth - CELL_PADDING * 2;
  const columnX = (column: number) => PAGE.margin + column * colWidth + CELL_PADDING;

  let page: PDFPage = doc.addPage([PAGE.width, PAGE.height]);
  let y = PAGE.height - PAGE.margin;

  const drawHeader = () => {
    engine.draw(page, sheet.name, { x: PAGE.margin, y: y - 2, size: 15, font: bold, color: rgb(.1, .12, .18) });
    y -= 26;

    const headers = Array.from({ length: maxCols }, (_, c) => (rows[0] || [])[c] || `Col ${c + 1}`);
    const row = layoutRow(headers, maxCols, tracker, bold, 8.5, textWidth);
    page.drawRectangle({ x: PAGE.margin, y: y - row.height + 4, width: tableWidth, height: row.height, color: rgb(.18, .24, .36) });
    drawRowCells(page, row, { rowTop: y, columnX, size: 8.5, font: bold, color: rgb(1, 1, 1), engine });
    y -= row.height;
  };

  drawHeader();

  for (let r = 1; r < rows.length; r++) {
    // Lay the row out first: its height depends on how much its cells wrap.
    const row = layoutRow(rows[r], maxCols, tracker, regular, 8, textWidth);

    if (y - row.height < PAGE.margin + 20) {
      page = doc.addPage([PAGE.width, PAGE.height]);
      y = PAGE.height - PAGE.margin;
      drawHeader();
    }

    if (r % 2 === 1) {
      page.drawRectangle({ x: PAGE.margin, y: y - row.height + 4, width: tableWidth, height: row.height, color: rgb(.96, .96, .97) });
    }

    drawRowCells(page, row, { rowTop: y, columnX, size: 8, font: regular, color: rgb(.15, .15, .17), engine });
    y -= row.height;
  }
}
