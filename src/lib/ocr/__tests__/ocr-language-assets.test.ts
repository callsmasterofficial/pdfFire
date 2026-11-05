import { describe, it, expect } from "vitest";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { OCR_LANGUAGES, OCR_LANG_PATH } from "../ocr-types";

/**
 * The picker offered six languages while only English had been committed, so
 * picking any other one failed at the moment of use — after the upload, after
 * the engine spun up, with no way for the user to know in advance.
 *
 * These tests make that state impossible to reach: the list and the files on
 * disk have to agree, in both directions.
 */
const LANG_DIR = join(process.cwd(), "public", OCR_LANG_PATH.replace(/^\//, ""));

describe("every offered OCR language has a committed pack", () => {
  it.each(OCR_LANGUAGES.map((l) => [l.code, l] as const))(
    "%s is present, the recorded size, and the recorded file",
    (code, lang) => {
      const file = join(LANG_DIR, `${code}.traineddata`);
      expect(existsSync(file), `${code}.traineddata is missing`).toBe(true);

      // Size and hash, because a truncated or swapped file is still a file.
      expect(statSync(file).size).toBe(lang.bytes);
      const sha = createHash("sha256").update(readFileSync(file)).digest("hex");
      expect(sha.slice(0, 12)).toBe(lang.sha256);
    }
  );

  it("ships no pack the picker does not offer", () => {
    const onDisk = readdirSync(LANG_DIR)
      .filter((f) => f.endsWith(".traineddata"))
      .map((f) => f.replace(".traineddata", ""))
      .sort();
    expect(onDisk).toEqual(OCR_LANGUAGES.map((l) => l.code).sort());
  });

  it("states sizes that match the files, so the picker cannot mislead", () => {
    // The old list estimated Chinese at "~10 MB" when the pack is 2.4 MB.
    for (const lang of OCR_LANGUAGES) {
      const actual = statSync(join(LANG_DIR, `${lang.code}.traineddata`)).size;
      expect(Math.abs(actual - lang.bytes)).toBe(0);
    }
  });
});
