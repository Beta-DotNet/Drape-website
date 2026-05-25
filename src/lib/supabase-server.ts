import { createClient } from "@supabase/supabase-js";

// Server-only Supabase client.
// IMPORTANT: requires setting SUPABASE_SERVICE_ROLE_KEY (server-side only).
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  // Don’t throw at module load in case this file is imported accidentally.
  // Routes using it should handle missing config.
  // eslint-disable-next-line no-console
  console.warn(
    "[supabase-server] Missing env vars. Expected NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
  );
}

export const supabaseServer = createClient(supabaseUrl || "", serviceRoleKey || "", {
  auth: {
    persistSession: false,
  },
});

