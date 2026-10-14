/**
 * Client-side initialization for PDF.js.
 * Dynamically loads pdfjs-dist on client to prevent SSR errors
 * and configures the local Web Worker for 100% offline-first processing.
 */

let pdfjsInstance: typeof import("pdfjs-dist") | null = null;

export async function getPdfjs(): Promise<typeof import("pdfjs-dist")> {
  if (typeof window === "undefined") {
    throw new Error("PDF.js can only be initialized in browser environment.");
  }

  if (pdfjsInstance) {
    return pdfjsInstance;
  }

  const pdfjs = await import("pdfjs-dist");

  // Point worker to local public path for 100% offline privacy
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  }

  pdfjsInstance = pdfjs;
  return pdfjs;
}

export function getLocalCmapAndFontConfig() {
  return {
    cMapUrl: "/pdfjs/cmaps/",
    cMapPacked: true,
    standardFontDataUrl: "/pdfjs/standard_fonts/",
  };
}
