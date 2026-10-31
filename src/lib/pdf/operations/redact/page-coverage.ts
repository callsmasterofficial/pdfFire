/**
 * Works out exactly which characters a redaction rectangle covers.
 *
 * Positions come from PDF.js, widths from the fonts themselves. Combining them
 * gives a real position for every character, instead of the per-run average
 * that previously made a box drawn around "555-0100" also take " an".
 *
 * The advance of a character is `(W/1000 x Tfs + Tc + Tw) x Th`, in text space.
 * PDF.js reports a run's size already multiplied by the text and current
 * transformation matrices, so scaling by `reportedSize / Tfs` lifts the advance
 * into the same space as the rectangles. Tfs cancels out of the glyph term,
 * leaving `(W/1000 + (Tc + Tw)/Tfs) x Th x reportedSize`.
 *
 * When a font's metrics cannot be read, that run falls back to PDF.js's average
 * width and the result says so, so the imprecision is reported rather than
 * hidden.
 */
import type { TextItemGeometry } from "../../text/text-item-geometry";
import { itemBottom, itemTop, type Rect } from "../../text/text-item-geometry";
import type { WidthLookup } from "../../text/glyph-widths";
import type { Alignment } from "./align-sequences";
import type { ShowOperationWithState } from "./text-state";

export interface CoverageInput {
  items: TextItemGeometry[];
  operations: ShowOperationWithState[];
  alignment: Alignment;
  /** Width lookup for each operator, by index. */
  lookups: (WidthLookup | undefined)[];
}

export interface PageCoverage {
  /** Page text, concatenated from the runs. */
  text: string;
  /** Per character of `text`: does it lie inside a rectangle. */
  covered: boolean[];
  /** True when every run's widths came from real font metrics. */
  exactWidths: boolean;
  /** Per character: the advance used, in the rectangles' space. */
  advances: number[];
  /** Per character: the size of the run it belongs to. */
  fontSizes: number[];
}

/** Advance of one page character in the space the rectangles use. */
function advanceOfPageChar(
  input: CoverageInput,
  pageIndex: number,
  item: TextItemGeometry
): { advance: number; exact: boolean } {
  const fallback = item.width / item.str.length;
  const operatorChar = input.alignment.operatorCharOf[pageIndex];
  if (operatorChar === -1) return { advance: fallback, exact: false };

  const operatorIndex = input.alignment.operatorOf[operatorChar];
  const operation = input.operations[operatorIndex];
  const lookup = input.lookups[operatorIndex];
  if (!operation || !lookup) return { advance: fallback, exact: false };

  const offset = input.alignment.offsetOf[operatorChar];
  const code = operation.text.charCodeAt(offset);
  const width = lookup.widthOf(code);
  const { fontSize, charSpacing, wordSpacing, horizontalScale } = operation.state;
  if (width === null || !fontSize) return { advance: fallback, exact: false };

  const spacing = (charSpacing + (code === 32 ? wordSpacing : 0)) / fontSize;
  const advance = (width / 1000 + spacing) * (horizontalScale / 100) * item.fontSize;
  return { advance, exact: true };
}

export function computeCoverage(input: CoverageInput, rects: Rect[]): PageCoverage {
  let text = "";
  const covered: boolean[] = [];
  const advances: number[] = [];
  const fontSizes: number[] = [];
  let exactWidths = true;

  for (const item of input.items) {
    const top = itemTop(item);
    const bottom = itemBottom(item);
    const overlapsVertically = rects.some(
      (rect) => bottom < rect.y + rect.height && top > rect.y
    );

    let x = item.x;
    for (let i = 0; i < item.str.length; i++) {
      const pageIndex = text.length + i;
      const { advance, exact } = advanceOfPageChar(input, pageIndex, item);
      if (!exact) exactWidths = false;

      // A character counts as covered when any part of its advance overlaps,
      // so a partially hidden glyph goes rather than being left as a fragment.
      const isCovered =
        overlapsVertically &&
        rects.some(
          (rect) =>
            bottom < rect.y + rect.height &&
            top > rect.y &&
            x + advance > rect.x &&
            x < rect.x + rect.width
        );

      covered.push(isCovered);
      advances.push(advance);
      fontSizes.push(item.fontSize);
      x += advance;
    }

    text += item.str;
  }

  return { text, covered, exactWidths, advances, fontSizes };
}

/** A pairing that matches nothing, so every advance falls back to the average. */
export function unalignedPairing(pageTextLength: number): Alignment {
  return {
    pageIndexOf: [],
    operatorOf: [],
    offsetOf: [],
    operatorCharOf: new Array<number>(pageTextLength).fill(-1),
  };
}

/** Distinct contiguous stretches of covered text, for reporting and fallback. */
export function coveredRuns(text: string, covered: boolean[]): string[] {
  const runs = new Set<string>();
  let start = -1;

  for (let i = 0; i <= covered.length; i++) {
    if (i < covered.length && covered[i]) {
      if (start === -1) start = i;
      continue;
    }
    if (start !== -1) {
      const run = text.slice(start, i);
      if (run.trim()) runs.add(run);
      start = -1;
    }
  }

  return [...runs];
}
