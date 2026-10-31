/**
 * Rewrites one page's content stream so the covered characters are gone.
 *
 * Prefers deleting by position, which needs the content-stream operators and
 * the PDF.js runs to be aligned. Where they cannot be aligned it falls back to
 * deleting every occurrence of the covered text, which is less precise but
 * never leaves part of a redaction behind.
 */
import type { PageAnalysis } from "./analyze-pages";
import { blankAcrossOperations, rewriteShowOperation } from "./blank-text";
import { rewritePositional } from "./rewrite-positional";

/**
 * `positional` deleted exactly the characters under the rectangles.
 * `content` could not align the two views of the page and fell back to
 * deleting every occurrence of the covered text, which can remove identical
 * text elsewhere on the same page.
 */
export type RemovalPrecision = "positional" | "content";

export function rewriteContent(
  analysis: PageAnalysis
): { content: string; removed: number; precision: RemovalPrecision } {
  const { content, operations, metrics, strings } = analysis;
  if (operations.length === 0) {
    return { content, removed: 0, precision: "positional" };
  }

  const operatorTexts = operations.map((operation) => operation.text);
  const precision: RemovalPrecision = metrics ? "positional" : "content";
  const blankedTexts = metrics ? operatorTexts : blankAcrossOperations(operatorTexts, strings);

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
