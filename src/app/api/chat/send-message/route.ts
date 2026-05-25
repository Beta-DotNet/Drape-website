import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

type SendMessageBody = {
  receiverId?: unknown;
  orderId?: unknown;
  productId?: unknown;
  content?: unknown;
  imageUrl?: unknown;
};

function parseBody(body: SendMessageBody | null) {
  return {
    receiverId: typeof body?.receiverId === "string" ? body.receiverId : null,
    orderId: typeof body?.orderId === "string" ? body.orderId : null,
    productId: typeof body?.productId === "number" ? body.productId : null,
    content: typeof body?.content === "string" ? body.content : "",
    imageUrl: typeof body?.imageUrl === "string" ? body.imageUrl : null,
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

    const body = await req.json().catch(() => null);
    const { receiverId, orderId, productId, content, imageUrl } = parseBody(body);

    const trimmed = content.trim();
    if (!receiverId || !trimmed) return jsonError("Invalid payload", 400);
    if (trimmed.length > 2000) return jsonError("Message too long", 400);

    // Insert message (sender = authenticated user)
    const insertPayload = {
      sender_id: user.id,
      receiver_id: receiverId,
      order_id: orderId,
      product_id: productId,
      content: trimmed,
      image_url: imageUrl,
      status: "sent",
    };

    const { error: insertErr } = await supabaseAdmin.from("messages").insert(insertPayload);
    if (insertErr) return jsonError("Failed to send message", 500);

    // Typing + read receipts are optional. Realtime INSERT will update subscribers.
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unexpected error";
    return jsonError(message, 500);
  }
}


