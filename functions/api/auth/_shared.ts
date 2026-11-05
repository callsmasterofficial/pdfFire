/**
 * Shared pieces for the auth endpoints.
 *
 * These run at the edge beside a static export. The export itself holds no
 * secrets and cannot: it is a directory of files served to anyone. Everything
 * that needs a secret lives here.
 */
import {
  emailKey,
  hashSessionToken,
  randomHex,
} from "../../../src/lib/auth/password";

export type Env = { DB: D1Database };

export const SESSION_COOKIE = "fm_session";
/** Thirty days. Long enough to be usable, short enough to expire. */
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/** Five failures in fifteen minutes, per address. */
export const MAX_ATTEMPTS = 5;
export const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;

export function json(body: unknown, status = 200, headers: HeadersInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...headers },
  });
}

/**
 * One message for "no such account" and "wrong password", so the endpoint
 * cannot be used to find out which addresses are registered.
 */
export const BAD_CREDENTIALS = "That email and password do not match an account.";

export function sessionCookie(token: string, maxAgeSeconds: number): string {
  const parts = [
    `${SESSION_COOKIE}=${token}`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    `Max-Age=${maxAgeSeconds}`,
  ];
  return parts.join("; ");
}

export function clearedSessionCookie(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return rest.join("=");
  }
  return null;
}

export interface SessionAccount {
  accountId: string;
  email: string;
}

/** Resolves the caller's session, or null. Expired and revoked rows do not count. */
export async function currentAccount(
  request: Request,
  env: Env
): Promise<SessionAccount | null> {
  const token = readCookie(request, SESSION_COOKIE);
  if (!token) return null;

  const row = await env.DB.prepare(
    `SELECT s.account_id AS accountId, a.email AS email, s.expires_at AS expiresAt
       FROM sessions s
       JOIN accounts a ON a.id = s.account_id
      WHERE s.token_hash = ?1
        AND s.revoked_at IS NULL
        AND a.deleted_at IS NULL`
  )
    .bind(await hashSessionToken(token))
    .first<{ accountId: string; email: string; expiresAt: number }>();

  if (!row) return null;
  if (row.expiresAt <= Date.now()) return null;

  return { accountId: row.accountId, email: row.email };
}

export async function createSession(env: Env, accountId: string): Promise<string> {
  const token = randomHex(32);
  const now = Date.now();
  await env.DB.prepare(
    `INSERT INTO sessions (token_hash, account_id, created_at, expires_at, last_seen_at)
     VALUES (?1, ?2, ?3, ?4, ?3)`
  )
    .bind(await hashSessionToken(token), accountId, now, now + SESSION_TTL_MS)
    .run();
  return token;
}

/** Shape checks only. Anything stricter belongs to the person's mail provider. */
export function looksLikeEmail(value: unknown): value is string {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function isAuthKey(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{64}$/.test(value);
}

export { emailKey };
