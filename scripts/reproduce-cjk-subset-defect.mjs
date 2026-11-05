/**
 * Reproduces the CJK font subsetting defect.
 *
 * `unicode-text.ts` embeds font packs with `subset: true`. For the five
 * TrueType packs that is correct and produces small, correct PDFs. For the CJK
 * pack — the only CFF-outline font we ship — the embedded font program comes
 * out unusable, and the failure is invisible to every automated check we had,
 * because text extraction still returns the right characters. Only the picture
 * is wrong.
 *
 * Run:  node scripts/reproduce-cjk-subset-defect.mjs <outDir>
 *
 * Then render the PDFs it writes and look at them. On macOS:
 *   qlmanage -t -s 900 -o <outDir> <outDir>/cjk-subset-true.pdf
 *
 * Observed 5 November 2026, pdf-lib + @pdf-lib/fontkit:
 *
 *   embedding            MuPDF                CoreGraphics
 *   ------------------   ------------------   --------------------
 *   OTF, subset: true    nothing drawn        draws `! " #`
 *   OTF, subset: false   wrong glyphs         correct
 *
 * `! " #` is the tell: the viewer cannot use the embedded program, falls back
 * to a default font, and maps the raw glyph indices 1, 2, 3 to those ASCII
 * codepoints.
 */
import { writeFileSync, readFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = process.argv[2] ?? join(repoRoot, ".cjk-repro");
mkdirSync(outDir, { recursive: true });

const SAMPLE = "中文识别测试";
const fontPath = join(repoRoot, "public/fonts/NotoSansSC-Regular.otf");

for (const subset of [true, false]) {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const font = await doc.embedFont(readFileSync(fontPath), { subset });
  doc.addPage([520, 200]).drawText(SAMPLE, {
    x: 30,
    y: 90,
    size: 44,
    font,
    color: rgb(0, 0, 0),
  });
  const bytes = await doc.save();
  const file = join(outDir, `cjk-subset-${subset}.pdf`);
  writeFileSync(file, bytes);
  console.log(
    `subset=${String(subset).padEnd(5)} ${String(bytes.byteLength).padStart(8)} bytes  ${file}`
  );
}

console.log(`\nExpected to read "${SAMPLE}" in both. Only subset=false renders it.`);
