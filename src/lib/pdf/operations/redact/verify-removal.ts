/**
 * Checks a redaction export and separates the two things that can leave text
 * inside a box.
 */
import { findTargetStrings, type Rect } from "./text-items";

/**
 * Re-reads the export and separates the two things that can leave text inside
 * a redaction box.
 *
 * A **leak** is text we were supposed to delete that is still there. That is a
 * failure and the document is not returned.
 *
 * A **shift** is different: deleting characters removes their advance, and the
 * width given back in its place is derived from PDF.js's average per-character
 * width rather than from true font metrics. So a neighbour that was never
 * covered can drift a point or two under the box. Nothing leaked, but the box
 * hides slightly more than intended, so it is reported rather than treated as a
 * failure.
 *
 * Checking instead that the covered strings are absent from the whole page
 * would fail whenever an identical phrase appears elsewhere and was correctly
 * left alone, reporting a leak that is not one.
 */
export async function verifyRemoval(
  outBytes: Uint8Array,
  rectsByPage: Map<number, Rect[]>,
  originalTargets: Map<number, string[]>
): Promise<{ failedPages: number[]; shiftedPages: number[] }> {
  const remaining = await findTargetStrings(outBytes, rectsByPage);
  const failedPages: number[] = [];
  const shiftedPages: number[] = [];

  for (const page of remaining) {
    const deleted = originalTargets.get(page.pageNumber) ?? [];
    const leaked = page.strings.some((run) =>
      deleted.some((target) => target.includes(run))
    );
    if (leaked) failedPages.push(page.pageNumber);
    else shiftedPages.push(page.pageNumber);
  }

  return { failedPages, shiftedPages };
}
