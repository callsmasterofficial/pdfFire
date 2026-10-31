/**
 * Initialization for PDF.js.
 *
 * In the browser this configures the local Web Worker so processing stays
 * offline and on-device. It also loads in non-browser runtimes (test and
 * build-time verification) so that security-sensitive operations can be
 * validated with a real parser instead of a stand-in.
 */

let pdfjsInstance: typeof import("pdfjs-dist") | null = null;

export function isBrowserRuntime(): boolean {
  return typeof window !== "undefined";
}

export async function getPdfjs(): Promise<typeof import("pdfjs-dist")> {
  if (pdfjsInstance) {
    return pdfjsInstance;
  }

  const pdfjs = await import("pdfjs-dist");

  if (isBrowserRuntime() && !pdfjs.GlobalWorkerOptions.workerSrc) {
    // Point worker to local public path for 100% offline privacy
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

/**
 * Document parameters that work in both runtimes. Outside the browser there is
 * no worker and no font loading, so those are disabled rather than guessed at.
 */
export function getDocumentParams(bytes: Uint8Array | ArrayBuffer) {
  const data = bytes instanceof Uint8Array ? new Uint8Array(bytes) : new Uint8Array(bytes);
  if (!isBrowserRuntime()) {
    return { data, useWorkerFetch: false, disableFontFace: true };
  }
  return { data, ...getLocalCmapAndFontConfig(), useSystemFonts: true };
}
