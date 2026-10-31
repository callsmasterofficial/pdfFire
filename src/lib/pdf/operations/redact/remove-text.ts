/**
 * Removes text from a PDF so it can no longer be extracted.
 *
 * Covering text with a filled rectangle changes only the appearance; the
 * characters stay in the content stream and any reader can recover them. This
 * deletes the characters under each rectangle, then re-reads the exported bytes
 * and refuses to return a document whose targeted text survived.
 */
import { analyzePages } from "./analyze-pages";
import { writePageContent } from "./page-content";
import { rewriteContent, type RemovalPrecision } from "./rewrite-content";
import type { Rect } from "../../text/text-item-geometry";
import { verifyRemoval } from "./verify-removal";

export type { RemovalPrecision };

export class RedactionVerificationError extends Error {
  readonly pages: number[];
  constructor(pages: number[]) {
    super(
      `Redaction could not be verified on page(s) ${pages.join(", ")}: targeted text is still extractable. ` +
        "The document was not modified."
    );
    this.name = "RedactionVerificationError";
    this.pages = pages;
  }
}

export interface TextRemovalResult {
  pdfBytes: Uint8Array;
  /** Show operators rewritten to drop covered characters. */
  removedOperations: number;
  /** Pages whose content streams were rewritten. */
  pagesChanged: number[];
  /**
   * True once the exported bytes were re-parsed and none of the targeted text
   * could be extracted.
   */
  verified: boolean;
  /** Pages where deletion had to fall back to content matching. */
  contentMatchedPages: number[];
  /**
   * Pages where uncovered text shifted under a box. Not a leak — the removed
   * text is gone — but the box now hides a little more than intended.
   */
  shiftedPages: number[];
  /** Pages whose fonts' widths could not be read, so selection was estimated. */
  estimatedWidthPages: number[];
}

export async function removeTextInRects(
  pdfBytes: Uint8Array,
  rectsByPage: Map<number, Rect[]>
): Promise<TextRemovalResult> {
  const { doc, analyses } = await analyzePages(pdfBytes, rectsByPage);

  if (analyses.length === 0) {
    return {
      pdfBytes,
      removedOperations: 0,
      pagesChanged: [],
      verified: true,
      contentMatchedPages: [],
      shiftedPages: [],
      estimatedWidthPages: [],
    };
  }

  const pagesChanged: number[] = [];
  const contentMatchedPages: number[] = [];
  const estimatedWidthPages: number[] = [];
  let removedOperations = 0;

  for (const analysis of analyses) {
    const rewrite = rewriteContent(analysis);
    if (rewrite.removed === 0) continue;

    writePageContent(doc, doc.getPage(analysis.pageNumber - 1), rewrite.content);
    removedOperations += rewrite.removed;
    pagesChanged.push(analysis.pageNumber);
    if (rewrite.precision === "content") contentMatchedPages.push(analysis.pageNumber);
    if (!analysis.coverage.exactWidths) estimatedWidthPages.push(analysis.pageNumber);
  }

  const outBytes = await doc.save();
  const { failedPages, shiftedPages } = await verifyRemoval(
    outBytes,
    rectsByPage,
    new Map(analyses.map((analysis) => [analysis.pageNumber, analysis.strings]))
  );
  if (failedPages.length > 0) throw new RedactionVerificationError(failedPages);

  return {
    pdfBytes: outBytes,
    removedOperations,
    pagesChanged,
    verified: true,
    contentMatchedPages,
    shiftedPages,
    estimatedWidthPages,
  };
}
