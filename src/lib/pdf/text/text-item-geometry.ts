/**
 * Geometry for a run of text as PDF.js reports it.
 *
 * `getTextContent` gives one transform and one width per *item*, not per glyph:
 * `transform` is `[size, 0, 0, size, x, baselineY]` in PDF user space and
 * `width` covers the whole run. Redaction needs the extent of a few characters
 * inside that run, in both directions:
 *
 *   - a matched substring -> the rectangle to cover (PII scanning);
 *   - a drawn rectangle -> the characters to delete (manual redaction).
 *
 * Per-character positions are not available, so both directions interpolate
 * across the run's width. That is approximate for proportional fonts, so every
 * rounding here goes *outward*: a redaction that covers or deletes slightly too
 * much is recoverable, one that leaves part of a secret behind is not.
 */

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TextItemGeometry {
  str: string;
  /** Left edge of the run, in PDF user space. */
  x: number;
  /** Text baseline. Glyphs sit above it; descenders fall below. */
  baselineY: number;
  /** Advance width of the whole run. */
  width: number;
  fontSize: number;
}

/** Glyph extent around the baseline, as a fraction of font size. */
const DESCENT = 0.25;
const ASCENT = 0.9;

/** Outward slack on a horizontal edge, as a fraction of one character width. */
const EDGE_SLACK = 0.25;

export function toTextItemGeometry(item: {
  str?: string;
  transform?: number[];
  width?: number;
  height?: number;
}): TextItemGeometry | null {
  const str = item.str;
  if (typeof str !== "string" || str.length === 0) return null;

  const transform = item.transform ?? [1, 0, 0, 1, 0, 0];
  const fontSize = Math.abs(transform[3]) || item.height || 12;
  return {
    str,
    x: transform[4],
    baselineY: transform[5],
    width: item.width ?? fontSize * 0.5 * str.length,
    fontSize,
  };
}

function charWidth(item: TextItemGeometry): number {
  return item.width / item.str.length;
}

export function itemTop(item: TextItemGeometry): number {
  return item.baselineY + item.fontSize * ASCENT;
}

export function itemBottom(item: TextItemGeometry): number {
  return item.baselineY - item.fontSize * DESCENT;
}

/** Rectangle covering characters `[start, end)` of the run. */
export function charRangeToRect(item: TextItemGeometry, start: number, end: number): Rect {
  const from = Math.max(0, Math.min(start, item.str.length));
  const to = Math.max(from, Math.min(end, item.str.length));
  const per = charWidth(item);
  const slack = per * EDGE_SLACK;

  const left = item.x + per * from - slack;
  const right = item.x + per * to + slack;
  const bottom = itemBottom(item);

  return {
    x: left,
    y: bottom,
    width: Math.max(1, right - left),
    height: Math.max(1, itemTop(item) - bottom),
  };
}

/** Rectangle covering the whole run. */
export function itemRect(item: TextItemGeometry): Rect {
  return charRangeToRect(item, 0, item.str.length);
}

/**
 * Characters of the run that fall inside `rect`, as `[start, end)`, or null
 * when the run does not meet the rectangle. A character counts as covered when
 * any part of its advance overlaps, so partially covered glyphs are included.
 */
export function rectToCharRange(
  item: TextItemGeometry,
  rect: Rect
): [number, number] | null {
  const verticallyOverlaps =
    itemBottom(item) < rect.y + rect.height && itemTop(item) > rect.y;
  if (!verticallyOverlaps) return null;

  const per = charWidth(item);
  if (per <= 0) return null;

  let start: number | null = null;
  let end = 0;

  for (let index = 0; index < item.str.length; index++) {
    const left = item.x + per * index;
    const right = left + per;
    if (right > rect.x && left < rect.x + rect.width) {
      if (start === null) start = index;
      end = index + 1;
    }
  }

  return start === null ? null : [start, end];
}
