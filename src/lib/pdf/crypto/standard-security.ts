/**
 * Password validation and file-key recovery for PDF's standard security
 * handler, revision 6 (AES-256), as described in ISO 32000-2 section 7.6.4.
 *
 * Only revision 6 is implemented. Earlier revisions use RC4 or AES-128 with
 * MD5-based key derivation; they are detected and reported as unsupported
 * rather than guessed at, because a security handler that is subtly wrong is
 * worse than one that declines.
 */
import { computeHash2B, encodePasswordAES256 } from "@pdfsmaller/pdf-encrypt";
import { aesCbcDecryptNoPad } from "./aes-cbc";

export class UnsupportedEncryptionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnsupportedEncryptionError";
  }
}

export class WrongPasswordError extends Error {
  constructor() {
    super("That password does not open this document.");
    this.name = "WrongPasswordError";
  }
}

export interface EncryptionDictionary {
  v: number;
  r: number;
  /** 48 bytes: 32-byte hash, 8-byte validation salt, 8-byte key salt. */
  u: Uint8Array;
  o: Uint8Array;
  ue: Uint8Array;
  oe: Uint8Array;
  streamFilterMethod: string;
  stringFilterMethod: string;
}

const HASH_LENGTH = 32;
const SALT_LENGTH = 8;
const ZERO_IV = new Uint8Array(16);

function equalBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

function validationSalt(entry: Uint8Array): Uint8Array {
  return entry.slice(HASH_LENGTH, HASH_LENGTH + SALT_LENGTH);
}

function keySalt(entry: Uint8Array): Uint8Array {
  return entry.slice(HASH_LENGTH + SALT_LENGTH, HASH_LENGTH + SALT_LENGTH * 2);
}

export function assertSupported(dict: EncryptionDictionary): void {
  if (dict.v !== 5 || dict.r !== 6) {
    throw new UnsupportedEncryptionError(
      `This document uses encryption revision ${dict.r} (V${dict.v}). Only AES-256 (V5 R6) can be decrypted in place.`
    );
  }
  for (const method of [dict.streamFilterMethod, dict.stringFilterMethod]) {
    if (method !== "AESV3") {
      throw new UnsupportedEncryptionError(
        `This document uses the ${method} crypt filter, which cannot be decrypted in place.`
      );
    }
  }
  if (dict.u.length < 48 || dict.ue.length < 32) {
    throw new UnsupportedEncryptionError("The encryption dictionary is missing its AES-256 key material.");
  }
}

/**
 * Recovers the file encryption key from a password, trying it as the user
 * password and then as the owner password.
 */
export async function recoverFileKey(
  dict: EncryptionDictionary,
  password: string
): Promise<Uint8Array> {
  assertSupported(dict);
  const encoded = encodePasswordAES256(password);

  const userHash = await computeHash2B(encoded, validationSalt(dict.u), new Uint8Array(0));
  if (equalBytes(userHash, dict.u.slice(0, HASH_LENGTH))) {
    const intermediate = await computeHash2B(encoded, keySalt(dict.u), new Uint8Array(0));
    return aesCbcDecryptNoPad(dict.ue.slice(0, 32), intermediate, ZERO_IV);
  }

  if (dict.o.length >= 48 && dict.oe.length >= 32) {
    const u48 = dict.u.slice(0, 48);
    const ownerHash = await computeHash2B(encoded, validationSalt(dict.o), u48);
    if (equalBytes(ownerHash, dict.o.slice(0, HASH_LENGTH))) {
      const intermediate = await computeHash2B(encoded, keySalt(dict.o), u48);
      return aesCbcDecryptNoPad(dict.oe.slice(0, 32), intermediate, ZERO_IV);
    }
  }

  throw new WrongPasswordError();
}
