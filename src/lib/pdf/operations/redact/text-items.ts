/**
 * Works out which characters sit under a redaction rectangle.
 *
 * Geometry comes from PDF.js, which resolves fonts, encodings and text
 * matrices properly. Re-deriving that from the raw stream would be the easiest
 * place to get redaction subtly wrong.
 *
 * The result is the covered *text*, not whole runs: deleting a whole run would
 * remove characters the rectangle never covered.
 */
import { getDocumentParams, getPdfjs } from "../../pdfjs-init";
import {
  rectToCharRange,
  toTextItemGeometry,
  type Rect,
} from "../../text/text-item-geometry";

export type { Rect };

export interface PageTargets {
  /** 1-based page number. */
  pageNumber: number;
  /** Distinct strings to delete from this page, longest first. */
  strings: string[];
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

      for (const raw of content.items) {
        const item = toTextItemGeometry(raw as Parameters<typeof toTextItemGeometry>[0]);
        if (!item || !item.str.trim()) continue;

        for (const rect of rects) {
          const range = rectToCharRange(item, rect);
          if (!range) continue;
          const covered = item.str.slice(range[0], range[1]);
          if (covered.trim()) strings.add(covered);
        }
      }

      if (strings.size > 0) {
        // Longest first, so a wider match is blanked before any substring of it.
        results.push({
          pageNumber,
          strings: [...strings].sort((a, b) => b.length - a.length),
        });
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
