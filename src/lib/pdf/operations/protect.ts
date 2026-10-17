import { encryptPDF } from "@pdfsmaller/pdf-encrypt";
import { PDFDocument } from "pdf-lib";

export interface ProtectPdfOptions {
  userPassword: string;
  ownerPassword?: string;
  algorithm?: "AES-256" | "RC4";
  allowPrinting?: boolean;
  allowCopying?: boolean;
  allowModifying?: boolean;
  allowAnnotating?: boolean;
  allowFillingForms?: boolean;
}

export interface ProtectPdfResult {
  pdfBytes: Uint8Array;
  algorithm: string;
  encryptedSize: number;
  originalSize: number;
}

export async function protectPdf(
  bytes: Uint8Array,
  options: ProtectPdfOptions
): Promise<ProtectPdfResult> {
  if (!options.userPassword && !options.ownerPassword) {
    throw new Error("Please specify at least a user password or owner password.");
  }

  // Verify that it is a valid PDF
  await PDFDocument.load(bytes, { ignoreEncryption: true });

  const algorithm = options.algorithm || "AES-256";

  const encrypted = await encryptPDF(bytes, options.userPassword, {
    ownerPassword: options.ownerPassword || options.userPassword,
    algorithm,
    allowPrinting: options.allowPrinting ?? true,
    allowCopying: options.allowCopying ?? true,
    allowModifying: options.allowModifying ?? false,
    allowAnnotating: options.allowAnnotating ?? false,
    allowFillingForms: options.allowFillingForms ?? true,
  });

  return {
    pdfBytes: encrypted,
    algorithm,
    encryptedSize: encrypted.length,
    originalSize: bytes.length,
  };
}
