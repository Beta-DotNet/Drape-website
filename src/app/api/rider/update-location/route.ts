import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function parseBody(body: any) {
  return {
    orderId: typeof body?.orderId === "string" ? body.orderId : null,
    lat: typeof body?.lat === "number" ? body.lat : null,
    lng: typeof body?.lng === "number" ? body.lng : null,
    eta: typeof body?.eta === "number" ? body.eta : null,
  };
}

export async function POST(req: Request) {
  try {
    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return jsonError("Server misconfigured: missing Supabase env vars.", 500);
    }

    const authHeader = req.headers.get("authorization") || "";
    // Expect: "Bearer <access_token>"
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : null;
    if (!token) return jsonError("Missing auth token", 401);

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });
    const supabaseUser = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false },
    });

    const { data: { user }, error: userErr } = await supabaseUser.auth.getUser(token);
    if (userErr || !user) return jsonError("Invalid auth token", 401);

    const { data: profile, error: profErr } = await supabaseAdmin
      .from("profiles")
      .select("id, role")
      .eq("id", user.id)
      .maybeSingle();

    if (profErr || !profile) return jsonError("Profile not found", 403);
    if (profile.role !== "admin") return jsonError("Forbidden", 403);

    const body = await req.json().catch(() => null);
    const { orderId, lat, lng, eta } = parseBody(body);
    if (!orderId || lat === null || lng === null) return jsonError("Invalid payload", 400);

    // Update delivery row (upsert if missing)
    const payload = {
      order_id: orderId,
      current_lat: lat,
      current_lng: lng,
      last_updated: new Date().toISOString(),
      ...(eta === null ? {} : { eta }),
      status: "In Transit" as const,
    };

    // We assume unique order_id in deliveries logically; enforce via DB later.
    const { error: upsertErr } = await supabaseAdmin
      .from("deliveries")
      .upsert(payload, { onConflict: "order_id" });

    if (upsertErr) {
      return jsonError(`Failed to persist location: ${upsertErr.message}`, 500);
    }


    // Enqueue realtime broadcast (server-side)
    const { error: enqueueErr } = await supabaseAdmin
      .from("realtime_broadcast_queue")
      .insert({
        channel: `delivery:${orderId}`,
        event: "driver_location",
        payload: { lat, lng, eta: eta ?? null },
      });

    if (enqueueErr) {
      return jsonError(`Failed to enqueue location broadcast: ${enqueueErr.message}`, 500);
    }


    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return jsonError(e?.message || "Unexpected error", 500);
  }
}

