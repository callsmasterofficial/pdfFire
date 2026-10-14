export interface BenchmarkTiming<T> {
  result: T;
  durationMs: number;
  operationName: string;
}

export interface MemorySnapshot {
  supported: boolean;
  usedMb?: number;
  totalMb?: number;
  limitMb?: number;
}

export const BROWSER_PROCESSING_LIMITS = {
  recommendedMaxFileSizeMb: 100,
  largeFileWarningThresholdMb: 50,
  recommendedBatchFileCount: 20,
  maxCanvasScale: 2.0,
  workerConcurrency: 1,
  largePageCountWarning: 200,
} as const;

export async function measureOperation<T>(
  operationName: string,
  fn: () => Promise<T>
): Promise<BenchmarkTiming<T>> {
  const start = performance.now();
  const result = await fn();
  const durationMs = Math.round(performance.now() - start);

  return {
    result,
    durationMs,
    operationName,
  };
}

export function getMemorySnapshot(): MemorySnapshot {
  if (typeof window === "undefined" || !("performance" in window)) {
    return { supported: false };
  }

  const perf = window.performance as unknown as {
    memory?: {
      usedJSHeapSize: number;
      totalJSHeapSize: number;
      jsHeapSizeLimit: number;
    };
  };

  if (perf.memory) {
    const toMb = (bytes: number) => Math.round(bytes / (1024 * 1024));
    return {
      supported: true,
      usedMb: toMb(perf.memory.usedJSHeapSize),
      totalMb: toMb(perf.memory.totalJSHeapSize),
      limitMb: toMb(perf.memory.jsHeapSizeLimit),
    };
  }

  return { supported: false };
}

export function checkFileSizeAdvisory(sizeBytes: number): {
  isAcceptable: boolean;
  isLarge: boolean;
  message?: string;
} {
  const sizeMb = sizeBytes / (1024 * 1024);
  if (sizeMb > BROWSER_PROCESSING_LIMITS.recommendedMaxFileSizeMb) {
    return {
      isAcceptable: false,
      isLarge: true,
      message: `File size (${sizeMb.toFixed(1)} MB) exceeds recommended browser limit (${BROWSER_PROCESSING_LIMITS.recommendedMaxFileSizeMb} MB). Large files may cause tab memory exhaustion.`,
    };
  }

  if (sizeMb > BROWSER_PROCESSING_LIMITS.largeFileWarningThresholdMb) {
    return {
      isAcceptable: true,
      isLarge: true,
      message: `Large document detected (${sizeMb.toFixed(1)} MB). Processing may take a few extra moments.`,
    };
  }

  return {
    isAcceptable: true,
    isLarge: false,
  };
}
