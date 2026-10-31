/**
 * Makes text drawable with the standard PDF fonts without silently corrupting it.
 *
 * The standard 14 fonts use WinAnsi encoding: 218 characters. The previous
 * helpers replaced everything outside printable ASCII with "?", which destroyed
 * ordinary European text — "Café" became "Caf?" even though Helvetica encodes
 * é perfectly well.
 *
 * This keeps every character the font can actually encode, folds accents off
 * Latin letters it cannot (so Vietnamese and Polish stay readable rather than
 * becoming a row of question marks), and reports whatever is left so the UI can
 * tell the user what was lost instead of hiding it.
 *
 * Scripts with no Latin approximation (CJK, Arabic, Devanagari, Thai) cannot be
 * drawn by these fonts at all; rendering those needs an embedded Unicode font,
 * which is tracked separately in the capability matrix.
 */
import type { PDFFont } from "pdf-lib";

export interface TextFidelityReport {
  /** True when every character was drawn as authored. */
  isLossless: boolean;
  /** Characters drawn without their diacritics, e.g. "ế" rendered as "e". */
  approximatedCharacters: string[];
  /** Characters the fonts cannot represent at all. */
  droppedCharacters: string[];
  approximatedCount: number;
  droppedCount: number;
}

/** Latin letters with no canonical decomposition, so NFKD cannot fold them. */
const LATIN_FALLBACKS: Record<string, string> = {
  Ł: "L", ł: "l", Đ: "D", đ: "d", Ħ: "H", ħ: "h", Ŋ: "N", ŋ: "n",
  Ŧ: "T", ŧ: "t", Ɖ: "D", Ƶ: "Z", ƶ: "z", ı: "i", ĸ: "k", ſ: "s",
  Ə: "E", ə: "e", Ɨ: "I", ɨ: "i", Ȿ: "S", Ʉ: "U", ʉ: "u",
};

const PRESERVED_CONTROLS = new Set(["\n", "\r", "\t"]);
const REPLACEMENT = "?";

export class FontTextSanitizer {
  private readonly encodable: Set<number>;
  private readonly approximated = new Set<string>();
  private readonly dropped = new Set<string>();

  /**
   * @param fonts Every font the document draws with. A character is only safe
   *   if all of them can encode it, since callers pick a font per run.
   */
  constructor(fonts: PDFFont[]) {
    const charsets = fonts.map((font) => new Set(font.getCharacterSet()));
    const [first, ...rest] = charsets;
    this.encodable = new Set(first ?? []);
    for (const other of rest) {
      for (const code of [...this.encodable]) {
        if (!other.has(code)) this.encodable.delete(code);
      }
    }
  }

  sanitize(input: string): string {
    if (!input) return "";
    let out = "";

    for (const char of input.normalize("NFC")) {
      const code = char.codePointAt(0);
      if (code === undefined) continue;

      if (PRESERVED_CONTROLS.has(char)) {
        out += char;
        continue;
      }

      if (this.encodable.has(code)) {
        out += char;
        continue;
      }

      // Invisible formatting characters carry no content, so dropping them is
      // not a fidelity loss worth reporting.
      if (/\p{Cf}|\p{Cc}/u.test(char)) continue;

      const approximation = this.approximate(char);
      if (approximation !== null) {
        out += approximation;
        this.approximated.add(char);
        continue;
      }

      out += REPLACEMENT;
      this.dropped.add(char);
    }

    return out;
  }

  private approximate(char: string): string | null {
    const mapped = LATIN_FALLBACKS[char];
    if (mapped !== undefined && this.isEncodable(mapped)) return mapped;

    const folded = char.normalize("NFKD").replace(/\p{M}/gu, "");
    if (folded && folded !== char && this.isEncodable(folded)) return folded;

    return null;
  }

  private isEncodable(text: string): boolean {
    for (const char of text) {
      const code = char.codePointAt(0);
      if (code === undefined || !this.encodable.has(code)) return false;
    }
    return true;
  }

  report(): TextFidelityReport {
    const approximatedCharacters = [...this.approximated].sort();
    const droppedCharacters = [...this.dropped].sort();
    return {
      isLossless: approximatedCharacters.length === 0 && droppedCharacters.length === 0,
      approximatedCharacters,
      droppedCharacters,
      approximatedCount: approximatedCharacters.length,
      droppedCount: droppedCharacters.length,
    };
  }
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
