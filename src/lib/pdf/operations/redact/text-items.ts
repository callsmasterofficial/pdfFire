/**
 * Finds the text that actually sits under a redaction rectangle.
 *
 * Geometry comes from PDF.js, which resolves fonts, encodings and text
 * matrices properly. Re-deriving that from the raw stream would be the easiest
 * place to get redaction subtly wrong.
 */
import { getDocumentParams, getPdfjs } from "../../pdfjs-init";

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PageTargets {
  /** 1-based page number. */
  pageNumber: number;
  /** Distinct strings painted inside a redaction rectangle on this page. */
  strings: string[];
}

/**
 * Descenders fall below the baseline that PDF.js reports, so the measured box
 * is extended downwards before testing for overlap.
 */
const DESCENDER_RATIO = 0.25;

function overlaps(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

export async function findTargetStrings(
  bytes: Uint8Array,
  rectsByPage: Map<number, Rect[]>
): Promise<PageTargets[]> {
  const pdfjs = await getPdfjs();
  const task = pdfjs.getDocument(getDocumentParams(bytes));
  const doc = await task.promise;
  const results: PageTargets[] = [];

  try {
    for (const [pageNumber, rects] of rectsByPage) {
      if (pageNumber < 1 || pageNumber > doc.numPages || rects.length === 0) continue;
      const page = await doc.getPage(pageNumber);
      const content = await page.getTextContent();
      const strings = new Set<string>();

      for (const item of content.items) {
        const str = (item as { str?: string }).str;
        if (typeof str !== "string" || !str.trim()) continue;

        const transform = (item as { transform?: number[] }).transform ?? [1, 0, 0, 1, 0, 0];
        const glyphHeight =
          Math.abs(transform[3]) || (item as { height?: number }).height || 12;
        const box: Rect = {
          x: transform[4],
          y: transform[5] - glyphHeight * DESCENDER_RATIO,
          width: (item as { width?: number }).width || 1,
          height: glyphHeight * (1 + DESCENDER_RATIO),
        };

        if (rects.some((rect) => overlaps(box, rect))) strings.add(str);
      }

      if (strings.size > 0) {
        results.push({ pageNumber, strings: [...strings] });
      }
    }
  } finally {
    await task.destroy();
  }

  return results;
}

/** Text still recoverable from `bytes`, as an independent parser reads it. */
export async function readPageText(bytes: Uint8Array): Promise<string[]> {
  const pdfjs = await getPdfjs();
  const task = pdfjs.getDocument(getDocumentParams(bytes));
  const doc = await task.promise;
  try {
    const pages: string[] = [];
    for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber++) {
      const page = await doc.getPage(pageNumber);
      const content = await page.getTextContent();
      pages.push(
        content.items.map((item: unknown) => (item as { str?: string }).str ?? "").join("")
      );
    }
    return pages;
  } finally {
    await task.destroy();
  }
}
