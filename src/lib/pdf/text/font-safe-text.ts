/**
 * Helpers for deciding what the document's own fonts can draw, and for naming
 * the file that comes out.
 *
 * This used to hold a sanitiser that folded or replaced anything outside the
 * standard fonts' 218-character WinAnsi repertoire. The converters now render
 * those scripts from language packs instead (see `unicode-text.ts`), so the
 * sanitiser is gone rather than left behind to suggest a fallback that no
 * longer exists.
 */
import type { PDFFont } from "pdf-lib";

/**
 * A test for whether the given fonts can draw a character between them.
 *
 * Used to decide what needs a language pack: anything the document's own fonts
 * already handle keeps using them, so a Latin document downloads nothing.
 */
export function canEncodeWith(fonts: PDFFont[]): (char: string) => boolean {
  const charsets = fonts.map((font) => new Set(font.getCharacterSet()));
  const shared = new Set(charsets[0] ?? []);
  for (const other of charsets.slice(1)) {
    for (const code of [...shared]) {
      if (!other.has(code)) shared.delete(code);
    }
  }

  return (char: string) => {
    const code = char.codePointAt(0);
    // Newlines and tabs are layout, not glyphs; callers handle them.
    if (char === "\n" || char === "\r" || char === "\t") return true;
    return code !== undefined && shared.has(code);
  };
}

/**
 * Filename slug that keeps the document's own script instead of flattening it
 * to "document". Unicode letters and digits survive; everything else collapses
 * to a single hyphen.
 */
export function toFileSlug(title: string, fallback = "document"): string {
  const slug = title
    .normalize("NFC")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  return slug || fallback;
}
