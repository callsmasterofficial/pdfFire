/**
 * Lays out table cell text so it fits its column instead of being cut off.
 *
 * The table renderers used to clip on character count — 22, 25, 26 or 31
 * depending on the renderer — and append "...". That lost data outright, and
 * a character count is the wrong measure anyway: with a proportional font
 * "WWWWWWWWWW" and "iiiiiiiiii" are the same length and nothing like the same
 * width.
 *
 * Cells now wrap to the column width across several lines. A cell is only cut
 * when it still does not fit, and every cut is recorded so the conversion can
 * report it rather than hide it.
 */
import type { PDFFont } from "pdf-lib";
import { standardFontEngine, type TextEngine } from "./text-engine";

export interface CellLayout {
  lines: string[];
  /** True when the text did not fit and was cut. */
  truncated: boolean;
}

export interface TableFidelityReport {
  /** Cells whose text did not fit, even wrapped. */
  truncatedCells: number;
  /** A few of the affected values, for disclosure in the UI. */
  examples: string[];
}

const ELLIPSIS = "...";
const MAX_EXAMPLES = 5;

/**
 * Splits `text` into lines no wider than `maxWidth`. Words that are themselves
 * too wide are broken across lines, since leaving them to overflow would draw
 * over the neighbouring column.
 */
export function wrapToWidth(
  text: string,
  font: PDFFont,
  size: number,
  maxWidth: number,
  engine: TextEngine = standardFontEngine
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";

  const pushLine = () => {
    if (line) {
      lines.push(line);
      line = "";
    }
  };

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (engine.measure(candidate, size, font) <= maxWidth) {
      line = candidate;
      continue;
    }

    pushLine();

    if (engine.measure(word, size, font) <= maxWidth) {
      line = word;
      continue;
    }

    // A single word wider than the column: break it by character.
    let chunk = "";
    for (const char of word) {
      if (engine.measure(chunk + char, size, font) > maxWidth && chunk) {
        lines.push(chunk);
        chunk = char;
      } else {
        chunk += char;
      }
    }
    line = chunk;
  }

  pushLine();
  return lines;
}

/** Trims `line` until it plus an ellipsis fits `maxWidth`. */
function withEllipsis(line: string, font: PDFFont, size: number, maxWidth: number, engine: TextEngine): string {
  let trimmed = line;
  while (
    trimmed &&
    engine.measure(trimmed + ELLIPSIS, size, font) > maxWidth
  ) {
    trimmed = trimmed.slice(0, -1);
  }
  return trimmed + ELLIPSIS;
}

/** Records every cell that had to be cut, so the loss can be reported. */
export class TableFidelityTracker {
  private truncatedCells = 0;
  private readonly examples: string[] = [];

  /** `engine` decides how text is measured, so packs widen it beyond one font. */
  constructor(private readonly engine: TextEngine = standardFontEngine) {}

  layout(
    text: string,
    font: PDFFont,
    size: number,
    maxWidth: number,
    maxLines: number
  ): CellLayout {
    if (!text) return { lines: [], truncated: false };

    const lines = wrapToWidth(text, font, size, maxWidth, this.engine);
    if (lines.length <= maxLines) return { lines, truncated: false };

    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = withEllipsis(kept[maxLines - 1], font, size, maxWidth, this.engine);

    this.truncatedCells++;
    if (this.examples.length < MAX_EXAMPLES) this.examples.push(text);

    return { lines: kept, truncated: true };
  }

  report(): TableFidelityReport {
    return { truncatedCells: this.truncatedCells, examples: [...this.examples] };
  }
}
