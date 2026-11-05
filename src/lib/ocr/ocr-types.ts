/**
 * The languages the OCR picker offers.
 *
 * Every entry here must have a committed `public/tesseract/lang/<code>.traineddata`.
 * That is not a convention — it is enforced by `ocr-language-assets.test.ts`,
 * because the picker previously offered six languages when only English had
 * been committed, so choosing any other one failed at the point of use.
 *
 * `bytes` is the real file size, not an estimate. The earlier estimates were
 * wrong by up to 4x (Chinese was labelled "~10 MB"; it is 2.4 MB), which is
 * exactly the sort of number a user decides on before a download.
 *
 * All six packs come from tessdata_fast, the same tier as the original English
 * pack, so accuracy and size stay consistent across languages.
 */
export type SupportedOcrLanguage =
  | "eng"
  | "spa"
  | "fra"
  | "deu"
  | "chi_sim"
  | "jpn";

export interface OcrLanguageOption {
  code: SupportedOcrLanguage;
  name: string;
  /** Exact size of the committed traineddata file. */
  bytes: number;
  /** First 12 hex characters of the file's SHA-256, checked by the test. */
  sha256: string;
}

/** Where the language packs are served from, relative to the site root. */
export const OCR_LANG_PATH = "/tesseract/lang";

export const OCR_LANGUAGES: OcrLanguageOption[] = [
  { code: "eng", name: "English", bytes: 4113088, sha256: "7d4322bd2a77" },
  { code: "spa", name: "Spanish (Español)", bytes: 2294433, sha256: "6f2e04d02774" },
  { code: "fra", name: "French (Français)", bytes: 1130365, sha256: "ced037562e8c" },
  { code: "deu", name: "German (Deutsch)", bytes: 1525436, sha256: "19d219bbb667" },
  { code: "chi_sim", name: "Chinese Simplified (简体中文)", bytes: 2469156, sha256: "a5fcb6f0db1e" },
  { code: "jpn", name: "Japanese (日本語)", bytes: 2471260, sha256: "1f5de9236d2e" },
];

/** Human-readable size, for the picker. */
export function formatPackSize(bytes: number): string {
  return `${(bytes / 1_000_000).toFixed(1)} MB`;
}

export interface OcrProgress {
  status: string;
  progress: number; // 0.0 to 1.0
  currentPage?: number;
  totalPages?: number;
}

export interface OcrPageResult {
  pageNumber: number;
  text: string;
  confidence: number;
}

export interface OcrDocumentResult {
  fullText: string;
  pages: OcrPageResult[];
  averageConfidence: number;
  language: SupportedOcrLanguage;
  processingTimeMs: number;
}
