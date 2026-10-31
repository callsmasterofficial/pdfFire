/**
 * AES-CBC decryption for PDF's standard security handler.
 *
 * PDF uses CBC two different ways, and WebCrypto only directly supports one of
 * them. Stream and string data is PKCS#7 padded, which `crypto.subtle.decrypt`
 * handles. Recovering the file key from /UE or /OE is *unpadded*, which it
 * refuses — so one extra ciphertext block is appended, crafted to decrypt to a
 * full padding block, letting WebCrypto strip it and return exactly the
 * original plaintext. Crafting that block needs only AES block *encryption*,
 * which the encryption library already exposes.
 */
import { aes256EcbEncryptBlock } from "@pdfsmaller/pdf-encrypt";

const BLOCK = 16;

async function importKey(key: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    key as unknown as ArrayBuffer,
    { name: "AES-CBC" },
    false,
    ["decrypt"]
  );
}

/** Decrypts PKCS#7 padded CBC data, as used for streams and strings. */
export async function aesCbcDecrypt(
  data: Uint8Array,
  key: Uint8Array,
  iv: Uint8Array
): Promise<Uint8Array> {
  const cryptoKey = await importKey(key);
  const plain = await crypto.subtle.decrypt(
    { name: "AES-CBC", iv: iv as unknown as ArrayBuffer },
    cryptoKey,
    data as unknown as ArrayBuffer
  );
  return new Uint8Array(plain);
}

/** Decrypts CBC data that carries no padding, as used for key recovery. */
export async function aesCbcDecryptNoPad(
  data: Uint8Array,
  key: Uint8Array,
  iv: Uint8Array
): Promise<Uint8Array> {
  if (data.length === 0 || data.length % BLOCK !== 0) {
    throw new Error("Unpadded CBC data must be a whole number of AES blocks.");
  }

  const lastBlock = data.slice(data.length - BLOCK);
  const fullPadding = new Uint8Array(BLOCK).fill(BLOCK);
  const target = new Uint8Array(BLOCK);
  for (let i = 0; i < BLOCK; i++) target[i] = fullPadding[i] ^ lastBlock[i];

  const extra = await aes256EcbEncryptBlock(target, key);
  const padded = new Uint8Array(data.length + BLOCK);
  padded.set(data, 0);
  padded.set(extra, data.length);

  return aesCbcDecrypt(padded, key, iv);
}

/**
 * Decrypts a PDF stream or string encrypted with AESV3, where the first 16
 * bytes are the initialisation vector.
 */
export async function decryptAesV3(
  data: Uint8Array,
  fileKey: Uint8Array
): Promise<Uint8Array> {
  if (data.length <= BLOCK) return new Uint8Array(0);
  return aesCbcDecrypt(data.slice(BLOCK), fileKey, data.slice(0, BLOCK));
}
