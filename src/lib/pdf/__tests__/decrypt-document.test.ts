/**
 * Release gates for in-place decryption (FM-011).
 *
 * The point of this feature is that the text survives. Unlocking used to
 * re-render every page as an image, so these tests assert that an independent
 * parser can still read the words out of the unlocked copy.
 */
import { describe, expect, it } from "vitest";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { encryptPDF } from "@pdfsmaller/pdf-encrypt";
import {
  decryptPdfWithPassword,
  UnsupportedEncryptionError,
  WrongPasswordError,
} from "../operations/decrypt/decrypt-document";
import { checkPdfEncryption } from "../operations/security";
import { extractPdfText } from "./helpers/pdf-text";

const BODY = "Confidential settlement terms for ACME-4471";
const PASSWORD = "correct horse battery";

async function plainDoc(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([480, 240]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  page.drawText(BODY, { x: 40, y: 150, size: 13, font });
  doc.setTitle("Settlement");
  return doc.save({ useObjectStreams: false });
}

async function encryptedDoc(algorithm: "AES-256" | "RC4" = "AES-256"): Promise<Uint8Array> {
  return encryptPDF(await plainDoc(), PASSWORD, { ownerPassword: PASSWORD, algorithm });
}

describe("in-place decryption", () => {
  it("harness confirms the document really is encrypted first", async () => {
    const encrypted = await encryptedDoc();
    const inspection = await checkPdfEncryption(encrypted);

    expect(inspection.isEncrypted).toBe(true);
    expect(new TextDecoder("latin1").decode(encrypted)).not.toContain("ACME-4471");
  });

  it("produces a document that opens without a password", async () => {
    const result = await decryptPdfWithPassword(await encryptedDoc(), PASSWORD);
    const inspection = await checkPdfEncryption(result.pdfBytes);

    expect(inspection.isEncrypted).toBe(false);
    expect(inspection.canOpenWithoutPassword).toBe(true);
  });

  it("keeps the text readable, which rasterising did not", async () => {
    const result = await decryptPdfWithPassword(await encryptedDoc(), PASSWORD);

    expect(await extractPdfText(result.pdfBytes)).toContain("ACME-4471");
    expect(result.streamsDecrypted).toBeGreaterThan(0);
    expect(result.pageCount).toBe(1);
  });

  it("preserves document metadata strings", async () => {
    const result = await decryptPdfWithPassword(await encryptedDoc(), PASSWORD);
    const reloaded = await PDFDocument.load(result.pdfBytes, { updateMetadata: false });

    expect(reloaded.getTitle()).toBe("Settlement");
  });

  it("rejects a wrong password instead of producing a broken file", async () => {
    await expect(
      decryptPdfWithPassword(await encryptedDoc(), "not the password")
    ).rejects.toBeInstanceOf(WrongPasswordError);
  });

  it("accepts the owner password as well as the user password", async () => {
    const encrypted = await encryptPDF(await plainDoc(), "userpw", {
      ownerPassword: "ownerpw",
      algorithm: "AES-256",
    });
    const result = await decryptPdfWithPassword(encrypted, "ownerpw");

    expect(await extractPdfText(result.pdfBytes)).toContain("ACME-4471");
  });

  it("declines encryption revisions it cannot handle, rather than guessing", async () => {
    await expect(
      decryptPdfWithPassword(await encryptedDoc("RC4"), PASSWORD)
    ).rejects.toBeInstanceOf(UnsupportedEncryptionError);
  });
});
