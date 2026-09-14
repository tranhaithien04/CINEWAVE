"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import {
  fetchMe,
  loginAccount,
  logoutAccount,
  refreshSession,
  registerAccount,
  type AuthUser,
  type RegisterResponse,
} from "@/api/auth";
import { ApiError } from "@/api/client";

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  login: (input: { email: string; password: string }) => Promise<AuthUser>;
  register: (input: {
    email: string;
    password: string;
    fullName: string;
  }) => Promise<RegisterResponse>;
  logout: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await fetchMe();
        if (!cancelled) setUser(data.user);
      } catch (error) {
        if (error instanceof ApiError && error.code === "TOKEN_EXPIRED") {
          try {
            const refreshed = await refreshSession();
            if (!cancelled) setUser(refreshed.user);
            return;
          } catch {
            /* still logged out */
          }
        }
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      setUser,
      async login(input) {
        const data = await loginAccount(input);
        setUser(data.user);
        return data.user;
      },
      async register(input) {
        const data = await registerAccount(input);
        if ("user" in data) setUser(data.user);
        return data;
      },
      async logout() {
        await logoutAccount();
        setUser(null);
      },
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
