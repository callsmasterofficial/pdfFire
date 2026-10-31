/**
 * Key derivation and password validation for PDF's standard security handler,
 * revisions 2 to 4 (ISO 32000-1 section 7.6.3).
 *
 * These revisions derive the file key with MD5 and encrypt with RC4 or
 * AES-128. Both are weak by modern standards, but documents using them are
 * common and the alternative for a user holding the password is losing the
 * document's text to a rasterised copy.
 *
 * Algorithm numbers in comments refer to ISO 32000-1.
 */
import { md5, RC4 } from "@pdfsmaller/pdf-encrypt";

/** The standard 32-byte padding string from Algorithm 2, step (a). */
const PAD = new Uint8Array([
  0x28, 0xbf, 0x4e, 0x5e, 0x4e, 0x75, 0x8a, 0x41, 0x64, 0x00, 0x4e, 0x56,
  0xff, 0xfa, 0x01, 0x08, 0x2e, 0x2e, 0x00, 0xb6, 0xd0, 0x68, 0x3e, 0x80,
  0x2f, 0x0c, 0xa9, 0xfe, 0x64, 0x53, 0x69, 0x7a,
]);

export interface LegacyEncryption {
  r: number;
  /** File key length in bytes. */
  keyLength: number;
  o: Uint8Array;
  u: Uint8Array;
  p: number;
  /** First element of the trailer /ID array. */
  idFirst: Uint8Array;
  encryptMetadata: boolean;
}

function concat(...parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

/** Password bytes padded or truncated to 32 bytes. Algorithm 2, step (a). */
function padPassword(password: string): Uint8Array {
  const bytes = new Uint8Array(32);
  const raw: number[] = [];
  for (const char of password) raw.push(char.codePointAt(0)! & 0xff);
  const used = Math.min(raw.length, 32);
  bytes.set(raw.slice(0, used), 0);
  bytes.set(PAD.slice(0, 32 - used), used);
  return bytes;
}

/** /P written as a 4-byte little-endian two's complement integer. */
function permissionsBytes(p: number): Uint8Array {
  const out = new Uint8Array(4);
  new DataView(out.buffer).setInt32(0, p | 0, true);
  return out;
}

function xorKey(key: Uint8Array, value: number): Uint8Array {
  const out = new Uint8Array(key.length);
  for (let i = 0; i < key.length; i++) out[i] = key[i] ^ value;
  return out;
}

function equalPrefix(a: Uint8Array, b: Uint8Array, length: number): boolean {
  let diff = 0;
  for (let i = 0; i < length; i++) diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  return diff === 0;
}

/** Algorithm 2: the file encryption key for a padded password. */
function fileKeyFromPadded(padded: Uint8Array, dict: LegacyEncryption): Uint8Array {
  const parts = [padded, dict.o.slice(0, 32), permissionsBytes(dict.p), dict.idFirst];
  if (dict.r >= 4 && !dict.encryptMetadata) {
    parts.push(new Uint8Array([0xff, 0xff, 0xff, 0xff]));
  }

  let hash = md5(concat(...parts));
  if (dict.r >= 3) {
    for (let i = 0; i < 50; i++) hash = md5(hash.slice(0, dict.keyLength));
  }
  return hash.slice(0, dict.keyLength);
}

/** Algorithms 4 and 5: the /U value a given file key should produce. */
function expectedUserEntry(key: Uint8Array, dict: LegacyEncryption): Uint8Array {
  if (dict.r === 2) return new RC4(key).process(PAD);

  let x: Uint8Array = md5(concat(PAD, dict.idFirst));
  x = new RC4(key).process(x);
  for (let i = 1; i <= 19; i++) x = new RC4(xorKey(key, i)).process(x);
  return x;
}

/** Algorithm 6: does this password open the document as the user? */
function validateUserPassword(dict: LegacyEncryption, padded: Uint8Array): Uint8Array | null {
  const key = fileKeyFromPadded(padded, dict);
  const expected = expectedUserEntry(key, dict);
  const compareLength = dict.r === 2 ? 32 : 16;
  return equalPrefix(expected, dict.u, compareLength) ? key : null;
}

/**
 * Algorithm 7: recovers the padded user password from /O using the owner
 * password, so it can then be validated normally.
 */
function userPasswordFromOwner(dict: LegacyEncryption, ownerPassword: string): Uint8Array {
  let hash = md5(padPassword(ownerPassword));
  if (dict.r >= 3) {
    for (let i = 0; i < 50; i++) hash = md5(hash);
  }
  const key = hash.slice(0, dict.keyLength);

  if (dict.r === 2) return new RC4(key).process(dict.o.slice(0, 32));

  let x: Uint8Array = new Uint8Array(dict.o.slice(0, 32));
  for (let i = 19; i >= 1; i--) x = new RC4(xorKey(key, i)).process(x);
  return new RC4(key).process(x);
}

/**
 * The file encryption key for `password`, tried as the user password and then
 * as the owner password, or null when neither matches.
 */
export function recoverLegacyFileKey(
  dict: LegacyEncryption,
  password: string
): Uint8Array | null {
  const asUser = validateUserPassword(dict, padPassword(password));
  if (asUser) return asUser;

  return validateUserPassword(dict, userPasswordFromOwner(dict, password));
}

/**
 * Algorithm 1: the per-object key. Every object is encrypted with a key derived
 * from the file key and its own object and generation number, so one key does
 * not decrypt the whole file.
 */
export function legacyObjectKey(
  fileKey: Uint8Array,
  objectNumber: number,
  generationNumber: number,
  isAes: boolean
): Uint8Array {
  const parts = [
    fileKey,
    new Uint8Array([objectNumber & 0xff, (objectNumber >> 8) & 0xff, (objectNumber >> 16) & 0xff]),
    new Uint8Array([generationNumber & 0xff, (generationNumber >> 8) & 0xff]),
  ];
  // AESV2 mixes in a fixed salt, "sAlT".
  if (isAes) parts.push(new Uint8Array([0x73, 0x41, 0x6c, 0x54]));

  return md5(concat(...parts)).slice(0, Math.min(fileKey.length + 5, 16));
}
