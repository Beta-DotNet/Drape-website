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
    status: typeof body?.status === "string" ? body.status : null,
  };
}

export async function POST(req: Request) {
  try {
    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return jsonError("Server misconfigured: missing Supabase env vars.", 500);
    }

    const authHeader = req.headers.get("authorization") || "";
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
    const { orderId, status } = parseBody(body);
    if (!orderId || !status) return jsonError("Invalid payload", 400);

    // Persist status to orders + deliveries
    const allowed = ["Preparing", "Ready for Pickup", "In Transit", "Delivered"];
    if (!allowed.includes(status)) return jsonError("Invalid status", 400);

    const { error: orderErr } = await supabaseAdmin
      .from("orders")
      .update({ status })
      .eq("id", orderId);

    if (orderErr) {
      return jsonError(`Failed to update order status: ${orderErr.message}`, 500);
    }


    const { error: delErr } = await supabaseAdmin
      .from("deliveries")
      .upsert({
        order_id: orderId,
        status,
        last_updated: new Date().toISOString(),
      }, { onConflict: "order_id" });

    if (delErr) {
      return jsonError(`Failed to update delivery status: ${delErr.message}`, 500);
    }


    // Enqueue realtime broadcast (server-side)
    const { error: enqueueErr } = await supabaseAdmin
      .from("realtime_broadcast_queue")
      .insert({
        channel: `delivery:${orderId}`,
        event: "status_changed",
        payload: { status },
      });

    if (enqueueErr) {
      return jsonError(`Failed to enqueue status broadcast: ${enqueueErr.message}`, 500);
    }


    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return jsonError(e?.message || "Unexpected error", 500);
  }
}

