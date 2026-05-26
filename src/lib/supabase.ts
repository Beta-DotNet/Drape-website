import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function makeErrorResult(message: string) {
  return Promise.resolve({ data: null, error: { message } });
}

type FallbackQueryBuilder = {
  select: (columns?: string) => FallbackQueryBuilder;
  order: (column: string, options?: { ascending?: boolean }) => FallbackQueryBuilder;
  eq: (column: string, value: unknown) => FallbackQueryBuilder;
  in: (column: string, values: unknown[]) => FallbackQueryBuilder;
  or: (query: string) => FallbackQueryBuilder;
  limit: (count: number) => FallbackQueryBuilder;
  maybeSingle: () => Promise<{ data: unknown; error: { message: string } | null }>;
  single: () => Promise<{ data: unknown; error: { message: string } | null }>;
  insert: (payload: unknown) => Promise<{ data: unknown; error: { message: string } | null }>;
  update: (payload: unknown) => Promise<{ data: unknown; error: { message: string } | null }>;
  upsert: (payload: unknown) => Promise<{ data: unknown; error: { message: string } | null }>;
  delete: () => FallbackQueryBuilder;
};

function createFallbackQueryBuilder(): FallbackQueryBuilder {
  const builder: FallbackQueryBuilder = {
    select: () => builder,
    order: () => builder,
    eq: () => builder,
    in: () => builder,
    or: () => builder,
    limit: () => builder,
    maybeSingle: () => makeErrorResult("Supabase is not configured. Configure a valid anon key to enable live data."),
    single: () => makeErrorResult("Supabase is not configured. Configure a valid anon key to enable live data."),
    insert: () => makeErrorResult("Supabase is not configured. Configure a valid anon key to enable live data."),
    update: () => makeErrorResult("Supabase is not configured. Configure a valid anon key to enable live data."),
    upsert: () => makeErrorResult("Supabase is not configured. Configure a valid anon key to enable live data."),
    delete: () => builder,
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
      signInWithPassword: () => makeErrorResult("Supabase auth is unavailable until a valid anon key is configured."),
      signUp: () => makeErrorResult("Supabase auth is unavailable until a valid anon key is configured."),
      signOut: () => Promise.resolve({ error: null }),
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      getUser: () => Promise.resolve({ data: { user: null }, error: { message: "Supabase auth is unavailable until a valid anon key is configured." } }),
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
  : createFallbackClient()) as unknown as ReturnType<typeof createClient>;

