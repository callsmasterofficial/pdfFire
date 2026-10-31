/**
 * Rewrites one page's content stream so the covered characters are gone.
 *
 * Prefers deleting by position, which needs the content-stream operators and
 * the PDF.js runs to be aligned. Where they cannot be aligned it falls back to
 * deleting every occurrence of the covered text, which is less precise but
 * never leaves part of a redaction behind.
 */
import { alignCoverage } from "./align-coverage";
import { blankAcrossOperations, rewriteShowOperation } from "./blank-text";
import { rewritePositional } from "./rewrite-positional";
import type { ShowOperationWithState } from "./text-state";

/**
 * `positional` deleted exactly the characters under the rectangles.
 * `content` could not align the two views of the page and fell back to
 * deleting every occurrence of the covered text, which can remove identical
 * text elsewhere on the same page.
 */
export type RemovalPrecision = "positional" | "content";

export function rewriteContent(
  content: string,
  targets: string[],
  coverage: {
    text: string;
    covered: boolean[];
    advances: number[];
    fontSizes: number[];
  },
  operations: ShowOperationWithState[],
  displacements: (number | null)[][]
): { content: string; removed: number; precision: RemovalPrecision } {
  if (operations.length === 0) {
    return { content, removed: 0, precision: "positional" };
  }

  const operatorTexts = operations.map((operation) => operation.text);

  // Prefer deleting by position. Content matching is the fallback, because it
  // removes every occurrence of the covered text rather than the covered one.
  const metrics = alignCoverage(operatorTexts, coverage);
  // Replace the averaged advance with the font's own metrics where available,
  // so the width given back after deletion is exact.
  if (metrics) {
    metrics.forEach((operatorMetrics, operatorIndex) => {
      operatorMetrics.forEach((metric, charIndex) => {
        metric.tjUnits = displacements[operatorIndex]?.[charIndex] ?? null;
      });
    });
  }
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

