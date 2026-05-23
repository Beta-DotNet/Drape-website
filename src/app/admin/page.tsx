import { redirect } from "next/navigation";

export default function AdminLandingPage() {
  // Default admin entrypoint.
  redirect("/admin/products");
}


