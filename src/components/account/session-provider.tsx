"use client";

/**
 * Holds the current session for the app.
 *
 * Fetched once on mount and refreshed after a sign-in or sign-out, rather than
 * polled: a session changes when the user does something, not on a timer.
 *
 * While it is loading, `entitlements` is the Free table. That is the honest
 * default — an unknown session is not a paid one — and it means no screen has
 * to handle a third "we don't know yet" state to avoid flashing a paid feature
 * at someone who has not paid.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { fetchSession, type SessionState } from "@/lib/auth/client";
import { entitlementsFor } from "@/lib/billing/entitlements";

const SIGNED_OUT: SessionState = {
  account: null,
  plan: "free",
  entitlements: entitlementsFor("free"),
  reason: "not signed in",
  seats: 1,
  expiresAt: null,
};

interface SessionContextValue extends SessionState {
  /** False once the first fetch has settled, either way. */
  loading: boolean;
  refresh: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue>({
  ...SIGNED_OUT,
  loading: true,
  refresh: async () => {},
});

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionState>(SIGNED_OUT);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setSession(await fetchSession());
    } catch {
      // A failed read is not a paid plan. Falling back to Free is the only
      // safe direction to be wrong in.
      setSession(SIGNED_OUT);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({ ...session, loading, refresh }),
    [session, loading, refresh]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  return useContext(SessionContext);
}
