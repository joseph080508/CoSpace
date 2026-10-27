"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { SessionUser } from "@/features/auth/types/auth.types";

export type AuthStatus = "loading" | "authenticated" | "anonymous" | "error";

interface AuthContextValue {
  status: AuthStatus;
  user: SessionUser | null;
  refreshSession: () => Promise<boolean>;
  setAuthenticatedUser: (user: SessionUser) => void;
  clearSession: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<SessionUser | null>(null);
  const version = useRef(0);
  const inFlightRefresh = useRef<Promise<boolean> | null>(null);
  const userRef = useRef<SessionUser | null>(null);

  const setAuthenticatedUser = useCallback((nextUser: SessionUser) => {
    version.current += 1;
    userRef.current = nextUser;
    setUser(nextUser);
    setStatus("authenticated");
  }, []);

  const clearSession = useCallback(() => {
    version.current += 1;
    userRef.current = null;
    setUser(null);
    setStatus("anonymous");
  }, []);

  const setSessionError = useCallback(() => {
    version.current += 1;
    setStatus("error");
  }, []);

  const refreshSession = useCallback((): Promise<boolean> => {
    if (inFlightRefresh.current) return inFlightRefresh.current;

    const requestVersion = version.current;
    const pending = (async (): Promise<boolean> => {
      try {
        let response = await fetch("/api/auth/session", { cache: "no-store" });

        if (response.status === 401) {
          // A login/logout may have completed while the initial session request was in flight.
          if (requestVersion !== version.current) return userRef.current !== null;

          const refreshResponse = await fetch("/api/auth/refresh", { method: "POST" });
          if (!refreshResponse.ok) {
            if (requestVersion === version.current) {
              if (refreshResponse.status === 401) clearSession();
              else setSessionError();
            }
            return false;
          }

          response = await fetch("/api/auth/session", { cache: "no-store" });
        }

        if (!response.ok) {
          if (requestVersion === version.current) {
            if (response.status === 401) clearSession();
            else setSessionError();
          }
          return false;
        }

        const data = await response.json() as { authenticated: true; user: SessionUser };
        if (requestVersion !== version.current) return userRef.current !== null;
        userRef.current = data.user;
        setUser(data.user);
        setStatus("authenticated");
        return true;
      } catch {
        if (requestVersion === version.current) setSessionError();
        return false;
      } finally {
        inFlightRefresh.current = null;
      }
    })();

    inFlightRefresh.current = pending;
    return pending;
  }, [clearSession, setSessionError]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void refreshSession(); }, 0);
    return () => window.clearTimeout(timer);
  }, [refreshSession]);

  return (
    <AuthContext.Provider value={{ status, user, refreshSession, setAuthenticatedUser, clearSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
