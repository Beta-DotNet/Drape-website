const ADMIN_SESSION_KEY = "drape_admin_session";

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
