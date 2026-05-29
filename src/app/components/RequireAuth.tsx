"use client";

import React from "react";
import { RequireAuth as RequireAuthInner } from "@/context/AuthContext";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  return <RequireAuthInner>{children}</RequireAuthInner>;
}

