/**
 * Creates an account.
 *
 * The browser sends an auth key, not a password: see
 * `src/lib/auth/password.ts` for why the expensive derivation happens there.
 *
 * The address is not verified. Nothing here can send email, so a claim that it
 * had been verified would be false. What that costs is written down in
 * `docs/accounts-2026-11-05.md` rather than left implied.
 */
import {
  CLIENT_ITERATIONS,
  SERVER_ITERATIONS,
  hashAuthKey,
  randomHex,
} from "../../../src/lib/auth/password";
import {
  type Env,
  MAX_SIGNUPS,
  SIGNUP_WINDOW_MS,
  clientAddress,
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
  let body: { email?: unknown; authKey?: unknown; clientIterations?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Expected a JSON body." }, 400);
  }

  if (!looksLikeEmail(body.email)) {
    return json({ error: "Enter an email address." }, 400);
  }
  if (!isAuthKey(body.authKey)) {
    return json({ error: "Malformed credentials." }, 400);
  }

  // Accept only a derivation at least as expensive as the one we ask for. A
  // client that stretched less would weaken every later check silently.
  const clientIterations =
    typeof body.clientIterations === "number" ? body.clientIterations : 0;
  if (clientIterations < CLIENT_ITERATIONS) {
    return json({ error: "Credentials were not derived to the required cost." }, 400);
  }

  // Limited per address: the client-side derivation costs an attacker
  // nothing, because they write their own client.
  const signupSubject = `signup:${clientAddress(request)}`;
  if (await tooManyAttempts(env, signupSubject, MAX_SIGNUPS, SIGNUP_WINDOW_MS)) {
    return json(
      { error: "Too many accounts created from here. Try again later." },
      429
    );
  }
  await recordAttempt(env, signupSubject);

  const key = emailKey(body.email);
  const now = Date.now();
  const accountId = randomHex(16);

  const existing = await env.DB.prepare(
    `SELECT id FROM accounts WHERE email_key = ?1 AND deleted_at IS NULL`
  )
    .bind(key)
    .first<{ id: string }>();
  if (existing) {
    return json({ error: "An account with that email already exists." }, 409);
  }

  const salt = randomHex(16);
  const hash = await hashAuthKey(body.authKey, salt, SERVER_ITERATIONS);

  try {
    await env.DB.batch([
      env.DB.prepare(
        `INSERT INTO accounts (id, email, email_key, created_at) VALUES (?1, ?2, ?3, ?4)`
      ).bind(accountId, body.email.trim(), key, now),
      env.DB.prepare(
        `INSERT INTO credentials
           (account_id, password_hash, password_salt, iterations, client_iterations, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)`
      ).bind(accountId, hash, salt, SERVER_ITERATIONS, clientIterations, now),
    ]);
  } catch (error: unknown) {
    // The unique index is the real guard; the check above only gives a better
    // message when there is no race.
    if (String(error).includes("UNIQUE")) {
      return json({ error: "An account with that email already exists." }, 409);
    }
    throw error;
  }

  const token = await createSession(env, accountId);
  return json(
    { account: { id: accountId, email: body.email.trim(), emailVerified: false } },
    201,
    { "set-cookie": sessionCookie(token, SESSION_TTL_MS / 1000) }
  );
};
