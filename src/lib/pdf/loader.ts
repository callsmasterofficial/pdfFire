import type { PDFDocumentProxy } from "pdfjs-dist";
import { getPdfjs, getLocalCmapAndFontConfig } from "./pdfjs-init";
import { PDFDocumentMeta, PDFPreviewError } from "@/types/pdf";

export interface LoadedPDFResult {
  pdfDoc: PDFDocumentProxy;
  meta: PDFDocumentMeta;
}

export async function loadPdfDocument(
  fileOrBuffer: File | ArrayBuffer | Uint8Array,
  password?: string
): Promise<LoadedPDFResult> {
  const pdfjs = await getPdfjs();
  const fontConfig = getLocalCmapAndFontConfig();

  let data: ArrayBuffer | Uint8Array;
  let fileName = "document.pdf";
  let fileSize = 0;

  if (fileOrBuffer instanceof File) {
    fileName = fileOrBuffer.name;
    fileSize = fileOrBuffer.size;
    data = await fileOrBuffer.arrayBuffer();
  } else {
    data = fileOrBuffer;
    fileSize = fileOrBuffer.byteLength;
  }

  try {
    const loadingTask = pdfjs.getDocument({
      data,
      password: password || undefined,
      ...fontConfig,
      useSystemFonts: true,
      stopAtErrors: false,
    });

    const pdfDoc = await loadingTask.promise;

    let title: string | undefined;
    let author: string | undefined;
    let creator: string | undefined;
    let modificationDate: string | undefined;

    try {
      const metadata = await pdfDoc.getMetadata();
      const info = metadata?.info as Record<string, unknown> | undefined;
      if (info) {
        title = typeof info.Title === "string" ? info.Title : undefined;
        author = typeof info.Author === "string" ? info.Author : undefined;
        creator = typeof info.Creator === "string" ? info.Creator : undefined;
        modificationDate =
          typeof info.ModDate === "string" ? info.ModDate : undefined;
      }
    } catch {
      // Non-critical: metadata extraction failure should not block rendering
    }

    const meta: PDFDocumentMeta = {
      name: fileName,
      size: fileSize,
      pageCount: pdfDoc.numPages,
      title,
      author,
      creator,
      modificationDate,
      fingerprint: pdfDoc.fingerprints?.[0],
    };

    return { pdfDoc, meta };
  } catch (err: unknown) {
    const error = err as { name?: string; message?: string };

    if (error?.name === "PasswordException") {
      const previewError: PDFPreviewError = {
        type: "password",
        message: password
          ? "Incorrect password. Please try again."
          : "This document is password protected. Please enter the password to view it.",
        details: error.message,
      };
      throw previewError;
    }

    if (error?.name === "InvalidPDFException") {
      const previewError: PDFPreviewError = {
        type: "corrupted",
        message: "The PDF file is corrupted or not a valid PDF document.",
        details: error.message,
      };
      throw previewError;
    }

    const previewError: PDFPreviewError = {
      type: "generic",
      message: error?.message || "Failed to load PDF document.",
      details: error?.message,
    };
    throw previewError;
  }
}

export async function cleanupPdfDocument(pdfDoc: PDFDocumentProxy | null): Promise<void> {
  if (!pdfDoc) return;
  try {
    await pdfDoc.cleanup();
  } catch (err) {
    console.warn("Error cleaning up PDF document proxy:", err);
  }
}
