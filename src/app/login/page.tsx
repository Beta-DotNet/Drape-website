"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const redirectTo = searchParams.get("redirect") || "/profile";

  const signInWithProvider = async (provider: "google" | "facebook") => {
    setError(null);
    setLoadingProvider(provider);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
        },
      });

      if (error) throw error;
    } catch (e: any) {
      setError(e?.message || "OAuth sign-in failed");
      setLoadingProvider(null);
    }
  };

  return (
    <section id="view-login" className="view active" style={{ padding: "40px 16px" }}>
      <div
        style={{
          maxWidth: 480,
          margin: "0 auto",
          background: "var(--white)",
          borderRadius: 16,
          border: "1px solid var(--border)",
          boxShadow: "var(--sh-card)",
          padding: 24,
        }}
      >
        <h1 style={{ fontFamily: "var(--font-h)", fontSize: "1.6rem", marginBottom: 8 }}>Log In</h1>
        <p style={{ color: "var(--text-soft)", fontSize: 13, marginBottom: 18 }}>Continue with a provider.</p>


        {error && (
          <div
            style={{
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.25)",
              color: "#b45309",
              padding: "10px 12px",
              borderRadius: 10,
              marginBottom: 14,
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: "grid", gap: 12 }}>
          <button
            className="btn btn-navy btn-block"
            disabled={loadingProvider !== null}
            onClick={() => signInWithProvider("google")}
            style={{ height: 46, fontWeight: 700 }}
          >
            {loadingProvider === "google" ? "Redirecting…" : "Continue with Google"}
          </button>

          <button
            className="btn btn-ghost btn-block"
            disabled={loadingProvider !== null}
            onClick={() => signInWithProvider("facebook")}
            style={{ height: 46, fontWeight: 700, borderColor: "var(--border-mid)" }}
          >
            {loadingProvider === "facebook" ? "Redirecting…" : "Continue with Facebook"}
          </button>
        </div>

        <div style={{ marginTop: 18, fontSize: 13, color: "var(--text-soft)" }}>
          Don&apos;t have an account?
          <button
            className="btn btn-link"
            onClick={() => router.push("/signup")}
            style={{ padding: 0, color: "var(--navy)", fontWeight: 700, textDecoration: "underline" }}
          >
            Sign up
          </button>
        </div>
      </div>
    </section>
  );
}

