"use client";

import { useState } from "react";
import { account, OAuthProvider } from "@/lib/appwrite";

interface GoogleSignInButtonProps {
  label?: string;
  className?: string;
}

export default function GoogleSignInButton({
  label = "Continue with Google",
  className = "",
}: GoogleSignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    if (typeof window === "undefined") return;
    setIsLoading(true);

    try {
      const appwriteAccount = account;
      if (!appwriteAccount) {
        throw new Error("Appwrite client is unavailable. Ensure this is running in the browser and Appwrite env vars are configured.");
      }

      const origin = window.location.origin;
      await appwriteAccount.createOAuth2Session(
        OAuthProvider.Google,
        `${origin}/auth/callback`,
        `${origin}/login`,
        ["email", "profile"]
      );
    } catch (error) {
      console.error("Google sign-in failed:", error);
      setIsLoading(false);
      window.alert("Unable to start Google sign-in. Please try again.");
    }
  };

  return (
    <button
      type="button"
      className={`btn btn-outline btn-block ${className}`}
      onClick={handleClick}
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <span className="auth-spinner" aria-hidden="true" />
          Redirecting…
        </>
      ) : (
        label
      )}
    </button>
  );
}
