/**
 * The language packs available for rendering text the standard PDF fonts
 * cannot draw.
 *
 * Each pack is a Noto font served from `/fonts` and fetched only when a
 * document actually needs it, so a Latin-only conversion downloads nothing.
 * Sizes are the real file sizes, because a 8 MB download is a fact the user is
 * entitled to see rather than something to spring on them.
 *
 * `extraction` records how faithfully text comes back out of the finished PDF.
 * Shaping is correct for every pack here, but for Arabic and Devanagari the
 * glyph-to-character mapping a PDF can express cannot fully invert the
 * reordering and ligatures that correct shaping requires, so copying text out
 * of those documents is imperfect. That is a real limitation and it is stated
 * rather than smoothed over.
 */

export type ScriptId =
  | "latin-greek-cyrillic"
  | "hebrew"
  | "thai"
  | "arabic"
  | "devanagari"
  | "cjk";

export interface FontPack {
  id: ScriptId;
  /** Shown to the user when a download is needed. */
  label: string;
  file: string;
  /** Actual file size in bytes. */
  bytes: number;
  /** How well text can be copied back out of the result. */
  extraction: "exact" | "approximate";
  licence: "SIL Open Font License 1.1";
}

export const FONT_PACKS: Record<ScriptId, FontPack> = {
  "latin-greek-cyrillic": {
    id: "latin-greek-cyrillic",
    label: "Latin, Greek and Cyrillic",
    file: "NotoSans-Regular.ttf",
    bytes: 621572,
    extraction: "exact",
    licence: "SIL Open Font License 1.1",
  },
  hebrew: {
    id: "hebrew",
    label: "Hebrew",
    file: "NotoSansHebrew-Regular.ttf",
    bytes: 26860,
    extraction: "exact",
    licence: "SIL Open Font License 1.1",
  },
  thai: {
    id: "thai",
    label: "Thai",
    file: "NotoSansThai-Regular.ttf",
    bytes: 37780,
    extraction: "exact",
    licence: "SIL Open Font License 1.1",
  },
  arabic: {
    id: "arabic",
    label: "Arabic",
    file: "NotoSansArabic-Regular.ttf",
    bytes: 234892,
    extraction: "approximate",
    licence: "SIL Open Font License 1.1",
  },
  devanagari: {
    id: "devanagari",
    label: "Devanagari",
    file: "NotoSansDevanagari-Regular.ttf",
    bytes: 243520,
    extraction: "approximate",
    licence: "SIL Open Font License 1.1",
  },
  cjk: {
    id: "cjk",
    label: "Chinese, Japanese and Korean",
    file: "NotoSansSC-Regular.otf",
    bytes: 8331336,
    extraction: "exact",
    licence: "SIL Open Font License 1.1",
  },
};

/** Where the packs are served from, relative to the site root. */
export const FONT_PACK_PATH = "/fonts";
