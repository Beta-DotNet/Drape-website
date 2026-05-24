"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const authorized = getAdminSession();

    if (!authorized) {
      router.replace("/login?redirect=/admin");
      return;
    }

    setIsAuthorized(true);
  }, [router]);

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}
