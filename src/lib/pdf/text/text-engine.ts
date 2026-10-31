/**
 * How a converter measures and draws a string.
 *
 * The table renderers used to take a `PDFFont` and call it directly, which
 * limited them to whatever that one font could encode. A document may need
 * several fonts — Latin from the standard set, Chinese from a language pack —
 * so measuring and drawing are expressed as operations rather than as a font.
 *
 * `standardFontEngine` keeps the old single-font behaviour for callers that do
 * not need packs; `writerEngine` switches fonts mid-string.
 */
import type { PDFFont, PDFPage, rgb } from "pdf-lib";
import type { UnicodeTextWriter } from "./unicode-text";

export interface DrawOptions {
  x: number;
  y: number;
  size: number;
  font: PDFFont;
  color?: ReturnType<typeof rgb>;
  /** 0 draws nothing visible, as a searchable OCR layer needs. */
  opacity?: number;
}

export interface TextEngine {
  measure(text: string, size: number, font: PDFFont): number;
  draw(page: PDFPage, text: string, options: DrawOptions): void;
}

/** Measures and draws with exactly the font given, as pdf-lib does. */
export const standardFontEngine: TextEngine = {
  measure: (text, size, font) => font.widthOfTextAtSize(text, size),
  draw: (page, text, options) =>
    page.drawText(text, {
      x: options.x,
      y: options.y,
      size: options.size,
      font: options.font,
      color: options.color,
      opacity: options.opacity,
    }),
};

/** Measures and draws through the language-pack writer. */
export function writerEngine(writer: UnicodeTextWriter): TextEngine {
  return {
    measure: (text, size, font) => writer.widthOf(text, size, font),
    draw: (page, text, options) => {
      writer.draw(page, text, {
        x: options.x,
        y: options.y,
        size: options.size,
        baseFont: options.font,
        color: options.color,
        opacity: options.opacity,
      });
    },
  };
}
