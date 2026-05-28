"use client";

import { useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getDisplayUsernameFromUser, setStoredAuthSession } from "@/lib/auth-session";
import { supabase } from "@/lib/supabase";
import { syncUserProfile } from "@/lib/profile-sync";
import GoogleSignInButton from "@/components/GoogleSignInButton";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";

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

  const updateForm = (field: keyof typeof form, value: string | boolean) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setTouched({ email: true, password: true });
    setStatus(null);

    if (emailError || passwordError) {
      setStatus({ tone: "error", message: "Please fix the highlighted fields and try again." });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });

      if (error) {
        throw error;
      }

      const profileError = await syncUserProfile(data.user);
      if (profileError) {
        throw profileError;
      }

      setStoredAuthSession({
        username: getDisplayUsernameFromUser(data.user),
        email: data.user.email ?? undefined,
      });

      setStatus({ tone: "success", message: "Welcome back! You’re signed in." });
      router.push(redirectTo);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Sign-in is temporarily unavailable. Please try again.";
      setStatus({ tone: "error", message });
      setLoading(false);
    }
  };

  const handleProviderLogin = async (provider: "apple") => {
    setStatus(null);
    setProviderLoading(provider);

    try {
      setStatus({
        tone: "info",
        message: "Apple sign-in is available once your provider is configured.",
      });
    } finally {
      setProviderLoading(null);
    }
  };

  const appleLabel = providerLoading === "apple" ? "Redirecting…" : "Continue with Apple";

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
            <p className="auth-highlight-kicker">Secure sign in</p>
            <p className="auth-highlight-copy">Use your real account credentials and confirm your email during sign-up to access your saved profile, orders, and recommendations.</p>
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

          <form className="auth-form" onSubmit={handleLogin} noValidate>
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
            <GoogleSignInButton />
            <button
              type="button"
              className="btn btn-outline btn-block"
              onClick={() => handleProviderLogin("apple")}
              disabled={Boolean(providerLoading)}
            >
              {appleLabel}
            </button>
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

