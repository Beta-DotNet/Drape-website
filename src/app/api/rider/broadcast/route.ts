import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function parseBody(body: any) {
  return {
    orderId: typeof body?.orderId === "string" ? body.orderId : null,
    event: typeof body?.event === "string" ? body.event : null,
    payload: typeof body?.payload === "object" && body?.payload ? body.payload : null,
  };
}

export async function POST(req: Request) {
  try {
    if (!supabaseUrl || !serviceRoleKey) {
      return jsonError("Server misconfigured: missing Supabase env vars.", 500);
    }

    // NOTE: This endpoint exists to centralize server-side broadcasting.
    // It expects a valid user token + admin role.
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : null;
    if (!token) return jsonError("Missing auth token", 401);

    // Verify user role
    const supabaseUser = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "", {
      auth: { persistSession: false },
    });
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

    const { data: authData, error: userErr } = await supabaseUser.auth.getUser(token);
    if (userErr || !authData?.user) return jsonError("Invalid auth token", 401);

    const { data: profile, error: profErr } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", authData.user.id)
      .maybeSingle();

    if (profErr || !profile) return jsonError("Profile not found", 403);
    if (profile.role !== "admin") return jsonError("Forbidden", 403);

    const body = await req.json().catch(() => null);
    const { orderId, event, payload } = parseBody(body);
    if (!orderId || !event || !payload) return jsonError("Invalid payload", 400);

    // Supabase-js server-side cannot directly call Realtime 'broadcast' channel.
    // Therefore: we write to a helper table and rely on a DB trigger to broadcast.

    const { error } = await supabaseAdmin
      .from("realtime_broadcast_queue")
      .insert({
        channel: `delivery:${orderId}`,
        event,
        payload,
      });

    if (error) return jsonError("Failed to enqueue broadcast", 500);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return jsonError(e?.message || "Unexpected error", 500);
  }
}

