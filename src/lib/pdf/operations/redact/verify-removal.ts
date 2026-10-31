/**
 * Checks a redaction export and separates the two things that can leave text
 * inside a box.
 *
 * A **leak** is text we were supposed to delete that is still there. That is a
 * failure and the document is not returned.
 *
 * A **shift** is a neighbour that was never covered drifting under the box.
 * Nothing leaked; the box just hides slightly more than intended, so it is
 * reported rather than treated as a failure.
 *
 * Checking instead that the covered strings are absent from the whole page
 * would fail whenever an identical phrase appears elsewhere and was correctly
 * left alone, reporting a leak that is not one.
 */
import { analyzePages } from "./analyze-pages";
import type { Rect } from "../../text/text-item-geometry";

export async function verifyRemoval(
  outBytes: Uint8Array,
  rectsByPage: Map<number, Rect[]>,
  originalTargets: Map<number, string[]>
): Promise<{ failedPages: number[]; shiftedPages: number[] }> {
  const { analyses } = await analyzePages(outBytes, rectsByPage);
  const failedPages: number[] = [];
  const shiftedPages: number[] = [];

  for (const analysis of analyses) {
    const deleted = originalTargets.get(analysis.pageNumber) ?? [];
    const leaked = analysis.strings.some((run) =>
      deleted.some((target) => target.includes(run))
    );
    if (leaked) failedPages.push(analysis.pageNumber);
    else shiftedPages.push(analysis.pageNumber);
  }

  return { failedPages, shiftedPages };
}
