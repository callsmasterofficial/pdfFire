/**
 * Which language pack, if any, can draw a given character.
 *
 * Only characters the standard PDF fonts cannot encode reach here, so this is
 * about choosing a pack rather than classifying every character. Ranges are
 * deliberately coarse: a pack either covers a script or it does not, and a
 * character no pack covers is reported instead of being quietly replaced.
 */
import type { ScriptId } from "./font-catalog";

interface Range {
  from: number;
  to: number;
  script: ScriptId;
}

const RANGES: Range[] = [
  // Latin Extended-A/B, Greek, Cyrillic, and Vietnamese in Latin Extended
  // Additional, all covered by Noto Sans.
  { from: 0x0100, to: 0x024f, script: "latin-greek-cyrillic" },
  { from: 0x0370, to: 0x03ff, script: "latin-greek-cyrillic" },
  { from: 0x0400, to: 0x052f, script: "latin-greek-cyrillic" },
  { from: 0x1e00, to: 0x1eff, script: "latin-greek-cyrillic" },
  { from: 0x2000, to: 0x206f, script: "latin-greek-cyrillic" },

  { from: 0x0590, to: 0x05ff, script: "hebrew" },
  { from: 0x0600, to: 0x06ff, script: "arabic" },
  { from: 0x0750, to: 0x077f, script: "arabic" },
  { from: 0xfb50, to: 0xfdff, script: "arabic" },
  { from: 0xfe70, to: 0xfeff, script: "arabic" },
  { from: 0x0900, to: 0x097f, script: "devanagari" },
  { from: 0x0e00, to: 0x0e7f, script: "thai" },

  // CJK: Han, the Japanese syllabaries, Hangul, and the common punctuation
  // and full-width forms that appear alongside them.
  { from: 0x2e80, to: 0x2fff, script: "cjk" },
  { from: 0x3000, to: 0x30ff, script: "cjk" },
  { from: 0x3130, to: 0x318f, script: "cjk" },
  { from: 0x31f0, to: 0x31ff, script: "cjk" },
  { from: 0x3400, to: 0x4dbf, script: "cjk" },
  { from: 0x4e00, to: 0x9fff, script: "cjk" },
  { from: 0xac00, to: 0xd7af, script: "cjk" },
  { from: 0xf900, to: 0xfaff, script: "cjk" },
  { from: 0xff00, to: 0xffef, script: "cjk" },
  { from: 0x20000, to: 0x2ebef, script: "cjk" },
];

export function packForCodePoint(codePoint: number): ScriptId | null {
  for (const range of RANGES) {
    if (codePoint >= range.from && codePoint <= range.to) return range.script;
  }
  return null;
}

export interface ScriptSegment {
  /**
   * `base` is drawn by the document's own fonts, `pack` by a language pack, and
   * `unsupported` by nothing available — which is reported rather than drawn.
   * These are three distinct outcomes: treating "no pack covers it" as "the
   * base font handles it" sends unrenderable characters to a font that throws.
   */
  kind: "base" | "pack" | "unsupported";
  pack?: ScriptId;
  text: string;
}

/**
 * Splits text into runs that one font can draw, given a test for what the base
 * font already handles. Adjacent characters needing the same font stay
 * together so shaping sees whole words.
 */
export function segmentByFont(
  text: string,
  baseCanDraw: (char: string) => boolean
): ScriptSegment[] {
  const segments: ScriptSegment[] = [];

  for (const char of text) {
    const codePoint = char.codePointAt(0);
    if (codePoint === undefined) continue;

    let segment: Omit<ScriptSegment, "text">;
    if (baseCanDraw(char)) {
      segment = { kind: "base" };
    } else {
      const pack = packForCodePoint(codePoint);
      segment = pack ? { kind: "pack", pack } : { kind: "unsupported" };
    }

    const last = segments[segments.length - 1];
    if (last && last.kind === segment.kind && last.pack === segment.pack) last.text += char;
    else segments.push({ ...segment, text: char });
  }

  return segments;
}
