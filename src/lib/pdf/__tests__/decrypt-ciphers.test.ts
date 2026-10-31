/**
 * Unit evidence for the cipher layer.
 *
 * The RC4 path is validated end to end against a real encrypted document in
 * decrypt-document.test.ts, which also covers the shared revision 2-4 key
 * derivation. The encryption dependency cannot produce an AES-128 (V4/AESV2)
 * document, so the AESV2-specific parts — the "sAlT" suffix on the object key
 * and the leading initialisation vector — are exercised directly here instead.
 * That is weaker evidence than a third-party fixture, and the capability matrix
 * says so.
 */
import { describe, expect, it } from "vitest";
import { PDFDocument, PDFName } from "pdf-lib";
import { aesV2Cipher, rc4Cipher } from "../crypto/document-cipher";
import { legacyObjectKey } from "../crypto/legacy-security";
import { readEncryptDict } from "../operations/decrypt/read-encrypt-dict";

const ID: { objectNumber: number; generationNumber: number } = {
  objectNumber: 12,
  generationNumber: 0,
};

async function aes128Encrypt(plain: Uint8Array, key: Uint8Array, iv: Uint8Array) {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key as unknown as ArrayBuffer,
    { name: "AES-CBC" },
    false,
    ["encrypt"]
  );
  const body = await crypto.subtle.encrypt(
    { name: "AES-CBC", iv: iv as unknown as ArrayBuffer },
    cryptoKey,
    plain as unknown as ArrayBuffer
  );
  const out = new Uint8Array(16 + body.byteLength);
  out.set(iv, 0);
  out.set(new Uint8Array(body), 16);
  return out;
}

describe("AES-128 (AESV2) cipher", () => {
  it("decrypts data encrypted with the salted per-object key", async () => {
    const fileKey = new Uint8Array(16).map((_, i) => (i * 11 + 3) & 0xff);
    const objectKey = legacyObjectKey(fileKey, ID.objectNumber, ID.generationNumber, true);
    const iv = new Uint8Array(16).map((_, i) => (i * 5 + 1) & 0xff);
    const plain = new TextEncoder().encode("stream payload for object 12");

    const encrypted = await aes128Encrypt(plain, objectKey, iv);
    const decrypted = await aesV2Cipher(fileKey).decrypt(encrypted, ID);

    expect(new TextDecoder().decode(decrypted)).toBe("stream payload for object 12");
  });

  it("derives a different key per object, so one key does not open the file", async () => {
    const fileKey = new Uint8Array(16).fill(9);
    const keyA = legacyObjectKey(fileKey, 12, 0, true);
    const keyB = legacyObjectKey(fileKey, 13, 0, true);
    const unsalted = legacyObjectKey(fileKey, 12, 0, false);

    expect(Array.from(keyA)).not.toEqual(Array.from(keyB));
    // The AESV2 salt must actually change the derivation.
    expect(Array.from(keyA)).not.toEqual(Array.from(unsalted));
  });

  it("treats data too short to hold an IV as empty rather than throwing", async () => {
    const cipher = aesV2Cipher(new Uint8Array(16).fill(1));
    expect((await cipher.decrypt(new Uint8Array(8), ID)).length).toBe(0);
  });
});

describe("RC4 cipher", () => {
  it("is symmetric, so the same call encrypts and decrypts", async () => {
    const fileKey = new Uint8Array(16).map((_, i) => i + 1);
    const cipher = rc4Cipher(fileKey);
    const plain = new TextEncoder().encode("legacy stream");

    const encrypted = await cipher.decrypt(plain, ID);
    const roundTripped = await cipher.decrypt(encrypted, ID);

    expect(new TextDecoder().decode(roundTripped)).toBe("legacy stream");
  });
});

describe("encryption dictionary parsing", () => {
  it("resolves a V4 crypt filter name through /CF to its method", async () => {
    const doc = await PDFDocument.create();
    doc.addPage([100, 100]);
    const context = doc.context;

    const encrypt = context.obj({
      Filter: "Standard",
      V: 4,
      R: 4,
      Length: 128,
      P: -1340,
      O: context.obj(""),
      U: context.obj(""),
      StmF: "StdCF",
      StrF: "StdCF",
      CF: context.obj({ StdCF: context.obj({ CFM: "AESV2" }) }),
      EncryptMetadata: false,
    });
    context.trailerInfo.Encrypt = context.register(encrypt);
    context.trailerInfo.ID = context.obj([PDFName.of("x")]);

    const parsed = readEncryptDict(doc);
    expect(parsed.v).toBe(4);
    expect(parsed.streamFilterMethod).toBe("AESV2");
    expect(parsed.stringFilterMethod).toBe("AESV2");
    expect(parsed.keyLength).toBe(16);
    expect(parsed.encryptMetadata).toBe(false);
    expect(parsed.p).toBe(-1340);
  });
});
