export type SupportedOcrLanguage = "eng" | "spa" | "fra" | "deu" | "chi_sim" | "jpn";

export interface OcrLanguageOption {
  code: SupportedOcrLanguage;
  name: string;
  sizeEstimate: string;
}

export const OCR_LANGUAGES: OcrLanguageOption[] = [
  { code: "eng", name: "English", sizeEstimate: "~4 MB" },
  { code: "spa", name: "Spanish (Español)", sizeEstimate: "~4 MB" },
  { code: "fra", name: "French (Français)", sizeEstimate: "~4 MB" },
  { code: "deu", name: "German (Deutsch)", sizeEstimate: "~4 MB" },
  { code: "chi_sim", name: "Chinese Simplified (简体中文)", sizeEstimate: "~10 MB" },
  { code: "jpn", name: "Japanese (日本語)", sizeEstimate: "~11 MB" },
];

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
