import { describe, it, expect } from "vitest";
import { PDFDocument } from "pdf-lib";
import { protectPdf } from "../operations/protect";
import { checkPdfEncryption } from "../operations/security";

async function createSimplePdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([400, 600]);
  page.drawText("Confidential Document Content", { x: 50, y: 550 });
  return await doc.save();
}

describe("Phase 13: Protect & Password Encryption Operations", () => {
  it("encrypts document with AES-256 password protection", async () => {
    const rawBytes = await createSimplePdf();
    const result = await protectPdf(rawBytes, {
      userPassword: "secret-password",
      algorithm: "AES-256",
      allowPrinting: false,
      allowCopying: false,
    });

    expect(result.algorithm).toBe("AES-256");
    expect(result.encryptedSize).toBeGreaterThan(500);

    // Verify it is flagged as encrypted
    const check = await checkPdfEncryption(result.pdfBytes);
    expect(check.isEncrypted).toBe(true);
    expect(check.canOpenWithoutPassword).toBe(false);
  });

  it("encrypts document with RC4 128-bit legacy mode", async () => {
    const rawBytes = await createSimplePdf();
    const result = await protectPdf(rawBytes, {
      userPassword: "legacy-pass",
      algorithm: "RC4",
    });

    expect(result.algorithm).toBe("RC4");
    const check = await checkPdfEncryption(result.pdfBytes);
    expect(check.isEncrypted).toBe(true);
  });

  it("throws error if neither user nor owner password is provided", async () => {
    const rawBytes = await createSimplePdf();
    await expect(
      protectPdf(rawBytes, {
        userPassword: "",
        ownerPassword: "",
      })
    ).rejects.toThrow("Please specify at least a user password or owner password.");
  });
});
