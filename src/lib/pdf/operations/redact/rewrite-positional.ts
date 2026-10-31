/**
 * Rewrites a text-showing operator so the covered characters are gone and the
 * uncovered ones stay exactly where they were.
 *
 * Replacing covered characters with spaces was not enough. A space is much
 * narrower than the text it replaces, so everything after it on the line slid
 * left — in one case far enough to end up underneath the black box that was
 * supposed to be hiding something else.
 *
 * So the removed advance is given back explicitly. In a TJ array a number
 * displaces the next glyph by `-n/1000 x fontSize`, which means a removed width
 * `w` is restored with `n = -1000 x w / fontSize`. Both values come from PDF.js,
 * so no font metrics are needed, and because the ratio is taken in one space it
 * is unaffected by any enclosing transform.
 */
import { splitArrayElements, toHexString } from "./pdf-strings";
import type { ShowOperation } from "./show-operators";
import type { CharMetric } from "./char-metric";

/** Segments of one string element: kept text and the gaps left behind. */
type Segment = { kind: "text"; value: string } | { kind: "gap"; units: number };

/**
 * Fallback when the font's metrics could not be read: convert the average
 * advance PDF.js reported. Less accurate, which is what FM-013 is about.
 */
function estimatedUnits(width: number, fontSize: number): number {
  if (!fontSize) return 0;
  return -1000 * (width / fontSize);
}

/** Splits one element's characters into kept text and width-preserving gaps. */
function segmentsFor(text: string, metrics: CharMetric[]): Segment[] {
  const segments: Segment[] = [];
  let kept = "";
  let gapUnits = 0;
  let gapWidth = 0;
  let gapFontSize = 0;

  const flushKept = () => {
    if (kept) {
      segments.push({ kind: "text", value: kept });
      kept = "";
    }
  };
  const flushGap = () => {
    if (gapUnits === 0 && gapWidth === 0) return;
    // Exact units are summed from the font's metrics; the estimate is only
    // used for characters whose width could not be read.
    const units = gapUnits + (gapWidth > 0 ? estimatedUnits(gapWidth, gapFontSize) : 0);
    segments.push({ kind: "gap", units });
    gapUnits = 0;
    gapWidth = 0;
    gapFontSize = 0;
  };

  for (let i = 0; i < text.length; i++) {
    const metric = metrics[i];
    if (metric?.covered) {
      flushKept();
      if (metric.tjUnits !== null) {
        gapUnits += metric.tjUnits;
      } else {
        gapWidth += metric.advance;
        if (!gapFontSize) gapFontSize = metric.fontSize;
      }
    } else {
      flushGap();
      kept += text[i];
    }
  }

  flushKept();
  flushGap();
  return segments;
}

function renderSegments(segments: Segment[]): string {
  return segments
    .map((segment) =>
      segment.kind === "text"
        ? toHexString(segment.value)
        : segment.units.toFixed(2)
    )
    .join(" ");
}

/**
 * Replacement source for `operation`, or null when none of its characters are
 * covered and it should be left alone.
 */
export function rewritePositional(
  source: string,
  operation: ShowOperation,
  metrics: CharMetric[]
): string | null {
  if (!metrics.some((metric) => metric.covered)) return null;

  let body: string;

  if (operation.operator === "TJ") {
    const raw = source.slice(operation.start, operation.end);
    const open = raw.indexOf("[");
    const close = raw.lastIndexOf("]");
    if (open === -1 || close === -1) return null;

    // Keep the array's own kerning numbers; only the string elements change.
    let cursor = 0;
    body = splitArrayElements(raw.slice(open + 1, close))
      .map((element) => {
        if (element.kind !== "string") return element.raw;
        const slice = metrics.slice(cursor, cursor + element.text.length);
        cursor += element.text.length;
        return renderSegments(segmentsFor(element.text, slice));
      })
      .join(" ");
  } else {
    body = renderSegments(segmentsFor(operation.text, metrics));
  }

  // ' and " also advance to the next line, which must be preserved.
  if (operation.operator === "'") return `T* [${body}] TJ`;
  if (operation.operator === '"' && operation.quoteSpacing) {
    const [wordSpacing, charSpacing] = operation.quoteSpacing;
    return `${wordSpacing} Tw ${charSpacing} Tc T* [${body}] TJ`;
  }
  return `[${body}] TJ`;
}
