import { BatchItem, BatchProcessorFn } from "@/types/batch";
import { createZipArchive, ZipFileInput } from "../pdf/download";

export interface BatchExecutionCallbacks {
  onItemUpdate: (updatedItem: BatchItem) => void;
  onOverallProgress: (completedCount: number, totalCount: number) => void;
}

export async function executeBatchQueue(
  items: BatchItem[],
  processor: BatchProcessorFn,
  abortController: AbortController,
  callbacks: BatchExecutionCallbacks
): Promise<BatchItem[]> {
  const updatedItems = [...items];
  const signal = abortController.signal;
  let completedSoFar = 0;

  for (let i = 0; i < updatedItems.length; i++) {
    const item = updatedItems[i];

    if (signal.aborted) {
      if (item.status === "queued" || item.status === "processing") {
        item.status = "cancelled";
        callbacks.onItemUpdate({ ...item });
      }
      continue;
    }

    // Skip items already done
    if (item.status === "done") {
      completedSoFar++;
      callbacks.onOverallProgress(completedSoFar, updatedItems.length);
      continue;
    }

    // Start processing item
    item.status = "processing";
    item.progress = 10;
    callbacks.onItemUpdate({ ...item });

    try {
      const { resultBytes, resultName } = await processor(
        item.file,
        signal,
        (percent) => {
          item.progress = Math.min(Math.max(percent, 10), 95);
          callbacks.onItemUpdate({ ...item });
        }
      );

      if (signal.aborted) {
        item.status = "cancelled";
      } else {
        item.status = "done";
        item.progress = 100;
        item.resultBytes = resultBytes;
        item.resultName = resultName;
        completedSoFar++;
      }
    } catch (err: unknown) {
      if (signal.aborted) {
        item.status = "cancelled";
      } else {
        item.status = "error";
        item.error = (err as Error).message || "Processing failed";
      }
    }

    callbacks.onItemUpdate({ ...item });
    callbacks.onOverallProgress(completedSoFar, updatedItems.length);
  }

  return updatedItems;
}

export function bundleBatchResultsToZip(
  items: BatchItem[],
  zipName = "batch-results.zip"
): { zipBytes: Uint8Array; fileName: string } | null {
  const successfulFiles: ZipFileInput[] = items
    .filter((it) => it.status === "done" && it.resultBytes && it.resultName)
    .map((it) => ({
      name: it.resultName!,
      data: it.resultBytes!,
    }));

  if (successfulFiles.length === 0) {
    return null;
  }

  const zipBytes = createZipArchive(successfulFiles);
  return { zipBytes, fileName: zipName };
}
