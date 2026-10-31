/**
 * One pass that works out, for each page, what a redaction must delete.
 *
 * Both the removal and the verification afterwards need the same answer, so
 * they share this. It combines the three sources the decision depends on: the
 * content stream's operators and text state, PDF.js's run positions, and the
 * fonts' own widths.
 */
import { PDFDocument } from "pdf-lib";
import type { Rect } from "../../text/text-item-geometry";
import { alignSequences } from "./align-sequences";
import type { CharMetric } from "./char-metric";
import { buildOperatorLookups, exactDisplacements } from "./font-resources";
import {
  computeCoverage,
  coveredRuns,
  unalignedPairing,
  type PageCoverage,
} from "./page-coverage";
import { readPageContent } from "./page-content";
import { readPageItems } from "./page-items";
import { findShowOperationsWithState, type ShowOperationWithState } from "./text-state";

export interface PageAnalysis {
  pageNumber: number;
  content: string;
  operations: ShowOperationWithState[];
  coverage: PageCoverage;
  /** Covered text, longest first, for the content-matching fallback. */
  strings: string[];
  /**
   * Per operator, per character: what to delete and how much width to give
   * back. Null when the two views of the page could not be paired, in which
   * case the caller must fall back to matching by content.
   */
  metrics: CharMetric[][] | null;
}

export async function analyzePages(
  bytes: Uint8Array,
  rectsByPage: Map<number, Rect[]>
): Promise<{ doc: PDFDocument; analyses: PageAnalysis[] }> {
  const doc = await PDFDocument.load(bytes);
  const pageNumbers = [...rectsByPage.keys()].filter(
    (pageNumber) => pageNumber >= 1 && pageNumber <= doc.getPageCount()
  );
  const itemsByPage = await readPageItems(bytes, pageNumbers);
  const analyses: PageAnalysis[] = [];

  for (const pageNumber of pageNumbers) {
    const rects = rectsByPage.get(pageNumber) ?? [];
    const items = itemsByPage.get(pageNumber) ?? [];
    if (rects.length === 0 || items.length === 0) continue;

    const page = doc.getPage(pageNumber - 1);
    const content = readPageContent(doc, page);
    const operations = findShowOperationsWithState(content);
    const lookups = await buildOperatorLookups(doc, page, operations);

    const pageText = items.map((item) => item.str).join("");
    const alignment = alignSequences(
      operations.map((operation) => operation.text),
      pageText
    );

    const coverage = computeCoverage(
      {
        items,
        operations,
        alignment: alignment ?? unalignedPairing(pageText.length),
        lookups,
      },
      rects
    );

    const strings = coveredRuns(coverage.text, coverage.covered).sort(
      (a, b) => b.length - a.length
    );
    if (strings.length === 0) continue;

    analyses.push({
      pageNumber,
      content,
      operations,
      coverage,
      strings,
      metrics: alignment
        ? buildMetrics(operations, alignment, coverage, exactDisplacements(operations, lookups))
        : null,
    });
  }

  return { doc, analyses };
}

/** Projects per-character coverage back onto the operators that paint it. */
function buildMetrics(
  operations: ShowOperationWithState[],
  alignment: ReturnType<typeof alignSequences> & object,
  coverage: PageCoverage,
  displacements: (number | null)[][]
): CharMetric[][] {
  const metrics = operations.map((operation) =>
    Array.from({ length: operation.text.length }, (): CharMetric => ({
      covered: false,
      advance: 0,
      fontSize: 0,
      tjUnits: null,
    }))
  );

  for (let pageIndex = 0; pageIndex < coverage.covered.length; pageIndex++) {
    if (!coverage.covered[pageIndex]) continue;
    const operatorChar = alignment.operatorCharOf[pageIndex];
    if (operatorChar === -1) continue;

    const operatorIndex = alignment.operatorOf[operatorChar];
    const offset = alignment.offsetOf[operatorChar];
    const target = metrics[operatorIndex]?.[offset];
    if (!target) continue;

    target.covered = true;
    target.advance = coverage.advances[pageIndex] ?? 0;
    target.fontSize = coverage.fontSizes[pageIndex] ?? 0;
    target.tjUnits = displacements[operatorIndex]?.[offset] ?? null;
  }

  return metrics;
}
