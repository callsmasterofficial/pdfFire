"use client";

/**
 * Sign in or create an account.
 *
 * One form for both, because the fields are identical and a separate page per
 * verb is two routes to keep in step for no benefit.
 *
 * The password is stretched in this browser before anything is sent — see
 * `src/lib/auth/password.ts` for why. That takes a noticeable moment on a slow
 * device, so the button says what it is doing rather than appearing stuck.
 */
import { useState } from "react";
import { AuthError, login, logout, register } from "@/lib/auth/client";
import { useSession } from "./session-provider";
import { getPlan } from "@/lib/billing/plans";

type Mode = "signin" | "signup";

export function SignInForm() {
  const { account, plan, reason, loading, refresh } = useSession();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "signup") await register(email, password);
      else await login(email, password);
      setPassword("");
      await refresh();
    } catch (cause) {
      setError(
        cause instanceof AuthError ? cause.message : "Something went wrong."
      );
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    setBusy(true);
    try {
      await logout();
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Checking your session…</p>;
  }

  if (account) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Signed in as</p>
          <p className="font-medium break-all">{account.email}</p>
          <p className="mt-3 text-sm">
            Plan: <span className="font-medium">{getPlan(plan).name}</span>
          </p>
          <p className="text-xs text-muted-foreground">{reason}</p>
          {!account.emailVerified && (
            <p className="mt-3 text-xs text-muted-foreground">
              This address has not been verified. FileMelo cannot send email
              yet, so there is no verification link and no password reset. Keep
              your password somewhere safe.
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={signOut}
          disabled={busy}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-60"
        >
          {busy ? "Signing out…" : "Sign out"}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="flex gap-2 text-sm">
        {(["signin", "signup"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setMode(value);
              setError(null);
            }}
            aria-pressed={mode === value}
            className={`rounded-lg px-3 py-1.5 font-medium ${
              mode === value
                ? "bg-primary text-primary-foreground"
                : "border border-border hover:bg-muted"
            }`}
          >
            {value === "signin" ? "Sign in" : "Create account"}
          </button>
        ))}
      </div>

      <div className="space-y-1">
        <label htmlFor="email" className="block text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-3 py-2"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="password" className="block text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={10}
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-3 py-2"
        />
        {mode === "signup" && (
          <p className="text-xs text-muted-foreground">
            At least 10 characters. There is no password reset yet, so choose
            something you will not lose.
          </p>
        )}
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-lg bg-primary px-4 py-2.5 font-medium text-primary-foreground disabled:opacity-60"
      >
        {busy
          ? "Securing your password…"
          : mode === "signin"
            ? "Sign in"
            : "Create account"}
      </button>

      <p className="text-xs text-muted-foreground">
        Your password is processed in this browser and never sent. Documents are
        never uploaded either — an account only records what you have bought.
      </p>
    </form>
  );
}
