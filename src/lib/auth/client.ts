/**
 * Browser side of signing in.
 *
 * The password never leaves this module. What goes over the wire is the auth
 * key derived from it — see `password.ts` for why the derivation happens here
 * rather than at the edge.
 */
import { CLIENT_ITERATIONS, deriveAuthKey } from "./password";

export interface Account {
  id: string;
  email: string;
  emailVerified: boolean;
}

export class AuthError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = "AuthError";
  }
}

async function post(path: string, body: unknown): Promise<unknown> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    // The session is a cookie, so it has to be sent and stored.
    credentials: "same-origin",
  });
  const data = (await response.json().catch(() => ({}))) as { error?: string };
  if (!response.ok) {
    throw new AuthError(data.error ?? "Something went wrong.", response.status);
  }
  return data;
}

export async function register(email: string, password: string): Promise<Account> {
  const authKey = await deriveAuthKey(password, email);
  const data = (await post("/api/auth/register", {
    email,
    authKey,
    clientIterations: CLIENT_ITERATIONS,
  })) as { account: Account };
  return data.account;
}

export async function login(email: string, password: string): Promise<Account> {
  const authKey = await deriveAuthKey(password, email);
  const data = (await post("/api/auth/login", { email, authKey })) as {
    account: Account;
  };
  return data.account;
}

export async function logout(): Promise<void> {
  await post("/api/auth/logout", {});
}

export async function currentAccount(): Promise<Account | null> {
  const response = await fetch("/api/auth/session", { credentials: "same-origin" });
  if (!response.ok) return null;
  const data = (await response.json()) as { account: Account | null };
  return data.account;
}

/**
 * How long the derivation takes on this device, for the sign-in form to decide
 * whether to show progress. Measured rather than assumed: it is ~200 ms on a
 * laptop and several times that on an old phone.
 */
export async function measureDerivationMs(): Promise<number> {
  const started = performance.now();
  await deriveAuthKey("measurement", "measure@filemelo.com");
  return performance.now() - started;
}
