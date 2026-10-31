/**
 * Evidence that widths come from real font metrics (FM-013).
 *
 * If the lookup silently returned null the redaction code would fall back to
 * the averaged estimate and nothing would fail loudly, so these tests check
 * both that the widths are present and that they are the right numbers.
 */
import { describe, expect, it } from "vitest";
import { PDFDict, PDFDocument, PDFName, StandardFonts } from "pdf-lib";
import { buildWidthLookup } from "../text/glyph-widths";

async function fontDictOf(bytes: Uint8Array): Promise<{ doc: PDFDocument; dict: PDFDict }> {
  const doc = await PDFDocument.load(bytes);
  const resources = doc.context.lookupMaybe(
    doc.getPage(0).node.get(PDFName.of("Resources")),
    PDFDict
  );
  const fonts = doc.context.lookupMaybe(resources?.get(PDFName.of("Font")), PDFDict);
  const first = fonts!.keys()[0];
  return { doc, dict: doc.context.lookup(fonts!.get(first), PDFDict) };
}

describe("glyph width lookup", () => {
  it("reads standard-14 metrics, which carry no /Widths array", async () => {
    const doc = await PDFDocument.create();
    const page = doc.addPage([400, 200]);
    const font = await doc.embedFont(StandardFonts.Helvetica);
    page.drawText("Wil", { x: 40, y: 100, size: 14, font });
    const bytes = await doc.save();

    const { doc: reloaded, dict } = await fontDictOf(bytes);
    // The dictionary genuinely has no widths of its own.
    expect(dict.get(PDFName.of("Widths"))).toBeUndefined();

    const lookup = await buildWidthLookup(reloaded, dict);
    expect(lookup.exact).toBe(true);

    // Helvetica: "W" is wide, "i" and "l" are narrow. An averaging model treats
    // them as equal, which is what made edge selection inaccurate.
    const w = lookup.widthOf("W".charCodeAt(0))!;
    const i = lookup.widthOf("i".charCodeAt(0))!;
    expect(w).toBeGreaterThan(i * 3);

    // Cross-check against pdf-lib's own measurement at size 1000.
    expect(w).toBeCloseTo(font.widthOfTextAtSize("W", 1000), 1);
    expect(i).toBeCloseTo(font.widthOfTextAtSize("i", 1000), 1);
  });

  it("prefers a /Widths array when the document provides one", async () => {
    const doc = await PDFDocument.create();
    const page = doc.addPage([400, 200]);
    const font = await doc.embedFont(StandardFonts.Helvetica);
    page.drawText("A", { x: 40, y: 100, size: 14, font });
    const bytes = await doc.save();

    const { doc: reloaded, dict } = await fontDictOf(bytes);
    // Give the font explicit widths and check they win over the built-in ones.
    dict.set(PDFName.of("FirstChar"), reloaded.context.obj(65));
    dict.set(PDFName.of("Widths"), reloaded.context.obj([111, 222]));

    const lookup = await buildWidthLookup(reloaded, dict);
    expect(lookup.exact).toBe(true);
    expect(lookup.widthOf(65)).toBe(111);
    expect(lookup.widthOf(66)).toBe(222);
  });

  it("reports itself inexact for a font it cannot measure", async () => {
    const doc = await PDFDocument.create();
    doc.addPage([200, 200]);
    const dict = doc.context.obj({
      Type: "Font",
      Subtype: "Type1",
      BaseFont: "SomeUnknownFont-Regular",
    });

    const lookup = await buildWidthLookup(doc, dict);
    expect(lookup.exact).toBe(false);
    expect(lookup.widthOf(65)).toBeNull();
  });
});
