/**
 * Exact TJ displacements for the characters each show operator paints.
 *
 * A TJ number displaces the next glyph by `-n/1000 x fontSize x Th`, and the
 * advance of a character is `(W/1000 x fontSize + Tc + Tw) x Th`. Equating the
 * two cancels both the font size and the horizontal scaling, leaving
 *
 *   n = -(W + 1000 x (Tc + Tw) / fontSize)
 *
 * so the number to restore a deleted character's advance needs only its width
 * from the font and the spacing in effect. Horizontal scaling must *not* be
 * applied here, because TJ displacement is scaled by it already.
 */
import { PDFDict, PDFDocument, PDFName, PDFPage } from "pdf-lib";
import { buildWidthLookup, type WidthLookup } from "../../text/glyph-widths";
import type { ShowOperationWithState } from "./text-state";

function fontResources(doc: PDFDocument, page: PDFPage): PDFDict | undefined {
  const resources = doc.context.lookupMaybe(page.node.get(PDFName.of("Resources")), PDFDict);
  return doc.context.lookupMaybe(resources?.get(PDFName.of("Font")), PDFDict);
}

/** Width lookup for each operator, by index. Shared with coverage. */
export async function buildOperatorLookups(
  doc: PDFDocument,
  page: PDFPage,
  operations: ShowOperationWithState[]
): Promise<(WidthLookup | undefined)[]> {
  const fonts = fontResources(doc, page);
  const byName = new Map<string, WidthLookup>();

  for (const operation of operations) {
    const name = operation.state.fontName;
    if (!name || byName.has(name)) continue;
    const dict = fonts
      ? doc.context.lookupMaybe(fonts.get(PDFName.of(name)), PDFDict)
      : undefined;
    byName.set(
      name,
      dict ? await buildWidthLookup(doc, dict) : { widthOf: () => null, exact: false }
    );
  }

  return operations.map((operation) => byName.get(operation.state.fontName));
}

/**
 * Per operator, per character: the TJ units that give its advance back, or null
 * where the font's metrics could not be read.
 */
export function exactDisplacements(
  operations: ShowOperationWithState[],
  lookups: (WidthLookup | undefined)[]
): (number | null)[][] {
  return operations.map((operation, operatorIndex) => {
    const lookup = lookups[operatorIndex];
    const { fontSize, charSpacing, wordSpacing } = operation.state;

    return [...operation.text].map((char) => {
      const code = char.charCodeAt(0);
      const width = lookup?.widthOf(code);
      if (width === null || width === undefined || !fontSize) return null;

      const spacing = charSpacing + (code === 32 ? wordSpacing : 0);
      return -(width + (1000 * spacing) / fontSize);
    });
  });
}
