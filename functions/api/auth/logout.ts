/**
 * Ends the session.
 *
 * The row is revoked rather than deleted, so a token that turns up afterwards
 * is a known-revoked session instead of an unknown one.
 */
import { hashSessionToken } from "../../../src/lib/auth/password";
import {
  type Env,
  SESSION_COOKIE,
  clearedSessionCookie,
  json,
  readCookie,
} from "./_shared";

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const token = readCookie(request, SESSION_COOKIE);
  if (token) {
    await env.DB.prepare(
      `UPDATE sessions SET revoked_at = ?2 WHERE token_hash = ?1 AND revoked_at IS NULL`
    )
      .bind(await hashSessionToken(token), Date.now())
      .run();
  }
  return json({ ok: true }, 200, { "set-cookie": clearedSessionCookie() });
};
