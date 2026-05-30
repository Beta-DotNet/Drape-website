"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type OrderConfirmationClientProps = {
  waUrl: string;
  orderId: string;
};

export default function OrderConfirmationClient({ waUrl, orderId }: OrderConfirmationClientProps) {
  const [isRedirecting, setIsRedirecting] = useState(true);

  const fallbackHref = useMemo(() => waUrl || "/shop", [waUrl]);

  useEffect(() => {
    if (!waUrl) {
      setIsRedirecting(false);
      return;
    }

    const timer = window.setTimeout(() => {
      try {
        window.location.href = waUrl;
      } catch {
        setIsRedirecting(false);
      }
    }, 350);

    return () => window.clearTimeout(timer);
  }, [waUrl]);

  return (
    <main style={{ padding: "84px 24px 64px", minHeight: "70vh" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            aria-hidden="true"
            style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              background: "rgba(34,197,94,0.10)",
              color: "#16a34a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
              border: "1px solid rgba(34,197,94,0.22)",
            }}
          >
            ✓
          </div>
          <div>
            <h1 style={{ fontFamily: "var(--font-h)", fontSize: 26, margin: 0, color: "var(--navy)" }}>
              Order received
            </h1>
            {orderId ? (
              <div style={{ marginTop: 4, color: "var(--text-soft)", fontSize: 13 }}>
                Order ID: <span style={{ color: "var(--text-mid)", fontWeight: 700 }}>{orderId}</span>
              </div>
            ) : null}
          </div>
        </div>

        <div
          style={{
            marginTop: 18,
            padding: "16px 16px",
            borderRadius: 18,
            background: "var(--surface, #f8fafc)",
            border: "1px solid var(--border)",
          }}
        >
          <p style={{ margin: 0, color: "var(--text-mid)", lineHeight: 1.7, fontSize: 15 }}>
            You’ll be redirected to WhatsApp. If nothing happens, click here.
          </p>

          <div style={{ marginTop: 14 }}>
            <Link href={fallbackHref} className="btn btn-navy" style={{ display: "inline-flex" }}>
              {isRedirecting ? "Click here" : "Open WhatsApp"}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
