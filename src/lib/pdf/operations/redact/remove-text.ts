/**
 * Removes text from a PDF so it can no longer be extracted.
 *
 * Covering text with a filled rectangle changes only the appearance; the
 * characters stay in the content stream and any reader can recover them. This
 * deletes the operators that paint the covered glyphs, then re-reads the
 * exported bytes with an independent parser and refuses to return a document
 * whose targeted text survived.
 */
import { PDFDocument } from "pdf-lib";
import { readPageContent, writePageContent } from "./page-content";
import { exactDisplacements } from "./font-resources";
import { rewriteContent, type RemovalPrecision } from "./rewrite-content";

export type { RemovalPrecision };

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
   * text is gone — but the box now hides a little more than intended, so the
   * output is worth a look.
   */
  shiftedPages: number[];
}

import { findShowOperationsWithState } from "./text-state";
import { findTargetStrings, type Rect } from "./text-items";
import { verifyRemoval } from "./verify-removal";

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

export async function removeTextInRects(
  pdfBytes: Uint8Array,
  rectsByPage: Map<number, Rect[]>
): Promise<TextRemovalResult> {
  const pageTargets = await findTargetStrings(pdfBytes, rectsByPage);

  if (pageTargets.length === 0) {
    return {
      pdfBytes,
      removedOperations: 0,
      pagesChanged: [],
      verified: true,
      contentMatchedPages: [],
      shiftedPages: [],
    };
  }

  const doc = await PDFDocument.load(pdfBytes);
  const pagesChanged: number[] = [];
  const contentMatchedPages: number[] = [];
  let removedOperations = 0;

  for (const { pageNumber, strings, text, covered, advances, fontSizes } of pageTargets) {
    const page = doc.getPage(pageNumber - 1);
    const content = readPageContent(doc, page);
    const operations = findShowOperationsWithState(content);
    const displacements = await exactDisplacements(doc, page, operations);
    const rewrite = rewriteContent(
      content,
      strings,
      { text, covered, advances, fontSizes },
      operations,
      displacements
    );
    if (rewrite.removed === 0) continue;

    writePageContent(doc, page, rewrite.content);
    removedOperations += rewrite.removed;
    pagesChanged.push(pageNumber);
    if (rewrite.precision === "content") contentMatchedPages.push(pageNumber);
  }

  const outBytes = await doc.save();
  const { failedPages, shiftedPages } = await verifyRemoval(
    outBytes,
    rectsByPage,
    new Map(pageTargets.map((page) => [page.pageNumber, page.strings]))
  );
  if (failedPages.length > 0) throw new RedactionVerificationError(failedPages);

  return {
    pdfBytes: outBytes,
    removedOperations,
    pagesChanged,
    verified: true,
    contentMatchedPages,
    shiftedPages,
  };
}
