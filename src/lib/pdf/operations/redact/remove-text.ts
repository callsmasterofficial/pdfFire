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
import { blankAcrossOperations, rewriteShowOperation } from "./blank-text";
import { findShowOperations } from "./show-operators";
import { findTargetStrings, readPageText, type Rect } from "./text-items";

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
}

function rewriteContent(content: string, targets: string[]): { content: string; removed: number } {
  const operations = findShowOperations(content);
  if (operations.length === 0) return { content, removed: 0 };

  // Blank over the operators' combined text, so a target that spans two of
  // them is still removed.
  const blankedTexts = blankAcrossOperations(
    operations.map((operation) => operation.text),
    targets
  );

  let next = content;
  let removed = 0;

  // Reverse order, because a replacement may differ in length from what it
  // replaces and earlier offsets must stay valid.
  for (let i = operations.length - 1; i >= 0; i--) {
    const operation = operations[i];
    const replacement = rewriteShowOperation(content, operation, blankedTexts[i]);
    if (replacement === null) continue;
    next = next.slice(0, operation.start) + replacement + next.slice(operation.end);
    removed++;
  }

  return { content: next, removed };
}

export async function removeTextInRects(
  pdfBytes: Uint8Array,
  rectsByPage: Map<number, Rect[]>
): Promise<TextRemovalResult> {
  const pageTargets = await findTargetStrings(pdfBytes, rectsByPage);

  if (pageTargets.length === 0) {
    return { pdfBytes, removedOperations: 0, pagesChanged: [], verified: true };
  }

  const doc = await PDFDocument.load(pdfBytes);
  const pagesChanged: number[] = [];
  let removedOperations = 0;

  for (const { pageNumber, strings } of pageTargets) {
    const page = doc.getPage(pageNumber - 1);
    const content = readPageContent(doc, page);
    const { content: rewritten, removed } = rewriteContent(content, strings);
    if (removed === 0) continue;

    writePageContent(doc, page, rewritten);
    removedOperations += removed;
    pagesChanged.push(pageNumber);
  }

  const outBytes = await doc.save();
  const failedPages = await verifyRemoval(outBytes, pageTargets);
  if (failedPages.length > 0) throw new RedactionVerificationError(failedPages);

  return { pdfBytes: outBytes, removedOperations, pagesChanged, verified: true };
}

async function verifyRemoval(
  outBytes: Uint8Array,
  pageTargets: Array<{ pageNumber: number; strings: string[] }>
): Promise<number[]> {
  const pages = await readPageText(outBytes);
  const failed: number[] = [];

  for (const { pageNumber, strings } of pageTargets) {
    const text = pages[pageNumber - 1] ?? "";
    if (strings.some((target) => text.includes(target))) failed.push(pageNumber);
  }

  return failed;
}
