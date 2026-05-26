import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Server-only Supabase client.
// IMPORTANT: requires setting SUPABASE_SERVICE_ROLE_KEY (server-side only).
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const hasSupabaseServiceRoleConfig =
  typeof supabaseUrl === "string" &&
  supabaseUrl.length > 0 &&
  typeof serviceRoleKey === "string" &&
  serviceRoleKey.length > 0;

type StubError = { message: string };

function makeStubResponse<T>() {
  return Promise.resolve({ data: null as T | null, error: { message: "Supabase service role is not configured." } as StubError });
}

type StubQueryBuilder<T> = {
  insert: (..._args: unknown[]) => ReturnType<typeof makeStubResponse>;
  update: (..._args: unknown[]) => ReturnType<typeof makeStubResponse>;
  delete: (..._args: unknown[]) => ReturnType<typeof makeStubResponse>;
  select: (..._args: unknown[]) => StubQueryBuilder<T>;
  single: () => ReturnType<typeof makeStubResponse>;
  eq: (..._args: unknown[]) => StubQueryBuilder<T>;
  order: (..._args: unknown[]) => StubQueryBuilder<T>;
  limit: (..._args: unknown[]) => StubQueryBuilder<T>;
};

function createStubClient() {
  const stub: Record<string, unknown> = {
    from: () => {
      const qb: Record<string, unknown> = {};

      (qb as { select: () => typeof qb }).select = () => qb as typeof qb;
      (qb as { single: () => ReturnType<typeof makeStubResponse> }).single = () => makeStubResponse();
      (qb as { insert: () => ReturnType<typeof makeStubResponse> }).insert = () => makeStubResponse();
      (qb as { update: () => ReturnType<typeof makeStubResponse> }).update = () => makeStubResponse();
      (qb as { delete: () => ReturnType<typeof makeStubResponse> }).delete = () => makeStubResponse();
      (qb as { eq: () => typeof qb }).eq = () => qb as typeof qb;
      (qb as { order: () => typeof qb }).order = () => qb as typeof qb;
      (qb as { limit: () => typeof qb }).limit = () => qb as typeof qb;

      return qb as unknown as StubQueryBuilder<unknown>;
    },
  };

  return stub as unknown as SupabaseClient<any>;
}


let cachedClient: SupabaseClient<any> | null = null;


export function getSupabaseServer() {
  if (!hasSupabaseServiceRoleConfig) {
    // Keep module safe: return a stub so routes can decide how to respond.
    return cachedClient ?? (cachedClient = createStubClient());
  }

  return (cachedClient = createClient(supabaseUrl as string, serviceRoleKey as string, {
    auth: {
      persistSession: false,
    },
  }) as unknown as SupabaseClient<unknown>);
}



export const supabaseServer = getSupabaseServer();




