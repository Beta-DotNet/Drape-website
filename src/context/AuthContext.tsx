"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { account } from "@/lib/appwrite";

export type CachedUser = {
  $id: string;
  name?: string;
  email?: string;
};

type AuthContextValue = {
  user: CachedUser | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
};

const AUTH_LOCALSTORAGE_KEY = "drape_user";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readCachedUser(): CachedUser | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(AUTH_LOCALSTORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<CachedUser>;
    if (!parsed || typeof parsed.$id !== "string" || !parsed.$id.trim()) return null;

    return {
      $id: parsed.$id.trim(),
      name: typeof parsed.name === "string" ? parsed.name : undefined,
      email: typeof parsed.email === "string" ? parsed.email : undefined,
    };
  } catch {
    return null;
  }
}

function writeCachedUser(user: CachedUser) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AUTH_LOCALSTORAGE_KEY, JSON.stringify(user));
}

function clearCachedUser() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(AUTH_LOCALSTORAGE_KEY);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const [user, setUser] = useState<CachedUser | null>(() => readCachedUser());
  const [loading, setLoading] = useState(true);

  // Mount: validate real session once (Appwrite stores session cookie server-side httpOnly).
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        if (!account) {
          if (!cancelled) {
            setUser(null);
            clearCachedUser();
          }
          return;
        }

        const appwriteUser = await account.get();

        // account.get() throws if no valid session.
        const nextUser: CachedUser = {
          $id: appwriteUser.$id,
          name: (appwriteUser as unknown as { name?: string }).name,
          email: appwriteUser.email,
        };

        if (!cancelled) {
          setUser(nextUser);
          writeCachedUser(nextUser);
        }
      } catch {
        if (!cancelled) {
          setUser(null);
          clearCachedUser();
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async () => {
    // There is no universal "login" method without knowing the provider.
    // Existing UI triggers OAuth via GoogleSignInButton.
    // Route users to /login where the button lives.
    router.push("/login");
  }, [router]);

  const logout = useCallback(async () => {
    try {
      if (account) {
        await account.deleteSession("current");
      }
    } finally {
      clearCachedUser();
      setUser(null);
      router.push("/login");
    }
  }, [router]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      login,
      logout,
    }),
    [user, loading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login");
  }, [loading, user, router]);

  if (loading) {
    return (
      <div style={{ padding: 32, textAlign: "center" }} aria-busy="true">
        Loading…
      </div>
    );
  }

  // If not authed, the redirect will happen; render nothing to avoid flicker.
  if (!user) return null;

  return <>{children}</>;
}

