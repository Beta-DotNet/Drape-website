import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase-server";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

// Simple in-memory rate limiter (per-instance). Suitable for MVP.
// For production, replace with Redis-based rate limit.
const RATE = {
  windowMs: 60_000,
  max: 20,
};

type RateState = { count: number; resetAt: number };
const bucket = new Map<string, RateState>();

function getClientKey(req: Request) {
  const fwd = req.headers.get("x-forwarded-for");
  const ip = (fwd || "").split(",")[0].trim();
  return ip || "anonymous";
}

function rateLimit(req: Request) {
  const key = getClientKey(req);
  const now = Date.now();

  const state = bucket.get(key);
  if (!state || now >= state.resetAt) {
    bucket.set(key, { count: 1, resetAt: now + RATE.windowMs });
    return;
  }

  if (state.count >= RATE.max) {
    throw new Error("RATE_LIMITED");
  }

  state.count += 1;
}

const CartItemSchema = z.object({
  product_id: z.number(),
  quantity: z.number().int().min(1),
});

const BodySchema = z.object({
  items: z.array(CartItemSchema).min(1),
  email: z.string().optional(),
  phone: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    rateLimit(req);

    // Validate request
    const body = BodySchema.parse(await req.json());

    // Fetch product vendor mappings (server-side)
    const productIds = body.items.map((i) => i.product_id);

    const { data: products, error: productsError } = await (supabaseServer as any)
      .from("products")
      .select("id, vendor_id")
      .in("id", productIds);

    if (productsError) {
      return NextResponse.json(
        { error: "Failed to validate cart items" },
        { status: 400 }
      );
    }

    const byId = new Map<number, any>();
    for (const p of (Array.isArray(products) ? products : []) as any[]) {
      const id = typeof p.id === "number" ? p.id : Number(p.id);
      byId.set(id, p);
    }

    // Multi-vendor detection + missing vendor checks
    const vendorIds = new Set<number>();
    for (const item of body.items) {
      const row = byId.get(item.product_id);
      const vendorId = row?.vendor_id;
      if (!vendorId) {
        return NextResponse.json(
          { error: "WhatsApp payment not available for one or more items" },
          { status: 400 }
        );
      }
      vendorIds.add(Number(vendorId));
    }

    if (vendorIds.size !== 1) {
      return NextResponse.json(
        {
          error:
            "Your cart contains items from different boutiques. Please place separate orders.",
        },
        { status: 400 }
      );
    }

    const vendorId = Array.from(vendorIds)[0];

    const { data: vendorRow, error: vendorError } = await (supabaseServer as any)
      .from("vendors")
      .select("id, whatsapp_number")
      .eq("id", vendorId)
      .single();

    if (vendorError || !vendorRow) {
      return NextResponse.json(
        { error: "WhatsApp payment not available" },
        { status: 400 }
      );
    }

    const whatsappNumber = vendorRow.whatsapp_number;
    if (!whatsappNumber) {
      return NextResponse.json(
        { error: "WhatsApp payment not available" },
        { status: 400 }
      );
    }

    // Compute total_amount by re-fetching prices from products
    const { data: productsWithPrice, error: priceError } = await (supabaseServer as any)
      .from("products")
      .select("id, price")
      .in("id", productIds);

    if (priceError) {
      return NextResponse.json(
        { error: "Failed to compute order total" },
        { status: 400 }
      );
    }

    const priceById = new Map<number, number>();
    for (const p of (Array.isArray(productsWithPrice) ? productsWithPrice : []) as any[]) {
      const id = typeof p.id === "number" ? p.id : Number(p.id);
      const price = typeof p.price === "number" ? p.price : Number(p.price ?? 0);
      priceById.set(id, price);
    }

    const totalAmount = body.items.reduce((acc, i) => {
      const price = priceById.get(i.product_id) ?? 0;
      return acc + price * i.quantity;
    }, 0);

    // Create order
    const { data: orderInsertData, error: insertError } = await (supabaseServer as any)
      .from("orders")
      .insert([
        {
          user_id: null,
          status: "Pending",
          total_amount: totalAmount,
          shipping_address: {
            email: body.email || null,
            phone: body.phone || null,
            address: "Harare, Zimbabwe",
          },
          items: body.items.map((i) => ({
            product_id: i.product_id,
            quantity: i.quantity,
          })),
          payment_method: "whatsapp",
          vendor_id: vendorId,
        },
      ])
      .select("id")
      .single();

    if (insertError || !orderInsertData?.id) {
      return NextResponse.json(
        { error: "Failed to create order" },
        { status: 500 }
      );
    }

    const orderId = String(orderInsertData.id);

    // Build WhatsApp message + URL (server side only)
    const text = `Hi Drape! I would like to place my order. Order ID: ${orderId}`;
    const waUrl = buildWhatsAppUrl(whatsappNumber, text);

    // Redirect through confirmation page so the user sees fallback link.
    const redirectUrl = `/order-confirmation?orderId=${encodeURIComponent(
      orderId
    )}&waUrl=${encodeURIComponent(waUrl)}`;

    return NextResponse.json({ success: true, orderId, redirectUrl });
  } catch (err: any) {
    if (err?.message === "RATE_LIMITED") {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: err?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}

