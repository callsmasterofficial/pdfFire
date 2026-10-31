/**
 * Decryption for one document, hiding the differences between revisions.
 *
 * AES-256 uses the file key directly. Revisions 2 to 4 derive a separate key
 * per object, and encrypt with either RC4 or AES-128. The walker that rewrites
 * the file should not have to know which.
 */
import { RC4 } from "@pdfsmaller/pdf-encrypt";
import { aesCbcDecrypt, decryptAesV3 } from "./aes-cbc";
import { legacyObjectKey } from "./legacy-security";

export interface ObjectId {
  objectNumber: number;
  generationNumber: number;
}

export interface DocumentCipher {
  /** Human-readable method, for reporting. */
  readonly method: string;
  decrypt(data: Uint8Array, id: ObjectId): Promise<Uint8Array>;
}

const BLOCK = 16;

/** AES-256 (V5 R6): one key for the whole document. */
export function aesV3Cipher(fileKey: Uint8Array): DocumentCipher {
  return {
    method: "AES-256",
    decrypt: (data) => decryptAesV3(data, fileKey),
  };
}

/** RC4 (V1/V2): a per-object key, and a symmetric stream cipher. */
export function rc4Cipher(fileKey: Uint8Array): DocumentCipher {
  return {
    method: "RC4",
    decrypt: async (data, id) => {
      const key = legacyObjectKey(fileKey, id.objectNumber, id.generationNumber, false);
      return new RC4(key).process(data);
    },
  };
}

/** AES-128 (V4, AESV2): a per-object key, with the IV in the first 16 bytes. */
export function aesV2Cipher(fileKey: Uint8Array): DocumentCipher {
  return {
    method: "AES-128",
    decrypt: async (data, id) => {
      if (data.length <= BLOCK) return new Uint8Array(0);
      const key = legacyObjectKey(fileKey, id.objectNumber, id.generationNumber, true);
      return aesCbcDecrypt(data.slice(BLOCK), key, data.slice(0, BLOCK));
    },
  };
}
