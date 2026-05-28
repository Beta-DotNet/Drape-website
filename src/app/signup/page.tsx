"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getDisplayUsernameFromUser, setStoredAuthSession } from "@/lib/auth-session";
import { supabase } from "@/lib/supabase";
import { syncUserProfile } from "@/lib/profile-sync";
import GoogleSignInButton from "@/components/GoogleSignInButton";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getPasswordStrength(password: string) {
  let score = 0;

  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 1) return { label: "Weak", tone: "weak" };
  if (score <= 2) return { label: "Medium", tone: "medium" };
  return { label: "Strong", tone: "strong" };
}

export default function SignupPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    newsletter: true,
    acceptTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [touched, setTouched] = useState({ fullName: false, email: false, password: false, confirmPassword: false, acceptTerms: false });
  const [loading, setLoading] = useState(false);
  const [providerLoading, setProviderLoading] = useState<string | null>(null);
  const [status, setStatus] = useState<{ tone: "success" | "error" | "info"; message: string } | null>(null);

  const strength = useMemo(() => getPasswordStrength(form.password), [form.password]);

  const fullNameError = !form.fullName.trim() && touched.fullName ? "Add your full name." : "";
  const emailError = !touched.email
    ? ""
    : !form.email
      ? "Enter your email address."
      : !emailPattern.test(form.email)
        ? "Use a valid email address."
        : "";
  const passwordError = !touched.password
    ? ""
    : form.password.length < 8
      ? "Use at least 8 characters."
      : "";
  const confirmPasswordError = !touched.confirmPassword
    ? ""
    : form.confirmPassword !== form.password
      ? "Passwords do not match."
      : "";
  const termsError = !form.acceptTerms && touched.acceptTerms ? "You need to accept the terms to continue." : "";

  const updateForm = (field: keyof typeof form, value: string | boolean) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setTouched({
      fullName: true,
      email: true,
      password: true,
      confirmPassword: true,
      acceptTerms: true,
    });
    setStatus(null);

    if (fullNameError || emailError || passwordError || confirmPasswordError || termsError) {
      setStatus({ tone: "error", message: "Please complete the highlighted fields before submitting." });
      return;
    }

    setLoading(true);

    try {
      const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : "http://localhost:3000/auth/callback";
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: form.fullName,
            newsletter: form.newsletter,
          },
          emailRedirectTo: redirectTo,
        },
      });

      if (error) {
        throw error;
      }

      if (data.session) {
        const profileError = await syncUserProfile(data.session.user);
        if (profileError) {
          throw profileError;
        }

        setStoredAuthSession({
          username: getDisplayUsernameFromUser(data.session.user),
          email: data.session.user.email ?? undefined,
        });
      }

      if (data.session) {
        setStatus({
          tone: "success",
          message: form.newsletter
            ? "Account created. You’re subscribed to drape updates."
            : "Account created. Your new account is ready to use.",
        });
        router.push("/profile");
        return;
      }

      setLoading(false);
      setStatus({
        tone: "success",
        message:
          "Account created. Please check your inbox and confirm your email address to finish signing in.",
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Sign-up is temporarily unavailable. Please try again.";
      setStatus({ tone: "error", message });
      setLoading(false);
    }
  };

  const handleProviderSignup = async (provider: "apple") => {
    setStatus(null);
    setProviderLoading(provider);

    try {
      setStatus({
        tone: "info",
        message: "Apple sign-up is available once your provider is configured.",
      });
    } finally {
      setProviderLoading(null);
    }
  };

  const appleLabel = providerLoading === "apple" ? "Redirecting…" : "Continue with Apple";

  return (
    <section className="view active auth-page-shell">
      <div className="auth-page-grid auth-page-grid-signup">
        <div className="auth-hero-panel">
          <div>
            <p className="auth-eyebrow">join drape</p>
            <h1 className="auth-hero-title">Create your account and dress with confidence.</h1>
            <p className="auth-hero-copy">
              Save your style preferences, use your AI-powered size profile, and unlock a shopping experience tailored to your body.
            </p>
          </div>

          <div className="auth-highlight-card">
            <p className="auth-highlight-kicker">What you get</p>
            <ul className="auth-list">
              <li>Personalized product recommendations</li>
              <li>Secure order tracking</li>
              <li>Style insights across every category</li>
            </ul>
          </div>
        </div>

        <div className="auth-card">
          <div className="auth-card-header">
            <div>
              <p className="auth-brand">drape</p>
              <h2 className="auth-card-title">Create account</h2>
              <p className="auth-card-copy">Build your fashion profile in less than a minute.</p>
            </div>
            <a href="/login" className="auth-link-inline">Sign in</a>
          </div>

          <div aria-live="polite" className={`auth-status ${status?.tone || ""}`}>
            {status?.message}
          </div>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="auth-grid-two">
              <div className="auth-field">
                <label htmlFor="signup-full-name">Full name</label>
                <input
                  id="signup-full-name"
                  type="text"
                  autoComplete="name"
                  placeholder="Jordan Moyo"
                  value={form.fullName}
                  onChange={(event) => updateForm("fullName", event.target.value)}
                  onBlur={() => setTouched((current) => ({ ...current, fullName: true }))}
                  aria-invalid={Boolean(fullNameError)}
                  aria-describedby={fullNameError ? "signup-full-name-error" : undefined}
                />
                <p id="signup-full-name-error" className="auth-error-text" aria-live="polite">
                  {fullNameError}
                </p>
              </div>

              <div className="auth-field">
                <label htmlFor="signup-email">Email</label>
                <input
                  id="signup-email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@drape.africa"
                  value={form.email}
                  onChange={(event) => updateForm("email", event.target.value)}
                  onBlur={() => setTouched((current) => ({ ...current, email: true }))}
                  aria-invalid={Boolean(emailError)}
                  aria-describedby={emailError ? "signup-email-error" : undefined}
                />
                <p id="signup-email-error" className="auth-error-text" aria-live="polite">
                  {emailError}
                </p>
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="signup-password">Password</label>
              <div className="auth-input-wrap">
                <span className="auth-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="4" y="10" width="16" height="10" rx="2" />
                    <path d="M8 10V7a4 4 0 1 1 8 0v3" />
                  </svg>
                </span>
                <input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Create a secure password"
                  value={form.password}
                  onChange={(event) => updateForm("password", event.target.value)}
                  onBlur={() => setTouched((current) => ({ ...current, password: true }))}
                  aria-invalid={Boolean(passwordError)}
                  aria-describedby={passwordError ? "signup-password-error" : undefined}
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
              <div className="auth-password-meter">
                <div className={`auth-password-bar ${strength.tone}`} />
                <span>{strength.label}</span>
              </div>
              <p id="signup-password-error" className="auth-error-text" aria-live="polite">
                {passwordError}
              </p>
            </div>

            <div className="auth-field">
              <label htmlFor="signup-confirm-password">Confirm password</label>
              <div className="auth-input-wrap">
                <span className="auth-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12.5 9 16l10-10" />
                  </svg>
                </span>
                <input
                  id="signup-confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
                  value={form.confirmPassword}
                  onChange={(event) => updateForm("confirmPassword", event.target.value)}
                  onBlur={() => setTouched((current) => ({ ...current, confirmPassword: true }))}
                  aria-invalid={Boolean(confirmPasswordError)}
                  aria-describedby={confirmPasswordError ? "signup-confirm-password-error" : undefined}
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowConfirmPassword((current) => !current)}
                  aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  aria-pressed={showConfirmPassword}
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>
              <p id="signup-confirm-password-error" className="auth-error-text" aria-live="polite">
                {confirmPasswordError}
              </p>
            </div>

            <label className="auth-checkbox-row auth-checkbox-wide">
              <input
                type="checkbox"
                checked={form.newsletter}
                onChange={(event) => updateForm("newsletter", event.target.checked)}
              />
              <span>Send me styling updates and launch offers.</span>
            </label>

            <label className="auth-checkbox-row auth-checkbox-wide">
              <input
                type="checkbox"
                checked={form.acceptTerms}
                onChange={(event) => updateForm("acceptTerms", event.target.checked)}
              />
              <span>
                I agree to the <a href="/footer/terms-conditions" className="auth-link-inline">Terms & Conditions</a>
              </span>
            </label>
            <p className="auth-error-text" aria-live="polite">{termsError}</p>

            <button type="submit" className="btn btn-navy btn-block auth-submit-button" disabled={loading}>
              {loading ? (
                <>
                  <span className="auth-spinner" aria-hidden="true" />
                  Creating account…
                </>
              ) : (
                "Create account"
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
              onClick={() => handleProviderSignup("apple")}
              disabled={Boolean(providerLoading)}
            >
              {appleLabel}
            </button>
          </div>

          <p className="auth-note">Your password is handled by Supabase Auth and your account will be created once you confirm your email address.</p>
        </div>
      </div>
    </section>
  );
}

