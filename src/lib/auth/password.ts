/**
 * Password handling, split between the browser and the edge.
 *
 * The split is forced by a measured limit, not a preference. In workerd — the
 * engine Pages Functions run on — PBKDF2-SHA256 costs:
 *
 *     10,000 iterations    1 ms
 *     50,000 iterations    6 ms
 *    100,000 iterations    9 ms
 *    210,000 iterations   17 ms   <- what OWASP currently recommends
 *    600,000 iterations   59 ms
 *
 * The Workers free plan allows 10 ms of CPU per request. A login that spends
 * all of it on the hash has nothing left to answer with, and the recommended
 * cost does not fit at all.
 *
 * So the expensive derivation runs in the browser, where it is free and
 * nobody else is waiting, and the server stretches the result again cheaply.
 * An attacker holding the database must still work back through the
 * client-side derivation to reach a password, so the offline cost is kept
 * rather than traded away. This follows Mozilla's onepw protocol; it is not an
 * invention of this codebase.
 *
 * What the server receives is password-equivalent in transit, exactly as a
 * plain password would be, and is protected the same way: TLS, and never
 * logged.
 */

/** Client-side cost. Raise it freely; existing rows record what they used. */
export const CLIENT_ITERATIONS = 600_000;

/** Server-side cost, chosen to leave the request budget intact. */
export const SERVER_ITERATIONS = 10_000;

const encoder = new TextEncoder();

export function toHex(bytes: ArrayBuffer | Uint8Array): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let out = "";
  for (const b of view) out += b.toString(16).padStart(2, "0");
  return out;
}

export function fromHex(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i += 1) {
    out[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

/** Lowercased and trimmed, matching the unique index on `accounts`. */
export function emailKey(email: string): string {
  return email.trim().toLowerCase();
}

async function pbkdf2(
  secret: Uint8Array | string,
  salt: Uint8Array | string,
  iterations: number
): Promise<string> {
  const material = typeof secret === "string" ? encoder.encode(secret) : secret;
  const saltBytes = typeof salt === "string" ? encoder.encode(salt) : salt;
  const key = await crypto.subtle.importKey("raw", material as BufferSource, "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: saltBytes as BufferSource, iterations },
    key,
    256
  );
  return toHex(bits);
}

/**
 * Derives the auth key the browser sends in place of the password.
 *
 * The salt is derived from the address rather than stored, so signing in needs
 * no round trip to learn it. That reveals nothing a login form does not: the
 * attacker already has to know the address to try it.
 */
export function deriveAuthKey(
  password: string,
  email: string,
  iterations: number = CLIENT_ITERATIONS
): Promise<string> {
  return pbkdf2(password, `filemelo:auth:${emailKey(email)}`, iterations);
}

/** Server side: stretch the client's auth key again before storing it. */
export function hashAuthKey(
  authKey: string,
  salt: string,
  iterations: number = SERVER_ITERATIONS
): Promise<string> {
  return pbkdf2(fromHex(authKey), salt, iterations);
}

/** Compares in constant time, so a wrong password cannot be found by timing. */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function randomHex(bytes: number): string {
  return toHex(crypto.getRandomValues(new Uint8Array(bytes)));
}

/** Sessions are looked up by this, never by the token itself. */
export async function hashSessionToken(token: string): Promise<string> {
  return toHex(await crypto.subtle.digest("SHA-256", encoder.encode(token)));
}
