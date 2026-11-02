import { zipSync } from "fflate";
import { saveDocumentNative } from "@/lib/desktop/bridge";

/**
 * Writes the file out.
 *
 * In the desktop shell this goes through the OS save dialog, so the user picks
 * a real location instead of everything landing in Downloads. In a browser it
 * is the usual anchor download. The signature stays synchronous because every
 * caller already treats saving as fire-and-forget; the native attempt runs on
 * its own and falls back to the browser path if it fails or is unavailable.
 */
export function triggerBlobDownload(blob: Blob, fileName: string): void {
  if (typeof window === "undefined") return;

  void saveDocumentNative(blob, fileName).then((outcome) => {
    // Only fall back when the native path is absent or broken. A cancelled
    // dialog means the user chose not to save, so saving anyway would be wrong.
    if (outcome === "unavailable") browserDownload(blob, fileName);
  });
}

function browserDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();

  // Cleanup after user download initiated
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);
}

export function triggerBytesDownload(
  bytes: Uint8Array,
  fileName: string,
  mimeType = "application/pdf"
): void {
  const blob = new Blob([bytes as BlobPart], { type: mimeType });
  triggerBlobDownload(blob, fileName);
}

export const downloadPdfBytes = triggerBytesDownload;
export const downloadBlob = triggerBlobDownload;

export interface ZipFileInput {
  name: string;
  data: Uint8Array;
}

export function createZipArchive(files: ZipFileInput[]): Uint8Array {
  const zipObj: Record<string, Uint8Array> = {};
  for (const file of files) {
    zipObj[file.name] = file.data;
  }
  return zipSync(zipObj);
}
