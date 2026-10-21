import { unzipSync, strFromU8 } from "fflate";

export interface XlsxSheet {
  name: string;
  rows: string[][];
}

export interface ParsedXlsx {
  sheets: XlsxSheet[];
  sheetCount: number;
  rowCount: number;
  cellCount: number;
}

const decodeXml = (s: string) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");

function colIndex(ref: string): number {
  const letters = ref.replace(/[0-9]/g, "").toUpperCase();
  let col = 0;
  for (let i = 0; i < letters.length; i++) {
    col = col * 26 + (letters.charCodeAt(i) - 64);
  }
  return Math.max(col - 1, 0);
}

export function parseSharedStrings(xml: string): string[] {
  const strings: string[] = [];
  const siRegex = /<si[\s\S]*?<\/si>/g;
  let match: RegExpExecArray | null;
  while ((match = siRegex.exec(xml)) !== null) {
    const tRegex = /<t[^>]*>([\s\S]*?)<\/t>/g;
    let tMatch: RegExpExecArray | null;
    let text = "";
    while ((tMatch = tRegex.exec(match[0])) !== null) {
      text += decodeXml(tMatch[1]);
    }
    strings.push(text);
  }
  return strings;
}

export function parseWorksheet(xml: string, sharedStrings: string[]): string[][] {
  const rows: string[][] = [];
  const rowRegex = /<row[\s\S]*?<\/row>/g;
  let rowMatch: RegExpExecArray | null;

  while ((rowMatch = rowRegex.exec(xml)) !== null) {
    const rawRow = rowMatch[0];
    const cells: string[] = [];
    const cRegex = /<c\s+([^>]*?)>([\s\S]*?)<\/c>|<c\s+([^>]*?)\/>/g;
    let cMatch: RegExpExecArray | null;

    while ((cMatch = cRegex.exec(rawRow)) !== null) {
      const attrs = cMatch[1] || cMatch[3] || "";
      const body = cMatch[2] || "";
      const refMatch = /r="([A-Z0-9]+)"/.exec(attrs);
      const targetCol = refMatch ? colIndex(refMatch[1]) : cells.length;
      while (cells.length < targetCol) cells.push("");

      const isShared = /t="s"/.test(attrs);
      const isInline = /t="inlineStr"/.test(attrs) || /<is[\s>]/.test(body) || (!isShared && /<t[\s>]/.test(body));

      let val = "";
      if (isInline) {
        const tMatch = /<t[^>]*>([\s\S]*?)<\/t>/.exec(body);
        if (tMatch) val = decodeXml(tMatch[1]);
      } else {
        const vMatch = /<v>([\s\S]*?)<\/v>/.exec(body);
        if (vMatch) {
          const rawV = vMatch[1].trim();
          if (isShared) {
            const idx = parseInt(rawV, 10);
            val = sharedStrings[idx] ?? rawV;
          } else {
            val = rawV;
          }
        }
      }
      cells.push(val.trim());
    }

    if (cells.some((c) => c !== "")) {
      rows.push(cells);
    }
  }

  return rows;
}

export function parseXlsxBytes(bytes: Uint8Array): ParsedXlsx {
  const unzipped = unzipSync(bytes);
  const ssFile = unzipped["xl/sharedStrings.xml"];
  const sharedStrings = ssFile ? parseSharedStrings(strFromU8(ssFile)) : [];

  const sheets: XlsxSheet[] = [];
  let rowCount = 0;
  let cellCount = 0;

  // Find sheet files
  const sheetKeys = Object.keys(unzipped)
    .filter((k) => /^xl\/worksheets\/sheet\d+\.xml$/i.test(k))
    .sort();

  if (!sheetKeys.length) {
    throw new Error("Invalid Excel workbook: missing worksheet XML data");
  }

  // Parse workbook.xml for sheet names if available
  const wbFile = unzipped["xl/workbook.xml"];
  const sheetNames: string[] = [];
  if (wbFile) {
    const wbXml = strFromU8(wbFile);
    const sRegex = /<sheet\s+[^>]*name="([^"]+)"/g;
    let sMatch: RegExpExecArray | null;
    while ((sMatch = sRegex.exec(wbXml)) !== null) {
      sheetNames.push(decodeXml(sMatch[1]));
    }
  }

  for (let i = 0; i < sheetKeys.length; i++) {
    const rawSheetXml = strFromU8(unzipped[sheetKeys[i]]);
    const rows = parseWorksheet(rawSheetXml, sharedStrings);
    const name = sheetNames[i] || `Sheet ${i + 1}`;
    sheets.push({ name, rows });

    rowCount += rows.length;
    for (const r of rows) cellCount += r.length;
  }

  return {
    sheets,
    sheetCount: sheets.length,
    rowCount,
    cellCount,
  };
}
