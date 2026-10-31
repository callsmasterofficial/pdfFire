import { PDFDocument, EncryptedPDFError } from "pdf-lib";
import {
  decryptPdfWithPassword,
  UnsupportedEncryptionError,
  WrongPasswordError,
} from "./decrypt/decrypt-document";
import { rasterizeProtectedPdf } from "./decrypt/rasterize-pages";

export interface UnlockPdfResult {
  pdfBytes: Uint8Array;
  pageCount: number;
  fileName: string;
  /**
   * `decrypted` keeps the original text. `rasterized` means the encryption
   * could not be removed in place and the pages became images.
   */
  method: "decrypted" | "rasterized";
}

export interface SecurityInspectionResult {
  isEncrypted: boolean;
  canOpenWithoutPassword: boolean;
  pageCount?: number;
  error?: string;
}

export async function checkPdfEncryption(
  fileOrBytes: File | Uint8Array | ArrayBuffer
): Promise<SecurityInspectionResult> {
  const bytes = fileOrBytes instanceof File ? await fileOrBytes.arrayBuffer() : fileOrBytes;

  try {
    const doc = await PDFDocument.load(bytes);
    return {
      isEncrypted: false,
      canOpenWithoutPassword: true,
      pageCount: doc.getPageCount(),
    };
  } catch (err: unknown) {
    if (err instanceof EncryptedPDFError || (err as Error)?.message?.toLowerCase().includes("encrypt")) {
      return {
        isEncrypted: true,
        canOpenWithoutPassword: false,
      };
    }
    return {
      isEncrypted: false,
      canOpenWithoutPassword: false,
      error: (err as Error).message,
    };
  }
}

/**
 * Removes a password, keeping the text wherever that is possible.
 *
 * AES-256 documents are decrypted in place, so text, fonts and structure
 * survive. Anything else falls back to re-rendering the pages as images, which
 * works but destroys the text layer — the result says which happened so the UI
 * never implies the text was preserved when it was not.
 */
export async function unlockPdfWithPassword(
  fileOrBytes: File | Uint8Array | ArrayBuffer,
  password: string,
  outputFileName = "unlocked-document.pdf"
): Promise<UnlockPdfResult> {
  const input = fileOrBytes instanceof File ? await fileOrBytes.arrayBuffer() : fileOrBytes;
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);

  try {
    const decrypted = await decryptPdfWithPassword(bytes, password);
    return {
      pdfBytes: decrypted.pdfBytes,
      pageCount: decrypted.pageCount,
      fileName: outputFileName,
      method: "decrypted",
    };
  } catch (error) {
    // A wrong password is the user's problem to fix, not a reason to fall back.
    if (error instanceof WrongPasswordError) throw error;
    if (!(error instanceof UnsupportedEncryptionError)) throw error;
  }

  const rasterized = await rasterizeProtectedPdf(bytes, password);
  return {
    pdfBytes: rasterized.pdfBytes,
    pageCount: rasterized.pageCount,
    fileName: outputFileName,
    method: "rasterized",
  };
}
