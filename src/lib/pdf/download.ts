import { zipSync } from "fflate";

export function triggerBlobDownload(blob: Blob, fileName: string): void {
  if (typeof window === "undefined") return;

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
