import { HardwareCapability } from "./types";

export async function detectHardwareCapabilities(): Promise<HardwareCapability> {
  if (typeof window === "undefined") {
    return {
      hasWebGpu: false,
      logicalCores: 4,
      isHighPerformance: false,
      platformSummary: "Server / Node Environment",
    };
  }

  const cores = navigator.hardwareConcurrency || 4;
  let hasWebGpu = false;

  try {
    const navWithGpu = navigator as unknown as { gpu?: { requestAdapter: () => Promise<unknown> } };
    if (navWithGpu.gpu) {
      const adapter = await navWithGpu.gpu.requestAdapter();
      hasWebGpu = Boolean(adapter);
    }
  } catch {
    hasWebGpu = false;
  }

  const isHighPerformance = hasWebGpu && cores >= 6;
  const platformSummary = hasWebGpu
    ? `WebGPU Hardware Accelerated (${cores} cores)`
    : `Client-Side WebAssembly / CPU (${cores} cores)`;

  return {
    hasWebGpu,
    logicalCores: cores,
    isHighPerformance,
    platformSummary,
  };
}
