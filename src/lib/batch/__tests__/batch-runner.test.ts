import { describe, it, expect } from "vitest";
import { executeBatchQueue, bundleBatchResultsToZip } from "../batch-runner";
import { BatchItem, BatchProcessorFn } from "../../../types/batch";
import { createSamplePdfFile } from "../../pdf/test-fixtures";

describe("Phase 4 Batch Runner Engine", () => {
  it("processes queue items sequentially to completion", async () => {
    const file1 = createSamplePdfFile("file1.pdf");
    const file2 = createSamplePdfFile("file2.pdf");

    const items: BatchItem[] = [
      { id: "1", file: file1, status: "queued", progress: 0 },
      { id: "2", file: file2, status: "queued", progress: 0 },
    ];

    const processor: BatchProcessorFn = async (file) => {
      return {
        resultBytes: new Uint8Array([1, 2, 3]),
        resultName: `processed-${file.name}`,
      };
    };

    const controller = new AbortController();
    const result = await executeBatchQueue(items, processor, controller, {
      onItemUpdate: () => {},
      onOverallProgress: () => {},
    });

    expect(result[0].status).toBe("done");
    expect(result[0].resultName).toBe("processed-file1.pdf");
    expect(result[1].status).toBe("done");
    expect(result[1].resultName).toBe("processed-file2.pdf");
  });

  it("isolates errors per item without stopping the batch", async () => {
    const file1 = createSamplePdfFile("file1.pdf");
    const file2 = createSamplePdfFile("fail.pdf");
    const file3 = createSamplePdfFile("file3.pdf");

    const items: BatchItem[] = [
      { id: "1", file: file1, status: "queued", progress: 0 },
      { id: "2", file: file2, status: "queued", progress: 0 },
      { id: "3", file: file3, status: "queued", progress: 0 },
    ];

    const processor: BatchProcessorFn = async (file) => {
      if (file.name === "fail.pdf") {
        throw new Error("Simulated file failure");
      }
      return {
        resultBytes: new Uint8Array([10, 20]),
        resultName: `processed-${file.name}`,
      };
    };

    const controller = new AbortController();
    const result = await executeBatchQueue(items, processor, controller, {
      onItemUpdate: () => {},
      onOverallProgress: () => {},
    });

    expect(result[0].status).toBe("done");
    expect(result[1].status).toBe("error");
    expect(result[1].error).toBe("Simulated file failure");
    expect(result[2].status).toBe("done");
  });

  it("gracefully cancels remaining items when abort signal triggers", async () => {
    const file1 = createSamplePdfFile("file1.pdf");
    const file2 = createSamplePdfFile("file2.pdf");

    const items: BatchItem[] = [
      { id: "1", file: file1, status: "queued", progress: 0 },
      { id: "2", file: file2, status: "queued", progress: 0 },
    ];

    const controller = new AbortController();

    const processor: BatchProcessorFn = async () => {
      controller.abort(); // Cancel during first file
      return {
        resultBytes: new Uint8Array([5]),
        resultName: "test.pdf",
      };
    };

    const result = await executeBatchQueue(items, processor, controller, {
      onItemUpdate: () => {},
      onOverallProgress: () => {},
    });

    expect(result[0].status).toBe("cancelled");
    expect(result[1].status).toBe("cancelled");
  });

  it("bundles completed items into a ZIP archive and ignores failures", () => {
    const items: BatchItem[] = [
      {
        id: "1",
        file: createSamplePdfFile("file1.pdf"),
        status: "done",
        progress: 100,
        resultBytes: new Uint8Array([1, 2, 3]),
        resultName: "file1-out.pdf",
      },
      {
        id: "2",
        file: createSamplePdfFile("fail.pdf"),
        status: "error",
        progress: 0,
        error: "Failed",
      },
      {
        id: "3",
        file: createSamplePdfFile("file3.pdf"),
        status: "done",
        progress: 100,
        resultBytes: new Uint8Array([4, 5, 6]),
        resultName: "file3-out.pdf",
      },
    ];

    const zip = bundleBatchResultsToZip(items, "test-batch.zip");
    expect(zip).not.toBeNull();
    expect(zip?.fileName).toBe("test-batch.zip");
    expect(zip?.zipBytes[0]).toBe(0x50); // PK zip header
    expect(zip?.zipBytes[1]).toBe(0x4b);
  });
});
