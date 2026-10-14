export interface DocumentEntity {
  type: "date" | "amount" | "email" | "metric";
  value: string;
  context: string;
}

export interface DocumentSummaryResult {
  title: string;
  executiveSummary: string;
  keyTakeaways: string[];
  entities: DocumentEntity[];
  wordCount: number;
  readingTimeMinutes: number;
  pageCount: number;
  engine: "on-device-nlp" | "webgpu";
}

export interface QaCitation {
  pageNumber: number;
  snippet: string;
  relevanceScore: number;
}

export interface QaAnswerResult {
  question: string;
  answer: string;
  citations: QaCitation[];
  confidence: number;
}

export interface HardwareCapability {
  hasWebGpu: boolean;
  logicalCores: number;
  isHighPerformance: boolean;
  platformSummary: string;
}
