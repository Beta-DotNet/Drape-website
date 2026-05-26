export const AUTH_SESSION_KEY = "drape_auth_session";

export type StoredAuthSession = {
  username: string;
  email?: string;
};

export function getStoredAuthSession(): StoredAuthSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(AUTH_SESSION_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as StoredAuthSession;
    if (!parsed || typeof parsed.username !== "string" || !parsed.username.trim()) {
      return null;
    }

    return {
      username: parsed.username.trim(),
      email: typeof parsed.email === "string" ? parsed.email : undefined,
    };
  } catch {
    return null;
  }
}

export function setStoredAuthSession(session: StoredAuthSession) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
  window.dispatchEvent(new CustomEvent("drape_auth_session_changed", { detail: session }));
}

export function clearStoredAuthSession() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(AUTH_SESSION_KEY);
  window.dispatchEvent(new CustomEvent("drape_auth_session_changed"));
}

export function getDisplayUsernameFromUser(user: {
  user_metadata?: Record<string, unknown>;
  email?: string | null;
} | null | undefined): string {
  const metadata = user?.user_metadata ?? {};
  const metadataName = typeof metadata.full_name === "string" && metadata.full_name.trim()
    ? metadata.full_name.trim()
    : typeof metadata.name === "string" && metadata.name.trim()
      ? metadata.name.trim()
      : "";

  if (metadataName) {
    return metadataName.split(/\s+/)[0];
  }

  const email = typeof user?.email === "string" ? user.email.trim() : "";
  if (email) {
    return email.split("@")[0] || "User";
  }

  return "User";
}
