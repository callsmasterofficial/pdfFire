import { describe, it, expect } from "vitest";
import { PDFDocument } from "pdf-lib";
import { extractImagesFromPdf } from "../operations/extract-images";
import {
  convertRawPixelsToRgba,
  encodeRgbaToPng,
} from "../operations/image-pixel-utils";
import { createSamplePdfFile } from "../test-fixtures";

describe("Phase 14: Extract Images from PDF Operation", () => {
  it("convertRawPixelsToRgba: correctly expands RGB 24bpp to RGBA 32bpp with 255 alpha", () => {
    // 2 pixels: red [255, 0, 0] and blue [0, 0, 255]
    const rgb = new Uint8Array([255, 0, 0, 0, 0, 255]);
    const rgba = convertRawPixelsToRgba(rgb, 2, 1);

    expect(rgba.length).toBe(8);
    // Pixel 1: Red RGBA
    expect(rgba[0]).toBe(255);
    expect(rgba[1]).toBe(0);
    expect(rgba[2]).toBe(0);
    expect(rgba[3]).toBe(255);
    // Pixel 2: Blue RGBA
    expect(rgba[4]).toBe(0);
    expect(rgba[5]).toBe(0);
    expect(rgba[6]).toBe(255);
    expect(rgba[7]).toBe(255);
  });

  it("convertRawPixelsToRgba: correctly converts 8-bit grayscale to RGBA with SMask", () => {
    const gray = new Uint8Array([128, 200]);
    const smask = new Uint8Array([50, 255]);
    const rgba = convertRawPixelsToRgba(gray, 2, 1, smask);

    expect(rgba.length).toBe(8);
    expect(rgba[0]).toBe(128);
    expect(rgba[1]).toBe(128);
    expect(rgba[2]).toBe(128);
    expect(rgba[3]).toBe(50);

    expect(rgba[4]).toBe(200);
    expect(rgba[5]).toBe(200);
    expect(rgba[6]).toBe(200);
    expect(rgba[7]).toBe(255);
  });

  it("encodeRgbaToPng: creates valid PNG binary header and chunks", () => {
    const testRgba = new Uint8Array([255, 0, 0, 255, 0, 255, 0, 255]);
    const png = encodeRgbaToPng(testRgba, 2, 1);
    expect(png[0]).toBe(137);
    expect(png[1]).toBe(80); // 'P'
    expect(png[2]).toBe(78); // 'N'
    expect(png[3]).toBe(71); // 'G'
    expect(png.length).toBeGreaterThan(50);
  });

  it("extractImagesFromPdf: extracts embedded images and bundles into ZIP", async () => {
    const doc = await PDFDocument.create();
    const page = doc.addPage([300, 300]);
    const pngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
    const pngBytes = Uint8Array.from(Buffer.from(pngBase64, "base64"));
    const img = await doc.embedPng(pngBytes);
    page.drawImage(img, { x: 50, y: 50, width: 100, height: 100 });
    const pdfBytes = await doc.save();

    const result = await extractImagesFromPdf(pdfBytes, { format: "png" });

    expect(result.pageCount).toBe(1);
    expect(result.totalImages).toBe(1);
    expect(result.images.length).toBe(1);

    const first = result.images[0];
    expect(first.pageNumber).toBe(1);
    expect(first.width).toBe(2);
    expect(first.height).toBe(2);
    expect(first.bytes.length).toBeGreaterThan(0);
    expect(first.name).toContain(".png");

    expect(result.zipBytes).toBeDefined();
    expect(result.zipBytes!.length).toBeGreaterThan(0);
  });

  it("extractImagesFromPdf: handles text-only PDFs with 0 images gracefully", async () => {
    const file = createSamplePdfFile();
    const result = await extractImagesFromPdf(file);

    expect(result.totalImages).toBe(0);
    expect(result.images.length).toBe(0);
    expect(result.zipBytes).toBeUndefined();
    expect(result.pageCount).toBe(3);
  });
});
