"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DEFAULT_ADMIN_PASSWORD,
  DEFAULT_ADMIN_USERNAME,
  getAdminSession,
  isValidAdminCredentials,
  setAdminSession,
} from "@/lib/admin-auth";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const [isAuthorized, setIsAuthorized] = useState(() => getAdminSession());
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ username: "", password: "" });
  const [touched, setTouched] = useState({ username: false, password: false });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ tone: "success" | "error" | "info"; message: string } | null>(null);

  const usernameError = useMemo(() => {
    if (!touched.username) return "";
    if (!form.username.trim()) return "Enter your admin username.";
    return "";
  }, [form.username, touched.username]);

  const passwordError = useMemo(() => {
    if (!touched.password) return "";
    if (!form.password) return "Enter your admin password.";
    return "";
  }, [form.password, touched.password]);

  const handleAdminLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setTouched({ username: true, password: true });
    setStatus(null);

    if (usernameError || passwordError) {
      setStatus({ tone: "error", message: "Enter both admin credentials to continue." });
      return;
    }

    setLoading(true);

    try {
      if (!isValidAdminCredentials(form.username, form.password)) {
        throw new Error("Invalid admin credentials.");
      }

      setAdminSession(true);
      setIsAuthorized(true);
      setLoading(false);
      setStatus({ tone: "success", message: "Admin access granted." });
      router.push("/admin/products");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unable to sign in as admin.";
      setStatus({ tone: "error", message });
      setLoading(false);
    }

  };

  if (isAuthorized) {
    return <>{children}</>;
  }

  return (
    <section className="auth-page-shell">
      <div className="auth-page-grid" style={{ gridTemplateColumns: "minmax(0, 1fr)" }}>
        <div className="auth-card" style={{ maxWidth: 640, margin: "0 auto", width: "100%" }}>
          <div className="auth-card-header">
            <div>
              <p className="auth-brand">drape admin</p>
              <h2 className="auth-card-title">Admin sign in</h2>
              <p className="auth-card-copy">Use the admin credentials below to unlock the management area.</p>
            </div>
            <a href="/login" className="auth-link-inline">Back to sign in</a>
          </div>

          <div aria-live="polite" className={`auth-status ${status?.tone || ""}`}>
            {status?.message}
          </div>

          <form className="auth-form" onSubmit={handleAdminLogin} noValidate>
            <div className="auth-field">
              <label htmlFor="admin-username">Username</label>
              <input
                id="admin-username"
                type="text"
                autoComplete="username"
                placeholder="Enter your admin username"
                value={form.username}
                onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
                onBlur={() => setTouched((current) => ({ ...current, username: true }))}
                aria-invalid={Boolean(usernameError)}
                aria-describedby={usernameError ? "admin-username-error" : undefined}
              />
              <p id="admin-username-error" className="auth-error-text" aria-live="polite">
                {usernameError}
              </p>
            </div>

            <div className="auth-field">
              <label htmlFor="admin-password">Password</label>
              <div className="auth-input-wrap">
                <span className="auth-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="4" y="10" width="16" height="10" rx="2" />
                    <path d="M8 10V7a4 4 0 1 1 8 0v3" />
                  </svg>
                </span>
                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your admin password"
                  value={form.password}
                  onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                  onBlur={() => setTouched((current) => ({ ...current, password: true }))}
                  aria-invalid={Boolean(passwordError)}
                  aria-describedby={passwordError ? "admin-password-error" : undefined}
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              <p id="admin-password-error" className="auth-error-text" aria-live="polite">
                {passwordError}
              </p>
            </div>

            <p className="auth-admin-hint">Demo admin credentials: {DEFAULT_ADMIN_USERNAME} / {DEFAULT_ADMIN_PASSWORD}</p>

            <button type="submit" className="btn btn-gold btn-block" disabled={loading}>
              {loading ? "Checking credentials…" : "Access admin"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
