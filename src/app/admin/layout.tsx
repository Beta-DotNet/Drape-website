"use client";

import { useEffect, useState } from "react";
import { getAdminSession } from "@/lib/admin-auth";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const authorized = getAdminSession();

    if (!authorized) {
      window.location.assign("/login?redirect=/admin");
      return;
    }

    setIsAuthorized(true);
  }, []);

  if (!isAuthorized) {
    return (
      <div style={{ minHeight: "40vh", display: "grid", placeItems: "center", padding: "24px" }}>
        <p style={{ color: "var(--text-soft)" }}>Redirecting to login…</p>
      </div>
    );
  }

  return <>{children}</>;
}
