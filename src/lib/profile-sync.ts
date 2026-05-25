import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export async function syncUserProfile(user: User) {
  const fullName = typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name.trim() : "";
  const [firstName, ...lastNameParts] = fullName.split(/\s+/).filter(Boolean);

  const { error } = await (supabase as any)
    .from("profiles")
    .upsert(
      {
        id: user.id,
        first_name: firstName || null,
        last_name: lastNameParts.join(" ") || null,
        email: user.email || null,
      },
      {
        onConflict: "id",
      }
    );

  return error;
}
