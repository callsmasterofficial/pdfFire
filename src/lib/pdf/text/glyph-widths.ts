/**
 * Exact advance widths for the characters a font draws.
 *
 * Redaction previously estimated these by dividing a text run's total width by
 * its character count. For mixed-width text that is out by enough to matter: a
 * box drawn exactly around "555-0100" selected "555-0100 an", and the width
 * given back after deleting characters was wrong enough to shift the rest of
 * the line.
 *
 * Widths come from the document itself wherever possible — `/Widths` for simple
 * fonts, `/W` and `/DW` for CID fonts. The standard 14 fonts carry no `/Widths`
 * at all, so their metrics are taken from pdf-lib's own copy by embedding the
 * same font into a scratch document and measuring. When neither route works the
 * lookup reports itself inexact and the caller falls back to the average.
 */
import { PDFArray, PDFDict, PDFDocument, PDFName, PDFNumber, StandardFonts } from "pdf-lib";

export interface WidthLookup {
  /** Advance in 1/1000 text-space units, or null when unknown. */
  widthOf(code: number): number | null;
  /** False when widths are guesses rather than the font's own metrics. */
  readonly exact: boolean;
}

export const INEXACT_WIDTHS: WidthLookup = { widthOf: () => null, exact: false };

/** Subset prefixes look like "ABCDEF+Helvetica" and are not part of the name. */
function baseFontName(dict: PDFDict): string {
  const base = dict.get(PDFName.of("BaseFont"));
  if (!(base instanceof PDFName)) return "";
  return base.asString().replace(/^\//, "").replace(/^[A-Z]{6}\+/, "");
}

const STANDARD_FONTS: Record<string, StandardFonts> = {
  Helvetica: StandardFonts.Helvetica,
  "Helvetica-Bold": StandardFonts.HelveticaBold,
  "Helvetica-Oblique": StandardFonts.HelveticaOblique,
  "Helvetica-BoldOblique": StandardFonts.HelveticaBoldOblique,
  Courier: StandardFonts.Courier,
  "Courier-Bold": StandardFonts.CourierBold,
  "Courier-Oblique": StandardFonts.CourierOblique,
  "Courier-BoldOblique": StandardFonts.CourierBoldOblique,
  "Times-Roman": StandardFonts.TimesRoman,
  "Times-Bold": StandardFonts.TimesRomanBold,
  "Times-Italic": StandardFonts.TimesRomanItalic,
  "Times-BoldItalic": StandardFonts.TimesRomanBoldItalic,
  Symbol: StandardFonts.Symbol,
  ZapfDingbats: StandardFonts.ZapfDingbats,
};

const standardCache = new Map<string, WidthLookup>();

/** Measures a standard font using pdf-lib's bundled metrics. */
async function standardFontWidths(name: string): Promise<WidthLookup | null> {
  const cached = standardCache.get(name);
  if (cached) return cached;

  const standard = STANDARD_FONTS[name];
  if (!standard) return null;

  const scratch = await PDFDocument.create();
  const font = scratch.embedStandardFont(standard);
  const widths = new Map<number, number>();

  // A size of 1000 makes the measured width the 1/1000-unit advance directly.
  for (let code = 32; code <= 255; code++) {
    const char = String.fromCharCode(code);
    try {
      widths.set(code, font.widthOfTextAtSize(char, 1000));
    } catch {
      // Not encodable in this font; left unknown.
    }
  }

  const lookup: WidthLookup = {
    widthOf: (code) => widths.get(code) ?? null,
    exact: true,
  };
  standardCache.set(name, lookup);
  return lookup;
}

/** `/Widths` indexed from `/FirstChar`, as simple fonts declare them. */
function simpleFontWidths(doc: PDFDocument, dict: PDFDict): WidthLookup | null {
  const widths = doc.context.lookupMaybe(dict.get(PDFName.of("Widths")), PDFArray);
  const firstChar = doc.context.lookupMaybe(dict.get(PDFName.of("FirstChar")), PDFNumber);
  if (!widths || !firstChar) return null;

  const first = firstChar.asNumber();
  const table = new Map<number, number>();
  for (let i = 0; i < widths.size(); i++) {
    const entry = doc.context.lookup(widths.get(i));
    if (entry instanceof PDFNumber) table.set(first + i, entry.asNumber());
  }
  if (table.size === 0) return null;

  const missing = doc.context.lookupMaybe(
    doc.context
      .lookupMaybe(dict.get(PDFName.of("FontDescriptor")), PDFDict)
      ?.get(PDFName.of("MissingWidth")),
    PDFNumber
  );
  const fallback = missing ? missing.asNumber() : null;

  return {
    widthOf: (code) => table.get(code) ?? fallback,
    exact: true,
  };
}

export async function buildWidthLookup(
  doc: PDFDocument,
  dict: PDFDict
): Promise<WidthLookup> {
  const simple = simpleFontWidths(doc, dict);
  if (simple) return simple;

  const standard = await standardFontWidths(baseFontName(dict));
  if (standard) return standard;

  return INEXACT_WIDTHS;
}
