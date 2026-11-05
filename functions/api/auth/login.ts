/**
 * Signs in.
 *
 * Rate-limited per address, because the client-side derivation makes guessing
 * expensive for an honest client and does nothing to slow an attacker who
 * computes auth keys directly.
 */
import { hashAuthKey, timingSafeEqual } from "../../../src/lib/auth/password";
import {
  ATTEMPT_WINDOW_MS,
  BAD_CREDENTIALS,
  type Env,
  MAX_ATTEMPTS,
  clearAttempts,
  createSession,
  emailKey,
  isAuthKey,
  json,
  looksLikeEmail,
  recordAttempt,
  sessionCookie,
  SESSION_TTL_MS,
  tooManyAttempts,
} from "./_shared";

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let body: { email?: unknown; authKey?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Expected a JSON body." }, 400);
  }

  if (!looksLikeEmail(body.email) || !isAuthKey(body.authKey)) {
    // Same message as a wrong password: a malformed request must not be a way
    // to tell a registered address from an unregistered one.
    return json({ error: BAD_CREDENTIALS }, 401);
  }

  const key = emailKey(body.email);
  const subject = `login:${key}`;

  if (await tooManyAttempts(env, subject, MAX_ATTEMPTS, ATTEMPT_WINDOW_MS)) {
    return json(
      { error: "Too many attempts. Wait fifteen minutes and try again." },
      429
    );
  }

  const row = await env.DB.prepare(
    `SELECT a.id AS accountId, a.email AS email,
            c.password_hash AS hash, c.password_salt AS salt, c.iterations AS iterations
       FROM accounts a
       JOIN credentials c ON c.account_id = a.id
      WHERE a.email_key = ?1 AND a.deleted_at IS NULL`
  )
    .bind(key)
    .first<{
      accountId: string;
      email: string;
      hash: string;
      salt: string;
      iterations: number;
    }>();

  const recordFailure = () => recordAttempt(env, subject);

  if (!row) {
    await recordFailure();
    return json({ error: BAD_CREDENTIALS }, 401);
  }

  const candidate = await hashAuthKey(body.authKey, row.salt, row.iterations);
  if (!timingSafeEqual(candidate, row.hash)) {
    await recordFailure();
    return json({ error: BAD_CREDENTIALS }, 401);
  }

  // A success clears the window, so one mistyped password does not count
  // against the next genuine sign-in.
  await clearAttempts(env, subject);

  const token = await createSession(env, row.accountId);
  return json(
    { account: { id: row.accountId, email: row.email, emailVerified: false } },
    200,
    { "set-cookie": sessionCookie(token, SESSION_TTL_MS / 1000) }
  );
};
