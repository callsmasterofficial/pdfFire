export type HtmlBlockKind =
  | "heading"
  | "paragraph"
  | "bullet"
  | "ordered"
  | "quote"
  | "code"
  | "table"
  | "rule";

export interface HtmlBlock {
  kind: HtmlBlockKind;
  text: string;
  level?: number;
  tableRows?: string[][];
}

export interface ParsedHtml {
  title: string;
  blocks: HtmlBlock[];
  elementCount: number;
  wordCount: number;
  tableCount: number;
}

const decodeEntities = (s: string) =>
  s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");

const stripTags = (s: string) => decodeEntities(s.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();

export function parseHtml(html: string): ParsedHtml {
  const blocks: HtmlBlock[] = [];
  let title = "HTML Document";
  let elementCount = 0;
  let wordCount = 0;
  let tableCount = 0;

  // Extract <title> if present
  const titleMatch = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  if (titleMatch) {
    const rawTitle = stripTags(titleMatch[1]);
    if (rawTitle) title = rawTitle;
  }

  // Remove <head>, <script>, <style>, and comments
  const clean = html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<head[\s\S]*?<\/head>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "");

  const blockRegex = /<(h[1-6]|p|blockquote|pre|ul|ol|table|hr)[^>]*>([\s\S]*?)<\/\1>|<(hr)[^>]*\/?>/gi;
  let match: RegExpExecArray | null;

  while ((match = blockRegex.exec(clean)) !== null) {
    const tag = (match[1] || match[3] || "").toLowerCase();
    const content = match[2] || "";
    elementCount++;

    if (tag === "hr") {
      blocks.push({ kind: "rule", text: "" });
      continue;
    }

    if (/^h[1-6]$/.test(tag)) {
      const level = Math.min(parseInt(tag[1], 10), 3);
      const text = stripTags(content);
      if (text) {
        if (level === 1 && title === "HTML Document") title = text;
        wordCount += text.split(/\s+/).length;
        blocks.push({ kind: "heading", level, text });
      }
      continue;
    }

    if (tag === "p") {
      const text = stripTags(content);
      if (text) {
        wordCount += text.split(/\s+/).length;
        blocks.push({ kind: "paragraph", text });
      }
      continue;
    }

    if (tag === "blockquote") {
      const text = stripTags(content);
      if (text) {
        wordCount += text.split(/\s+/).length;
        blocks.push({ kind: "quote", text });
      }
      continue;
    }

    if (tag === "pre") {
      const text = decodeEntities(content.replace(/<[^>]*>/g, "")).trim();
      if (text) {
        wordCount += text.split(/\s+/).length;
        blocks.push({ kind: "code", text });
      }
      continue;
    }

    if (tag === "ul" || tag === "ol") {
      const isOrdered = tag === "ol";
      const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
      let liMatch: RegExpExecArray | null;
      let orderIdx = 1;

      while ((liMatch = liRegex.exec(content)) !== null) {
        const text = stripTags(liMatch[1]);
        if (text) {
          wordCount += text.split(/\s+/).length;
          blocks.push({
            kind: isOrdered ? "ordered" : "bullet",
            text: isOrdered ? `${orderIdx++}. ${text}` : text,
          });
        }
      }
      continue;
    }

    if (tag === "table") {
      tableCount++;
      const tableRows: string[][] = [];
      const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
      let trMatch: RegExpExecArray | null;

      while ((trMatch = trRegex.exec(content)) !== null) {
        const rowCells: string[] = [];
        const cellRegex = /<(th|td)[^>]*>([\s\S]*?)<\/\1>/gi;
        let cellMatch: RegExpExecArray | null;

        while ((cellMatch = cellRegex.exec(trMatch[1])) !== null) {
          const cellText = stripTags(cellMatch[2]);
          rowCells.push(cellText);
          if (cellText) wordCount += cellText.split(/\s+/).length;
        }
        if (rowCells.length) tableRows.push(rowCells);
      }

      if (tableRows.length) {
        blocks.push({ kind: "table", text: "", tableRows });
      }
    }
  }

  // If no blocks parsed from tags, fallback to plain text paragraphs
  if (!blocks.length && clean.trim()) {
    const text = stripTags(clean);
    if (text) {
      wordCount += text.split(/\s+/).length;
      blocks.push({ kind: "paragraph", text });
    }
  }

  return { title, blocks, elementCount, wordCount, tableCount };
}
