import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from "pdf-lib";
import { parseXlsxBytes, XlsxSheet } from "./xlsx-parser";
import { FontTextSanitizer, toFileSlug, type TextFidelityReport } from "../text/font-safe-text";

export interface XlsxToPdfResult {
  pdfBytes: Uint8Array;
  pageCount: number;
  fileName: string;
  metrics: { sheetCount: number; rowCount: number; cellCount: number };
  /** Which characters the embedded fonts could not draw as authored. */
  textFidelity: TextFidelityReport;
}

const PAGE = { width: 841.89, height: 595.28, margin: 40 };
const clip = (s: string, max: number) => (s.length > max ? `${s.slice(0, max - 3)}...` : s);

export async function convertXlsxToPdf(
  bytes: Uint8Array,
  fallbackTitle = "Spreadsheet",
  selectedSheetIndex?: number
): Promise<XlsxToPdfResult> {
  const parsed = parseXlsxBytes(bytes);
  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const sanitizer = new FontTextSanitizer([regular, bold]);
  const safe = (value: string) => sanitizer.sanitize(value);

  const sheetsToRender =
    selectedSheetIndex !== undefined && parsed.sheets[selectedSheetIndex]
      ? [parsed.sheets[selectedSheetIndex]]
      : parsed.sheets.filter((s) => s.rows.length > 0);

  if (!sheetsToRender.length) {
    throw new Error("The selected Excel workbook contains no readable data.");
  }

  for (const sheet of sheetsToRender) {
    renderSheetToPages(sheet, doc, safe, regular, bold);
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
    textFidelity: sanitizer.report(),
    pageCount: totalPages,
    fileName,
    metrics: { sheetCount: parsed.sheetCount, rowCount: parsed.rowCount, cellCount: parsed.cellCount },
  };
}

function renderSheetToPages(sheet: XlsxSheet, doc: PDFDocument, safe: (value: string) => string, regular: PDFFont, bold: PDFFont) {
  const rows = sheet.rows;
  if (!rows.length) return;

  const maxCols = Math.min(Math.max(...rows.map((r) => r.length), 1), 8);
  const tableWidth = PAGE.width - PAGE.margin * 2;
  const colWidth = tableWidth / maxCols;
  const rowHeight = 22;

  let page: PDFPage = doc.addPage([PAGE.width, PAGE.height]);
  let y = PAGE.height - PAGE.margin;

  const drawHeader = () => {
    page.drawText(safe(sheet.name), { x: PAGE.margin, y: y - 2, size: 15, font: bold, color: rgb(.1, .12, .18) });
    y -= 26;

    const headers = rows[0] || [];
    page.drawRectangle({ x: PAGE.margin, y: y - rowHeight + 4, width: tableWidth, height: rowHeight, color: rgb(.18, .24, .36) });
    for (let c = 0; c < maxCols; c++) {
      const headerText = headers[c] || `Col ${c + 1}`;
      page.drawText(clip(safe(headerText), 22), { x: PAGE.margin + c * colWidth + 5, y: y - 11, size: 8.5, font: bold, color: rgb(1, 1, 1) });
    }
    y -= rowHeight;
  };

  drawHeader();

  for (let r = 1; r < rows.length; r++) {
    if (y - rowHeight < PAGE.margin + 20) {
      page = doc.addPage([PAGE.width, PAGE.height]);
      y = PAGE.height - PAGE.margin;
      drawHeader();
    }

    if (r % 2 === 1) {
      page.drawRectangle({ x: PAGE.margin, y: y - rowHeight + 4, width: tableWidth, height: rowHeight, color: rgb(.96, .96, .97) });
    }

    const rowData = rows[r];
    for (let c = 0; c < maxCols; c++) {
      const val = rowData[c] || "";
      page.drawText(clip(safe(val), 26), { x: PAGE.margin + c * colWidth + 5, y: y - 11, size: 8, font: regular, color: rgb(.15, .15, .17) });
    }
    y -= rowHeight;
  }
}
