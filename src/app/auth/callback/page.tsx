"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getDisplayUsernameFromUser, setStoredAuthSession } from "@/lib/auth-session";
import { supabase } from "@/lib/supabase";
import { syncUserProfile } from "@/lib/profile-sync";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Finalizing your account…");

  const nextPath = useMemo(() => {
    if (typeof window === "undefined") {
      return "/profile";
    }

    const params = new URLSearchParams(window.location.search);
    const next = params.get("next");

    if (next && next.startsWith("/")) {
      return next;
    }

    return "/profile";
  }, []);

  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      if (typeof window === "undefined") {
        return;
      }

      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const error = params.get("error");
      const errorDescription = params.get("error_description");

      if (error) {
        const message = errorDescription || "Authentication failed. Please try again.";
        if (isMounted) {
          setStatus(message);
        }
        window.setTimeout(() => router.replace("/login"), 1800);
        return;
      }

      if (!code) {
        if (isMounted) {
          setStatus("No confirmation code was found. Redirecting to sign in…");
        }
        window.setTimeout(() => router.replace("/login"), 1200);
        return;
      }

      try {
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError || !data.session) {
          throw exchangeError || new Error("We could not verify your session.");
        }

        const profileError = await syncUserProfile(data.session.user);

        if (profileError) {
          throw profileError;
        }

        setStoredAuthSession({
          username: getDisplayUsernameFromUser(data.session.user),
          email: data.session.user.email ?? undefined,
        });

        if (isMounted) {
          setStatus("Email confirmed. Redirecting to your profile…");
        }

        window.setTimeout(() => router.replace(nextPath), 800);
      } catch (callbackError: unknown) {
        const message = callbackError instanceof Error ? callbackError.message : "Unable to complete confirmation. Please sign in again.";

        if (isMounted) {
          setStatus(message);
        }

        window.setTimeout(() => router.replace("/login"), 1800);
      }
    };

    void run();

    return () => {
      isMounted = false;
    };
  }, [nextPath, router]);

  return (
    <section className="view active auth-page-shell">
      <div className="auth-card" style={{ maxWidth: 640, margin: "4rem auto" }}>
        <div className="auth-card-header">
          <div>
            <p className="auth-brand">drape</p>
            <h1 className="auth-card-title">Confirming your account</h1>
            <p className="auth-card-copy">Please wait while we verify your email and finish setting up your profile.</p>
          </div>
        </div>
        <div className="auth-status info">{status}</div>
      </div>
    </section>
  );
}
