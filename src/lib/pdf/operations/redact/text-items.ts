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
  /** Concatenated run text for this page, in content order. */
  text: string;
  /** Per character of `text`: does it lie inside a redaction rectangle. */
  covered: boolean[];
  /**
   * Per character of `text`: its advance width and the font size it was drawn
   * at. Deleting a character removes its advance, so the width has to be given
   * back explicitly or the rest of the line slides into the redaction box.
   */
  advances: number[];
  fontSizes: number[];
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

      let text = "";
      const covered: boolean[] = [];
      const advances: number[] = [];
      const fontSizes: number[] = [];

      for (const raw of content.items) {
        const item = toTextItemGeometry(raw as Parameters<typeof toTextItemGeometry>[0]);
        if (!item) continue;

        // Mark the characters of this run that any rectangle covers. Positions
        // are what drives deletion, so they are tracked per character rather
        // than reduced to a set of strings.
        const flags = new Array<boolean>(item.str.length).fill(false);
        for (const rect of rects) {
          const range = rectToCharRange(item, rect);
          if (!range) continue;
          for (let i = range[0]; i < range[1]; i++) flags[i] = true;
        }

        text += item.str;
        covered.push(...flags);
        const perChar = item.width / item.str.length;
        for (let i = 0; i < item.str.length; i++) {
          advances.push(perChar);
          fontSizes.push(item.fontSize);
        }
      }

      const strings = coveredRuns(text, covered);
      if (strings.length === 0) continue;

      results.push({
        pageNumber,
        // Longest first, so a wider match is blanked before any substring of it.
        strings: strings.sort((a, b) => b.length - a.length),
        text,
        covered,
        advances,
        fontSizes,
      });
    }
  } finally {
    await task.destroy();
  }

  return results;
}

/** Distinct contiguous stretches of covered text, for verification and fallback. */
function coveredRuns(text: string, covered: boolean[]): string[] {
  const runs = new Set<string>();
  let start = -1;

  for (let i = 0; i <= covered.length; i++) {
    if (i < covered.length && covered[i]) {
      if (start === -1) start = i;
      continue;
    }
    if (start !== -1) {
      const run = text.slice(start, i);
      if (run.trim()) runs.add(run);
      start = -1;
    }
  }

  return [...runs];
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
