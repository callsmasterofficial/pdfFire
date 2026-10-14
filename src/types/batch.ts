export type BatchStatus = "idle" | "running" | "completed" | "cancelled";

export type BatchItemStatus =
  | "queued"
  | "processing"
  | "done"
  | "error"
  | "cancelled";

export interface BatchItem {
  id: string;
  file: File;
  status: BatchItemStatus;
  progress: number; // 0 - 100
  error?: string;
  resultBytes?: Uint8Array;
  resultName?: string;
}

export type BatchProcessorFn = (
  file: File,
  signal: AbortSignal,
  onProgress: (percent: number) => void
) => Promise<{ resultBytes: Uint8Array; resultName: string }>;

export interface BatchSummary {
  total: number;
  completed: number;
  failed: number;
  cancelled: number;
}
