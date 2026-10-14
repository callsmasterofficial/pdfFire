import { describe, it, expect } from "vitest";
import { validatePdfFile, formatFileSize } from "../validator";
import {
  createSamplePdfFile,
  createFakeExtensionFile,
} from "../test-fixtures";

describe("formatFileSize", () => {
  it("formats bytes correctly", () => {
    expect(formatFileSize(500)).toBe("500 B");
    expect(formatFileSize(2048)).toBe("2.0 KB");
    expect(formatFileSize(15 * 1024 * 1024)).toBe("15.0 MB");
  });
});

describe("validatePdfFile", () => {
  it("validates valid PDF files successfully", async () => {
    const file = createSamplePdfFile();
    const result = await validatePdfFile(file);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("rejects non-pdf extensions", async () => {
    const blob = new Blob(["%PDF-1.4 test"], { type: "application/pdf" });
    const file = new File([blob], "notes.txt", { type: "application/pdf" });
    const result = await validatePdfFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("is not a PDF file");
  });

  it("rejects invalid MIME types", async () => {
    const blob = new Blob(["%PDF-1.4 test"], { type: "image/png" });
    const file = new File([blob], "image.pdf", { type: "image/png" });
    const result = await validatePdfFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Invalid MIME type");
  });

  it("rejects empty files", async () => {
    const blob = new Blob([], { type: "application/pdf" });
    const file = new File([blob], "empty.pdf", { type: "application/pdf" });
    const result = await validatePdfFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("empty");
  });

  it("rejects oversized files exceeding maxSizeBytes", async () => {
    const file = createSamplePdfFile();
    const result = await validatePdfFile(file, { maxSizeBytes: 10 });
    expect(result.valid).toBe(false);
    expect(result.error).toContain("File is too large");
  });

  it("rejects files without valid %PDF- magic bytes (e.g. renamed txt file)", async () => {
    const file = createFakeExtensionFile();
    const result = await validatePdfFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("valid PDF signature");
  });
});
