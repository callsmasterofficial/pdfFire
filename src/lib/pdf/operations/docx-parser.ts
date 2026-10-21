import { unzipSync, strFromU8 } from "fflate";

export interface DocxRun {
  text: string;
  bold?: boolean;
  italic?: boolean;
}

export interface DocxBlock {
  type: "heading" | "paragraph" | "bullet" | "table" | "page-break";
  level?: number;
  runs: DocxRun[];
  text: string;
  tableRows?: string[][];
}

export interface ParsedDocx {
  title: string;
  blocks: DocxBlock[];
  paragraphCount: number;
  wordCount: number;
  tableCount: number;
}

const decodeXml = (s: string) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");

export function parseDocxBytes(bytes: Uint8Array): ParsedDocx {
  const unzipped = unzipSync(bytes);
  const docFile = unzipped["word/document.xml"];
  if (!docFile) {
    throw new Error("Invalid Word document: missing word/document.xml");
  }
  const xml = strFromU8(docFile);
  return parseDocxXml(xml);
}

export function parseDocxXml(xml: string): ParsedDocx {
  const blocks: DocxBlock[] = [];
  let title = "Document";
  let paragraphCount = 0;
  let wordCount = 0;
  let tableCount = 0;

  const blockRegex = /<w:(p|tbl)[\s\S]*?<\/w:\1>/g;
  let match: RegExpExecArray | null;

  while ((match = blockRegex.exec(xml)) !== null) {
    const raw = match[0];
    const tag = match[1];

    if (tag === "p") {
      if (raw.includes('w:type="page"')) {
        blocks.push({ type: "page-break", runs: [], text: "" });
      }

      let headingLevel = 0;
      if (raw.includes("Heading1") || raw.includes("Title")) headingLevel = 1;
      else if (raw.includes("Heading2")) headingLevel = 2;
      else if (raw.includes("Heading3")) headingLevel = 3;

      const isBullet = raw.includes("<w:numPr");
      const runs = parseRuns(raw);
      const text = runs.map((r) => r.text).join("");

      if (text.trim()) {
        paragraphCount++;
        wordCount += text.trim().split(/\s+/).length;
        if (headingLevel === 1 && title === "Document") {
          title = text.trim();
        }

        blocks.push({
          type: headingLevel ? "heading" : isBullet ? "bullet" : "paragraph",
          level: headingLevel,
          runs,
          text: text.trim(),
        });
      }
    } else if (tag === "tbl") {
      tableCount++;
      const tableRows: string[][] = [];
      const trRegex = /<w:tr[\s\S]*?<\/w:tr>/g;
      let trMatch: RegExpExecArray | null;

      while ((trMatch = trRegex.exec(raw)) !== null) {
        const row: string[] = [];
        const tcRegex = /<w:tc[\s\S]*?<\/w:tc>/g;
        let tcMatch: RegExpExecArray | null;

        while ((tcMatch = tcRegex.exec(trMatch[0])) !== null) {
          const cellRuns = parseRuns(tcMatch[0]);
          const cellText = cellRuns.map((r) => r.text).join("").trim();
          row.push(cellText);
        }
        if (row.length) tableRows.push(row);
      }

      if (tableRows.length) {
        blocks.push({
          type: "table",
          runs: [],
          text: "",
          tableRows,
        });
      }
    }
  }

  return { title, blocks, paragraphCount, wordCount, tableCount };
}

function parseRuns(xmlBlock: string): DocxRun[] {
  const runs: DocxRun[] = [];
  const rRegex = /<w:r[\s\S]*?<\/w:r>/g;
  let rMatch: RegExpExecArray | null;

  while ((rMatch = rRegex.exec(xmlBlock)) !== null) {
    const rRaw = rMatch[0];
    const bold = /<w:b(\/>|\s[^>]*\/>)/.test(rRaw);
    const italic = /<w:i(\/>|\s[^>]*\/>)/.test(rRaw);

    const tRegex = /<w:t[^>]*>([\s\S]*?)<\/w:t>/g;
    let tMatch: RegExpExecArray | null;
    let runText = "";

    while ((tMatch = tRegex.exec(rRaw)) !== null) {
      runText += decodeXml(tMatch[1]);
    }

    if (runText) {
      runs.push({ text: runText, bold, italic });
    }
  }

  return runs;
}
