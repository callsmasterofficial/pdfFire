/**
 * Page text assembled from PDF.js items, with a way back to each character.
 *
 * Scanning item by item misses anything split across runs: a PDF may paint
 * "john@" and "example.com" as two items, and an email regex applied to each
 * in isolation finds neither. So the page is scanned as one string, and this
 * map converts a match's character range back into per-item ranges for
 * geometry and deletion.
 */
import { toTextItemGeometry, type TextItemGeometry } from "../../text/text-item-geometry";

export interface PageTextMap {
  text: string;
  items: TextItemGeometry[];
  /** For each character of `text`, the item it came from, or -1 for a line break. */
  owners: number[];
  /** For each character of `text`, its offset within its own item. */
  offsets: number[];
}

export interface ItemCharRange {
  itemIndex: number;
  start: number;
  end: number;
}

interface RawItem {
  str?: string;
  transform?: number[];
  width?: number;
  height?: number;
  hasEOL?: boolean;
}

export function buildPageTextMap(rawItems: RawItem[]): PageTextMap {
  const items: TextItemGeometry[] = [];
  const owners: number[] = [];
  const offsets: number[] = [];
  let text = "";

  for (const raw of rawItems) {
    const geometry = toTextItemGeometry(raw);
    if (geometry) {
      const itemIndex = items.length;
      items.push(geometry);
      text += geometry.str;
      for (let i = 0; i < geometry.str.length; i++) {
        owners.push(itemIndex);
        offsets.push(i);
      }
    }

    // A line break keeps separate lines from fusing into a false match.
    if (raw.hasEOL) {
      text += "\n";
      owners.push(-1);
      offsets.push(0);
    }
  }

  return { text, items, owners, offsets };
}

/**
 * The per-item character ranges covered by `[start, end)` of the page text.
 * Line-break positions belong to no item and are skipped.
 */
export function toItemCharRanges(
  map: PageTextMap,
  start: number,
  end: number
): ItemCharRange[] {
  const ranges = new Map<number, { start: number; end: number }>();

  for (let i = Math.max(0, start); i < Math.min(end, map.owners.length); i++) {
    const owner = map.owners[i];
    if (owner < 0) continue;
    const offset = map.offsets[i];
    const existing = ranges.get(owner);
    if (existing) {
      existing.start = Math.min(existing.start, offset);
      existing.end = Math.max(existing.end, offset + 1);
    } else {
      ranges.set(owner, { start: offset, end: offset + 1 });
    }
  }

  return [...ranges.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([itemIndex, range]) => ({ itemIndex, start: range.start, end: range.end }));
}
