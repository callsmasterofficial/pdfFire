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
import { findShowOperations, type ShowOperation } from "./show-operators";
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
  /** Show operators deleted from content streams. */
  removedOperations: number;
  /** Pages whose content streams were rewritten. */
  pagesChanged: number[];
  /**
   * True once the exported bytes were re-parsed and none of the targeted text
   * could be extracted.
   */
  verified: boolean;
}

/** Replacement that keeps byte length, so later offsets stay valid. */
function neutralize(operation: ShowOperation): string {
  const span = operation.end - operation.start;

  if (operation.operator === "'") {
    return padTo("T*", span);
  }

  if (operation.operator === '"' && operation.quoteSpacing) {
    const [wordSpacing, charSpacing] = operation.quoteSpacing;
    const preserved = `${wordSpacing} Tw ${charSpacing} Tc T*`;
    if (preserved.length <= span) return padTo(preserved, span);
    return padTo("T*", span);
  }

  return " ".repeat(span);
}

function padTo(text: string, span: number): string {
  return text.length >= span ? text.slice(0, span) : text + " ".repeat(span - text.length);
}

function rewriteContent(content: string, targets: string[]): { content: string; removed: number } {
  const operations = findShowOperations(content);
  if (operations.length === 0) return { content, removed: 0 };

  let next = content;
  let removed = 0;

  // Offsets stay valid because every replacement keeps the original length.
  for (const operation of operations) {
    if (!targets.some((target) => operation.text.includes(target))) continue;
    next =
      next.slice(0, operation.start) + neutralize(operation) + next.slice(operation.end);
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
