/**
 * Standard Webhooks signature verification.
 *
 * Dodo signs with the Standard Webhooks scheme: the signed content is
 * `${id}.${timestamp}.${body}`, HMAC-SHA256 under a base64 secret that arrives
 * prefixed `whsec_`, and the header carries one or more space-separated
 * `v1,<base64>` values so a secret can be rotated without downtime.
 *
 * Three things here are deliberate.
 *
 * It verifies the RAW body. Parsing first and re-serialising would change the
 * bytes — key order, whitespace, unicode escapes — and the signature is over
 * the bytes the provider sent.
 *
 * It compares in constant time. A byte-by-byte early return leaks how much of
 * a forged signature was right, which is enough to construct one.
 *
 * It enforces a timestamp tolerance, so a signature captured once cannot be
 * replayed indefinitely.
 *
 * It uses WebCrypto rather than the provider SDK: that runs unchanged on
 * Workers, Node and in tests, with nothing to keep compatible.
 */

export type VerifyResult =
  | { ok: true; id: string; timestamp: number }
  | { ok: false; reason: VerifyFailure };

export type VerifyFailure =
  | "missing-headers"
  | "bad-timestamp"
  | "timestamp-outside-tolerance"
  | "bad-secret"
  | "no-matching-signature";

export type WebhookHeaders = {
  id: string | null;
  timestamp: string | null;
  signature: string | null;
};

const DEFAULT_TOLERANCE_SECONDS = 300;

export function readWebhookHeaders(headers: Headers): WebhookHeaders {
  // Dodo sends the `webhook-` spellings; the `svix-` ones are the same scheme
  // under its original name and are accepted so a provider-side rename does
  // not silently start rejecting every delivery.
  const pick = (...names: string[]) => {
    for (const name of names) {
      const value = headers.get(name);
      if (value) return value;
    }
    return null;
  };
  return {
    id: pick("webhook-id", "svix-id"),
    timestamp: pick("webhook-timestamp", "svix-timestamp"),
    signature: pick("webhook-signature", "svix-signature"),
  };
}

function decodeSecret(secret: string): Uint8Array | null {
  const raw = secret.startsWith("whsec_") ? secret.slice("whsec_".length) : secret;
  try {
    const binary = atob(raw);
    return Uint8Array.from(binary, (c) => c.charCodeAt(0));
  } catch {
    return null;
  }
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export async function verifyWebhook(
  rawBody: string,
  headers: WebhookHeaders,
  secret: string,
  now: number = Math.floor(Date.now() / 1000),
  toleranceSeconds: number = DEFAULT_TOLERANCE_SECONDS,
): Promise<VerifyResult> {
  if (!headers.id || !headers.timestamp || !headers.signature) {
    return { ok: false, reason: "missing-headers" };
  }
  const timestamp = Number(headers.timestamp);
  if (!Number.isFinite(timestamp) || !Number.isInteger(timestamp)) {
    return { ok: false, reason: "bad-timestamp" };
  }
  if (Math.abs(now - timestamp) > toleranceSeconds) {
    return { ok: false, reason: "timestamp-outside-tolerance" };
  }
  const keyBytes = decodeSecret(secret);
  if (!keyBytes || keyBytes.length === 0) return { ok: false, reason: "bad-secret" };

  const key = await crypto.subtle.importKey(
    "raw", keyBytes as BufferSource, { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const signed = `${headers.id}.${headers.timestamp}.${rawBody}`;
  const expected = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signed)),
  );

  for (const candidate of headers.signature.split(" ")) {
    const [version, value] = candidate.split(",");
    if (version !== "v1" || !value) continue;
    let bytes: Uint8Array;
    try {
      bytes = Uint8Array.from(atob(value), (c) => c.charCodeAt(0));
    } catch {
      continue;
    }
    if (timingSafeEqual(expected, bytes)) {
      return { ok: true, id: headers.id, timestamp };
    }
  }
  return { ok: false, reason: "no-matching-signature" };
}

/** Signs a payload the way the provider does. Test-only, exported so the
 *  fixtures cannot drift from the verifier they exercise. */
export async function signWebhook(
  rawBody: string, id: string, timestamp: number, secret: string,
): Promise<string> {
  const keyBytes = decodeSecret(secret);
  if (!keyBytes) throw new Error("secret is not base64");
  const key = await crypto.subtle.importKey(
    "raw", keyBytes as BufferSource, { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const mac = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${id}.${timestamp}.${rawBody}`)),
  );
  return `v1,${btoa(String.fromCharCode(...mac))}`;
}
