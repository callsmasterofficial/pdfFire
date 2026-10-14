import { ValidationOptions, ValidationResult } from "@/types/pdf";

const DEFAULT_MAX_SIZE = 100 * 1024 * 1024; // 100 MB
const PDF_MAGIC_BYTES = [0x25, 0x50, 0x44, 0x46, 0x2d]; // "%PDF-"

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function verifyPdfHeader(file: File): Promise<boolean> {
  try {
    const slice = file.slice(0, 5);
    const buffer = await slice.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    if (bytes.length < 5) return false;
    return PDF_MAGIC_BYTES.every((byte, i) => bytes[i] === byte);
  } catch {
    return false;
  }
}

export async function validatePdfFile(
  file: File,
  options?: ValidationOptions
): Promise<ValidationResult> {
  const maxSizeBytes = options?.maxSizeBytes ?? DEFAULT_MAX_SIZE;

  if (!file) {
    return { valid: false, error: "No file provided." };
  }

  // 1. Extension check
  const fileName = file.name.toLowerCase();
  if (!fileName.endsWith(".pdf")) {
    return {
      valid: false,
      error: `"${file.name}" is not a PDF file. Please select a valid .pdf document.`,
    };
  }

  // 2. MIME type check (when provided by browser)
  if (file.type && file.type !== "application/pdf" && file.type !== "application/x-pdf") {
    return {
      valid: false,
      error: `Invalid MIME type (${file.type}). Expected a PDF document.`,
    };
  }

  // 3. File size limit
  if (file.size <= 0) {
    return {
      valid: false,
      error: `The file "${file.name}" is empty (0 bytes).`,
    };
  }

  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File is too large (${formatFileSize(file.size)}). Max allowed size is ${formatFileSize(maxSizeBytes)}.`,
    };
  }

  // 4. Magic byte inspection to verify real PDF header
  const isPdfHeaderValid = await verifyPdfHeader(file);
  if (!isPdfHeaderValid) {
    return {
      valid: false,
      error: `The file "${file.name}" does not contain a valid PDF signature (%PDF-). It may be corrupted or renamed.`,
    };
  }

  // Large file warning threshold (e.g. > 40MB)
  let warning: string | undefined;
  if (file.size > 40 * 1024 * 1024) {
    warning = `Large document (${formatFileSize(file.size)}). Rendering may take several seconds on mobile or low-power devices.`;
  }

  return {
    valid: true,
    warning,
    file,
  };
}
