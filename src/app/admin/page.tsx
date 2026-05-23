import { redirect } from "next/navigation";

export default function AdminLandingPage() {
  // Admin navigation points to /admin, but existing admin pages are under /admin/chat and /admin/delivery.
  redirect("/admin/chat");
}

