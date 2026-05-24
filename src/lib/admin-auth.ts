const ADMIN_SESSION_KEY = "drape_admin_session";

export const DEFAULT_ADMIN_USERNAME = process.env.NEXT_PUBLIC_ADMIN_USERNAME || "admin";
export const DEFAULT_ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "drape-admin";

export function getAdminSession(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(ADMIN_SESSION_KEY) === "true";
}

export function setAdminSession(isLoggedIn: boolean) {
  if (typeof window === "undefined") {
    return;
  }

  if (isLoggedIn) {
    window.localStorage.setItem(ADMIN_SESSION_KEY, "true");
    return;
  }

  window.localStorage.removeItem(ADMIN_SESSION_KEY);
}

export function isValidAdminCredentials(username: string, password: string) {
  return (
    username.trim().toLowerCase() === DEFAULT_ADMIN_USERNAME.toLowerCase() &&
    password === DEFAULT_ADMIN_PASSWORD
  );
}
