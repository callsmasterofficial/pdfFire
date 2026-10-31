/**
 * Draws text the standard PDF fonts cannot, by embedding a language pack.
 *
 * The converters previously replaced anything outside the fonts' 218-character
 * repertoire, so Chinese, Arabic, Hebrew, Thai and Indic text came out as
 * question marks. This splits a string into runs one font can draw, embeds the
 * packs those runs need, and reports whatever is still unrepresentable.
 *
 * Fonts are embedded with `subset: true`, which matters a great deal: the CJK
 * pack is 8 MB on disk but contributes around 40 KB to a document that uses a
 * handful of characters.
 */
import type { PDFDocument, PDFFont, PDFPage } from "pdf-lib";
import { rgb } from "pdf-lib";
import { FONT_PACKS, type FontPack, type ScriptId } from "./font-catalog";
import { loadFontPack } from "./font-pack-loader";
import { segmentByFont, type ScriptSegment } from "./scripts";

export interface UnicodeFidelityReport {
  /** Language packs embedded in this document. */
  packsUsed: FontPack[];
  /** Characters no pack covers; these are still replaced. */
  unsupportedCharacters: string[];
  /** True when every character was drawn as authored. */
  isLossless: boolean;
  /**
   * Packs whose text cannot be copied back out of the PDF exactly, because
   * correct shaping reorders and merges glyphs in ways a PDF's character
   * mapping cannot fully invert.
   */
  approximateExtractionPacks: FontPack[];
}

const REPLACEMENT = "?";

const fontkitReady = new WeakSet<PDFDocument>();

/**
 * Registers fontkit, which pdf-lib needs to embed anything but the standard 14
 * fonts. Imported dynamically so neither it nor the regenerator runtime lands
 * in the initial bundle: a Latin-only conversion never loads either.
 *
 * fontkit's Indic and Universal shapers are transpiled with generators and
 * expect a regenerator runtime on the global object. Without it, Devanagari
 * and Thai throw "regeneratorRuntime is not defined" instead of shaping.
 */
async function ensureFontkit(doc: PDFDocument): Promise<void> {
  if (fontkitReady.has(doc)) return;
  await import("regenerator-runtime/runtime.js");
  const fontkit = (await import("@pdf-lib/fontkit")).default;
  doc.registerFontkit(fontkit);
  fontkitReady.add(doc);
}

export class UnicodeTextWriter {
  private readonly fonts = new Map<ScriptId, PDFFont>();
  private readonly unsupported = new Set<string>();

  private constructor(
    private readonly doc: PDFDocument,
    private readonly baseCanDraw: (char: string) => boolean
  ) {}

  /**
   * `baseCanDraw` decides what the document's own fonts already handle, so
   * Latin text keeps using them and downloads nothing.
   */
  static create(doc: PDFDocument, baseCanDraw: (char: string) => boolean): UnicodeTextWriter {
    return new UnicodeTextWriter(doc, baseCanDraw);
  }

  /** Embeds the packs `text` needs. Call before measuring or drawing. */
  async prepare(text: string): Promise<void> {
    const needed = new Set<ScriptId>();
    for (const segment of segmentByFont(text, this.baseCanDraw)) {
      if (segment.kind === "pack" && segment.pack) needed.add(segment.pack);
    }

    if (needed.size === 0) return;
    await ensureFontkit(this.doc);

    for (const pack of needed) {
      if (this.fonts.has(pack)) continue;
      const bytes = await loadFontPack(pack);
      // Subsetting is essential: the CJK pack is 8 MB on disk but adds roughly
      // 40 KB to a document that uses a few dozen characters.
      this.fonts.set(pack, await this.doc.embedFont(bytes, { subset: true }));
    }
  }

  /** Runs of text paired with the font that can draw them. */
  private runs(text: string, baseFont: PDFFont): Array<{ text: string; font: PDFFont }> {
    return segmentByFont(text, this.baseCanDraw).map((segment: ScriptSegment) => {
      if (segment.kind === "base") return { text: segment.text, font: baseFont };

      const font = segment.pack ? this.fonts.get(segment.pack) : undefined;
      if (font) return { text: segment.text, font };

      // No pack covers this run, or the pack failed to load. The characters are
      // recorded and replaced, because drawing them would throw.
      for (const char of segment.text) this.unsupported.add(char);
      return { text: REPLACEMENT.repeat([...segment.text].length), font: baseFont };
    });
  }

  widthOf(text: string, size: number, baseFont: PDFFont): number {
    return this.runs(text, baseFont).reduce(
      (total, run) => total + run.font.widthOfTextAtSize(run.text, size),
      0
    );
  }

  /** Draws `text`, switching fonts mid-string, and returns its width. */
  draw(
    page: PDFPage,
    text: string,
    options: {
      x: number;
      y: number;
      size: number;
      baseFont: PDFFont;
      color?: ReturnType<typeof rgb>;
      /** 0 draws nothing visible, as a searchable OCR layer needs. */
      opacity?: number;
    }
  ): number {
    let x = options.x;
    for (const run of this.runs(text, options.baseFont)) {
      if (!run.text) continue;
      page.drawText(run.text, {
        x,
        y: options.y,
        size: options.size,
        font: run.font,
        color: options.color ?? rgb(0, 0, 0),
        opacity: options.opacity,
      });
      x += run.font.widthOfTextAtSize(run.text, options.size);
    }
    return x - options.x;
  }

  report(): UnicodeFidelityReport {
    const packsUsed = [...this.fonts.keys()].map((pack) => FONT_PACKS[pack]);
    const unsupportedCharacters = [...this.unsupported].sort();
    return {
      packsUsed,
      unsupportedCharacters,
      isLossless: unsupportedCharacters.length === 0,
      approximateExtractionPacks: packsUsed.filter((pack) => pack.extraction === "approximate"),
    };
  }
}
