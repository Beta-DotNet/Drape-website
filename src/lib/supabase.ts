import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function makeErrorResult(message: string) {
  return Promise.resolve({ data: null, error: { message } });
}

function createFallbackQueryBuilder() {
  const builder: Record<string, any> = {
    select: () => builder,
    order: () => builder,
    eq: () => builder,
    single: () => makeErrorResult("Supabase is not configured. Configure a valid anon key to enable live data."),
    insert: () => makeErrorResult("Supabase is not configured. Configure a valid anon key to enable live data."),
    update: () => makeErrorResult("Supabase is not configured. Configure a valid anon key to enable live data."),
    delete: () => makeErrorResult("Supabase is not configured. Configure a valid anon key to enable live data."),
  };

  return builder;
}

function createFallbackClient() {
  const fallbackChannel = {
    on: (..._args: unknown[]) => fallbackChannel,
    subscribe: (callback?: (status: string) => void) => {
      callback?.("SUBSCRIBED");
      return undefined;
    },
    send: (_payload?: unknown) => undefined,
    unsubscribe: () => undefined,
  };

  return {
    from: () => createFallbackQueryBuilder(),
    channel: () => fallbackChannel,
    removeChannel: () => undefined,
    auth: {
      signInWithOAuth: () => makeErrorResult("Supabase auth is unavailable until a valid anon key is configured."),
      signOut: () => Promise.resolve({ error: null }),
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    },
  };
}

const hasValidSupabaseConfig =
  typeof supabaseUrl === "string" &&
  supabaseUrl.length > 0 &&
  typeof supabaseKey === "string" &&
  supabaseKey.length > 0 &&
  !supabaseKey.startsWith("sb_secret_");

export const supabase = (hasValidSupabaseConfig
  ? createClient(supabaseUrl, supabaseKey)
  : createFallbackClient()) as any;
