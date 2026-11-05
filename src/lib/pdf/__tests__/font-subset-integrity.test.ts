import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
// Same order as `ensureFontkit` in unicode-text.ts: fontkit's Indic and
// Universal shapers are transpiled with generators and need this on the
// global object, or Devanagari and Thai throw instead of shaping.
import "regenerator-runtime/runtime.js";
import fontkit from "@pdf-lib/fontkit";
import { FONT_PACKS } from "../text/font-catalog";

/**
 * Every pack must survive subsetting with its glyph outlines intact.
 *
 * This is the check that was missing. CJK PDFs shipped visually broken —
 * CoreGraphics drew `! " #`, MuPDF drew nothing — while every existing test
 * passed, because they all asserted on *extracted text*, and extraction keeps
 * working when the embedded font program is corrupt. The ToUnicode CMap is
 * independent of the outlines.
 *
 * The cause: fontkit writes short-format `loca`, which stores each glyph
 * offset halved, so an offset can only be even. Copying a glyph whose data
 * length is odd pushes the next glyph to an odd offset that cannot be
 * represented, and every glyph after it is read from the wrong place. Roughly
 * half of Noto Sans SC's glyphs had odd lengths, so about half of any CJK
 * document was destroyed.
 *
 * The fix is in the shipped font, not in this code path: its glyph data is
 * padded to even lengths, so every offset stays representable. These tests
 * hold that property in place — swap in an unpadded font and they fail.
 */
const FONT_DIR = join(process.cwd(), "public", "fonts");

const encodeSubset = (subset: { encodeStream(): NodeJS.ReadableStream }) =>
  new Promise<Buffer>((resolve, reject) => {
    const parts: Buffer[] = [];
    subset
      .encodeStream()
      .on("data", (b: Buffer) => parts.push(b))
      .on("end", () => resolve(Buffer.concat(parts)))
      .on("error", reject);
  });

/** Subsets `text` exactly as pdf-lib's CustomFontSubsetEmbedder does. */
async function subsetAndDecode(file: string, text: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const font: any = fontkit.create(readFileSync(join(FONT_DIR, file)));
  const { glyphs } = font.layout(text);
  const subset = font.createSubset();
  const ids: number[] = glyphs.map((g: unknown) => subset.includeGlyph(g));
  const bytes = await encodeSubset(subset);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const reparsed: any = fontkit.create(bytes);
  const corrupt: number[] = [];
  for (const id of new Set(ids)) {
    try {
      // Reading the path forces the outline to be decoded, which is where
      // a corrupt glyph shows up.
      const commands = reparsed.getGlyph(id).path.commands;
      if (!Array.isArray(commands)) corrupt.push(id);
    } catch {
      corrupt.push(id);
    }
  }
  return { corrupt, total: new Set(ids).size, bytes: bytes.byteLength };
}

const SAMPLES: Record<string, string> = {
  latin: "The quick brown fox jumps over the lazy dog, 0123456789.",
  cjk:
    "快速的棕色狐狸跳过了懒惰的狗。永和九年岁在癸丑暮春之初，" +
    "会于会稽山阴之兰亭，修禊事也。日本語の文書、ひらがなとカタカナ。",
  arabic: "النص العربي للاختبار",
  devanagari: "यह एक परीक्षण है",
  hebrew: "זהו טקסט לבדיקה",
  thai: "นี่คือข้อความทดสอบ",
};

describe("subsetting keeps glyph outlines intact", () => {
  it.each(Object.values(FONT_PACKS).map((p) => [p.id, p.file] as const))(
    "%s subsets without corrupting any glyph",
    async (id, file) => {
      const text = SAMPLES[id] ?? SAMPLES.latin;
      const { corrupt, total } = await subsetAndDecode(file, text);
      expect(
        corrupt,
        `${file}: ${corrupt.length} of ${total} glyphs could not be decoded ` +
          `after subsetting. Check the font's glyph data is padded to even lengths.`
      ).toEqual([]);
      expect(total).toBeGreaterThan(0);
    }
  );

  it("the CJK pack has no odd-length glyph data, which is what breaks it", async () => {
    const file = FONT_PACKS.cjk.file;
    const data = readFileSync(join(FONT_DIR, file));

    // Read loca directly rather than trusting a library to agree with itself.
    const u16 = (o: number) => data.readUInt16BE(o);
    const u32 = (o: number) => data.readUInt32BE(o);
    const numTables = u16(4);
    const tables = new Map<string, { off: number; len: number }>();
    for (let i = 0; i < numTables; i += 1) {
      const rec = 12 + i * 16;
      tables.set(data.toString("latin1", rec, rec + 4), {
        off: u32(rec + 8),
        len: u32(rec + 12),
      });
    }
    const head = tables.get("head")!;
    const loca = tables.get("loca")!;
    const indexToLocFormat = data.readInt16BE(head.off + 50);

    const offsets: number[] = [];
    if (indexToLocFormat === 0) {
      for (let o = loca.off; o < loca.off + loca.len; o += 2) offsets.push(u16(o) * 2);
    } else {
      for (let o = loca.off; o < loca.off + loca.len; o += 4) offsets.push(u32(o));
    }

    const odd = offsets.filter((o) => o % 2 !== 0);
    expect(
      odd.length,
      `${odd.length} glyph offsets are odd. Short-format loca cannot represent ` +
        `them, so subsetting will silently corrupt the glyphs that follow.`
    ).toBe(0);
  });
});
