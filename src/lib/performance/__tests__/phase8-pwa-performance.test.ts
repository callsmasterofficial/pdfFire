import { describe, it, expect } from "vitest";
import {
  BROWSER_PROCESSING_LIMITS,
  checkFileSizeAdvisory,
  measureOperation,
} from "../benchmark";
import fs from "fs";
import path from "path";

describe("Phase 8: Offline / PWA & Performance", () => {
  it("Performance Limits: specifies sound memory & file size limits for client-side stability", () => {
    expect(BROWSER_PROCESSING_LIMITS.recommendedMaxFileSizeMb).toBe(100);
    expect(BROWSER_PROCESSING_LIMITS.largeFileWarningThresholdMb).toBe(50);
    expect(BROWSER_PROCESSING_LIMITS.workerConcurrency).toBe(1);
    expect(BROWSER_PROCESSING_LIMITS.maxCanvasScale).toBe(2.0);
  });

  it("File Size Advisory: warns appropriately for large and oversized documents", () => {
    // Normal 5 MB file
    const normal = checkFileSizeAdvisory(5 * 1024 * 1024);
    expect(normal.isAcceptable).toBe(true);
    expect(normal.isLarge).toBe(false);

    // Large 60 MB file
    const large = checkFileSizeAdvisory(60 * 1024 * 1024);
    expect(large.isAcceptable).toBe(true);
    expect(large.isLarge).toBe(true);
    expect(large.message).toContain("Large document detected");

    // Extreme 120 MB file
    const extreme = checkFileSizeAdvisory(120 * 1024 * 1024);
    expect(extreme.isAcceptable).toBe(false);
    expect(extreme.isLarge).toBe(true);
    expect(extreme.message).toContain("exceeds recommended browser limit");
  });

  it("Benchmark Timing: measures asynchronous execution durations accurately", async () => {
    const timed = await measureOperation("Sample Test Task", async () => {
      await new Promise((r) => setTimeout(r, 15));
      return 42;
    });

    expect(timed.operationName).toBe("Sample Test Task");
    expect(timed.result).toBe(42);
    expect(timed.durationMs).toBeGreaterThanOrEqual(10);
  });

  it("PWA Web App Manifest: validates manifest structure and offline installation metadata", () => {
    const manifestPath = path.resolve(process.cwd(), "public/manifest.json");
    expect(fs.existsSync(manifestPath)).toBe(true);

    const raw = fs.readFileSync(manifestPath, "utf-8");
    const manifest = JSON.parse(raw);

    expect(manifest.name).toContain("PDFForge");
    expect(manifest.display).toBe("standalone");
    expect(manifest.start_url).toBe("/");
    expect(manifest.theme_color).toBe("#E05D38");
    expect(manifest.icons.length).toBeGreaterThanOrEqual(1);
    expect(manifest.shortcuts.length).toBeGreaterThanOrEqual(2);
  });

  it("Service Worker: verifies sw.js existence and cache declaration", () => {
    const swPath = path.resolve(process.cwd(), "public/sw.js");
    expect(fs.existsSync(swPath)).toBe(true);

    const swContent = fs.readFileSync(swPath, "utf-8");
    expect(swContent).toContain("pdfforge-cache-");
    expect(swContent).toContain("addEventListener(\"install\"");
    expect(swContent).toContain("addEventListener(\"fetch\"");
  });
});
