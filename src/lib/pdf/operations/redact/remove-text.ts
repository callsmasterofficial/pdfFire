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
import { alignCoverage } from "./align-coverage";
import { blankAcrossOperations, rewriteShowOperation } from "./blank-text";
import { rewritePositional } from "./rewrite-positional";
import { findShowOperations } from "./show-operators";
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

/**
 * `positional` deleted exactly the characters under the rectangles.
 * `content` could not align the two views of the page and fell back to
 * deleting every occurrence of the covered text, which can remove identical
 * text elsewhere on the same page.
 */
export type RemovalPrecision = "positional" | "content";

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

function rewriteContent(
  content: string,
  targets: string[],
  coverage: {
    text: string;
    covered: boolean[];
    advances: number[];
    fontSizes: number[];
  }
): { content: string; removed: number; precision: RemovalPrecision } {
  const operations = findShowOperations(content);
  if (operations.length === 0) {
    return { content, removed: 0, precision: "positional" };
  }

  const operatorTexts = operations.map((operation) => operation.text);

  // Prefer deleting by position. Content matching is the fallback, because it
  // removes every occurrence of the covered text rather than the covered one.
  const metrics = alignCoverage(operatorTexts, coverage);
  const precision: RemovalPrecision = metrics ? "positional" : "content";
  const blankedTexts = metrics
    ? operatorTexts
    : blankAcrossOperations(operatorTexts, targets);

  let next = content;
  let removed = 0;

  // Reverse order, because a replacement may differ in length from what it
  // replaces and earlier offsets must stay valid.
  for (let i = operations.length - 1; i >= 0; i--) {
    const operation = operations[i];
    const replacement = metrics
      ? rewritePositional(content, operation, metrics[i])
      : rewriteShowOperation(content, operation, blankedTexts[i]);
    if (replacement === null) continue;
    next = next.slice(0, operation.start) + replacement + next.slice(operation.end);
    removed++;
  }

  return { content: next, removed, precision };
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
    const rewrite = rewriteContent(content, strings, { text, covered, advances, fontSizes });
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
