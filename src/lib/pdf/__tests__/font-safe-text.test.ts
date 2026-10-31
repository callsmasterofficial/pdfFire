import { describe, expect, it } from "vitest";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { FontTextSanitizer, toFileSlug } from "../text/font-safe-text";

async function sanitizerFor(...fonts: StandardFonts[]) {
  const doc = await PDFDocument.create();
  const embedded = await Promise.all(fonts.map((font) => doc.embedFont(font)));
  return { sanitizer: new FontTextSanitizer(embedded), fonts: embedded };
}

describe("FontTextSanitizer", () => {
  it("keeps every character the font can encode", async () => {
    const { sanitizer } = await sanitizerFor(StandardFonts.Helvetica);
    const input = "Café résumé Zürich €5 © “quoted” – dash ñ ø å";
    expect(sanitizer.sanitize(input)).toBe(input);
    expect(sanitizer.report().isLossless).toBe(true);
  });

  it("produces text the font can actually draw", async () => {
    const { sanitizer, fonts } = await sanitizerFor(StandardFonts.Helvetica);
    const output = sanitizer.sanitize("Łódź Tiếng Việt 中文 😀");
    // The contract that matters: drawText must not throw on the result.
    expect(() => fonts[0].widthOfTextAtSize(output, 12)).not.toThrow();
  });

  it("folds diacritics off Latin letters instead of dropping them", async () => {
    const { sanitizer } = await sanitizerFor(StandardFonts.Helvetica);
    expect(sanitizer.sanitize("Tiếng Việt")).toBe("Tieng Viet");
    expect(sanitizer.sanitize("Łódź")).toBe("Lódz");
    expect(sanitizer.report().approximatedCharacters.length).toBeGreaterThan(0);
  });

  it("reports scripts it cannot represent at all", async () => {
    const { sanitizer } = await sanitizerFor(StandardFonts.Helvetica);
    sanitizer.sanitize("中文 العربية हिन्दी");
    const report = sanitizer.report();

    expect(report.isLossless).toBe(false);
    expect(report.droppedCharacters).toContain("中");
    expect(report.droppedCount).toBeGreaterThan(0);
  });

  it("drops zero-width formatting characters without reporting a loss", async () => {
    const { sanitizer } = await sanitizerFor(StandardFonts.Helvetica);
    expect(sanitizer.sanitize("in​visible﻿")).toBe("invisible");
    expect(sanitizer.report().isLossless).toBe(true);
  });

  it("preserves newlines and tabs", async () => {
    const { sanitizer } = await sanitizerFor(StandardFonts.Helvetica);
    expect(sanitizer.sanitize("a\nb\tc")).toBe("a\nb\tc");
  });

  it("normalises decomposed input so encodable characters survive", async () => {
    const { sanitizer } = await sanitizerFor(StandardFonts.Helvetica);
    // "e" + combining acute is the same character as "é" once normalised.
    expect(sanitizer.sanitize("Café")).toBe("Café");
    expect(sanitizer.report().isLossless).toBe(true);
  });
});

describe("toFileSlug", () => {
  it("keeps the document's own script", () => {
    expect(toFileSlug("Déjà Vu Rapport")).toBe("déjà-vu-rapport");
    expect(toFileSlug("予算 2026")).toBe("予算-2026");
  });

  it("falls back when nothing usable remains", () => {
    expect(toFileSlug("!!! ---", "spreadsheet")).toBe("spreadsheet");
  });
});
