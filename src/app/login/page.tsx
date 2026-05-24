"use client";

import { useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { DEFAULT_ADMIN_PASSWORD, DEFAULT_ADMIN_USERNAME, isValidAdminCredentials, setAdminSession } from "@/lib/admin-auth";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/profile";

  const [form, setForm] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });
  const [loading, setLoading] = useState(false);
  const [providerLoading, setProviderLoading] = useState<string | null>(null);
  const [status, setStatus] = useState<{ tone: "success" | "error" | "info"; message: string } | null>(null);

  const [adminForm, setAdminForm] = useState({ username: "", password: "" });
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminTouched, setAdminTouched] = useState({ username: false, password: false });

  const emailError = useMemo(() => {
    if (!touched.email) return "";
    if (!form.email) return "Enter your email address.";
    if (!emailPattern.test(form.email)) return "Use a valid email address.";
    return "";
  }, [form.email, touched.email]);

  const passwordError = useMemo(() => {
    if (!touched.password) return "";
    if (!form.password) return "Enter your password.";
    return "";
  }, [form.password, touched.password]);

  const adminUsernameError = !adminForm.username.trim() && adminTouched.username ? "Enter your admin username." : "";
  const adminPasswordError = !adminForm.password && adminTouched.password ? "Enter your admin password." : "";

  const updateForm = (field: keyof typeof form, value: string | boolean) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleDemoLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setTouched({ email: true, password: true });
    setStatus(null);

    if (emailError || passwordError) {
      setStatus({ tone: "error", message: "Please fix the highlighted fields and try again." });
      return;
    }

    setLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 700));
      setStatus({ tone: "success", message: "Welcome back! Demo sign-in completed." });
      router.push(redirectTo);
    } catch {
      setStatus({ tone: "error", message: "Sign-in is temporarily unavailable. Please try again." });
      setLoading(false);
    }
  };

  const handleAdminLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setAdminTouched({ username: true, password: true });
    setStatus(null);

    if (adminUsernameError || adminPasswordError) {
      setStatus({ tone: "error", message: "Enter both admin credentials to continue." });
      return;
    }

    setAdminLoading(true);

    try {
      if (!isValidAdminCredentials(adminForm.username, adminForm.password)) {
        throw new Error("Invalid admin credentials.");
      }

      setAdminSession(true);
      setStatus({ tone: "success", message: "Admin access granted." });
      router.push(redirectTo);
    } catch (error: any) {
      setStatus({ tone: "error", message: error?.message || "Unable to sign in as admin." });
      setAdminLoading(false);
    }
  };

  const handleProviderLogin = async (provider: "google" | "apple") => {
    setStatus(null);

    if (provider === "apple") {
      setStatus({
        tone: "info",
        message: "Apple sign-in is available once your provider is configured.",
      });
      return;
    }

    setProviderLoading(provider);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      setStatus({
        tone: "error",
        message: error?.message || "Social sign-in is currently unavailable in demo mode.",
      });
      setProviderLoading(null);
    }
  };

  const providerLabel = providerLoading === "google" ? "Redirecting…" : "Continue with Google";
  const appleLabel = "Continue with Apple";

  return (
    <section className="view active auth-page-shell">
      <div className="auth-page-grid">
        <div className="auth-hero-panel">
          <div>
            <p className="auth-eyebrow">drape account access</p>
            <h1 className="auth-hero-title">Welcome back to a more confident wardrobe.</h1>
            <p className="auth-hero-copy">
              Sign in to save your size profile, track orders, and discover styles curated for your body and your mood.
            </p>
          </div>

          <div className="auth-highlight-card">
            <p className="auth-highlight-kicker">Demo mode</p>
            <p className="auth-highlight-copy">For demo purposes, any valid email/password combination is accepted. Social buttons are ready for your configured auth provider.</p>
          </div>

          <div className="auth-badges">
            <span>Fast access</span>
            <span>Secure input</span>
            <span>Mobile-first</span>
          </div>
        </div>

        <div className="auth-card">
          <div className="auth-card-header">
            <div>
              <p className="auth-brand">drape</p>
              <h2 className="auth-card-title">Sign in</h2>
              <p className="auth-card-copy">Continue your shopping journey with your account details.</p>
            </div>
            <a href="/signup" className="auth-link-inline">Create account</a>
          </div>

          <div aria-live="polite" className={`auth-status ${status?.tone || ""}`}>
            {status?.message}
          </div>

          <form className="auth-form" onSubmit={handleDemoLogin} noValidate>
            <div className="auth-field">
              <label htmlFor="login-email">Email</label>
              <div className="auth-input-wrap">
                <span className="auth-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 7.5 12 13l8-5.5" />
                    <rect x="3" y="5" width="18" height="14" rx="3" />
                  </svg>
                </span>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@drape.africa"
                  value={form.email}
                  onChange={(event) => updateForm("email", event.target.value)}
                  onBlur={() => setTouched((current) => ({ ...current, email: true }))}
                  aria-invalid={Boolean(emailError)}
                  aria-describedby={emailError ? "login-email-error" : undefined}
                />
              </div>
              <p id="login-email-error" className="auth-error-text" aria-live="polite">
                {emailError}
              </p>
            </div>

            <div className="auth-field">
              <label htmlFor="login-password">Password</label>
              <div className="auth-input-wrap">
                <span className="auth-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="4" y="10" width="16" height="10" rx="2" />
                    <path d="M8 10V7a4 4 0 1 1 8 0v3" />
                  </svg>
                </span>
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={(event) => updateForm("password", event.target.value)}
                  onBlur={() => setTouched((current) => ({ ...current, password: true }))}
                  aria-invalid={Boolean(passwordError)}
                  aria-describedby={passwordError ? "login-password-error" : undefined}
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
              <p id="login-password-error" className="auth-error-text" aria-live="polite">
                {passwordError}
              </p>
            </div>

            <div className="auth-row">
              <label className="auth-checkbox-row">
                <input
                  type="checkbox"
                  checked={form.rememberMe}
                  onChange={(event) => updateForm("rememberMe", event.target.checked)}
                />
                <span>Remember me</span>
              </label>
              <a href="/footer/get-help" className="auth-link-inline">Forgot password?</a>
            </div>

            <button type="submit" className="btn btn-navy btn-block auth-submit-button" disabled={loading}>
              {loading ? (
                <>
                  <span className="auth-spinner" aria-hidden="true" />
                  Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          <div className="auth-divider" aria-hidden="true">
            <span>or</span>
          </div>

          <div className="auth-social-grid">
            <button
              type="button"
              className="btn btn-outline btn-block"
              onClick={() => handleProviderLogin("google")}
              disabled={Boolean(providerLoading)}
            >
              {providerLabel}
            </button>
            <button
              type="button"
              className="btn btn-outline btn-block"
              onClick={() => handleProviderLogin("apple")}
              disabled={Boolean(providerLoading)}
            >
              {appleLabel}
            </button>
          </div>

          <div className="auth-subcard">
            <p className="auth-subcard-title">Admin access</p>
            <p className="auth-subcard-copy">Use your admin credentials to open the management area.</p>
            <form className="auth-form auth-admin-form" onSubmit={handleAdminLogin} noValidate>
              <div className="auth-field">
                <label htmlFor="admin-username">Username</label>
                <input
                  id="admin-username"
                  type="text"
                  autoComplete="username"
                  placeholder="Enter your admin username"
                  value={adminForm.username}
                  onChange={(event) => setAdminForm((current) => ({ ...current, username: event.target.value }))}
                  onBlur={() => setAdminTouched((current) => ({ ...current, username: true }))}
                  aria-invalid={Boolean(adminUsernameError)}
                  aria-describedby={adminUsernameError ? "admin-username-error" : undefined}
                />
                <p id="admin-username-error" className="auth-error-text" aria-live="polite">
                  {adminUsernameError}
                </p>
              </div>

              <div className="auth-field">
                <label htmlFor="admin-password">Password</label>
                <input
                  id="admin-password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Enter your admin password"
                  value={adminForm.password}
                  onChange={(event) => setAdminForm((current) => ({ ...current, password: event.target.value }))}
                  onBlur={() => setAdminTouched((current) => ({ ...current, password: true }))}
                  aria-invalid={Boolean(adminPasswordError)}
                  aria-describedby={adminPasswordError ? "admin-password-error" : undefined}
                />
                <p id="admin-password-error" className="auth-error-text" aria-live="polite">
                  {adminPasswordError}
                </p>
              </div>

              <p className="auth-admin-hint">Demo admin credentials: {DEFAULT_ADMIN_USERNAME} / {DEFAULT_ADMIN_PASSWORD}</p>

              <button type="submit" className="btn btn-gold btn-block" disabled={adminLoading}>
                {adminLoading ? "Checking credentials…" : "Admin sign in"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}

