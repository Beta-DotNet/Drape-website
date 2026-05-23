import { NextResponse } from "next/server";
import { Paynow } from "paynow";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { items, email, phone, isEcocash } = body;

    // Validate request
    if (!items || !items.length) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    // Initialize Paynow
    // Note: User must set PAYNOW_INTEGRATION_ID and PAYNOW_INTEGRATION_KEY in .env.local
    const integrationId = process.env.PAYNOW_INTEGRATION_ID || "12345";
    const integrationKey = process.env.PAYNOW_INTEGRATION_KEY || "dummy-key";
    
    // Webhook URL must be a publicly accessible URL in production. 
    // In dev, Paynow cannot reach localhost, so we use a dummy or ngrok.
    const resultUrl = "http://localhost:3000/shop?payment=success";
    const returnUrl = "http://localhost:3000/api/paynow/webhook";

    const paynow = new Paynow(integrationId, integrationKey);
    paynow.resultUrl = resultUrl;
    paynow.returnUrl = returnUrl;

    // Calculate total amount
    const totalAmount = items.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0);
    
    // Create the order in Supabase (falls back to random INV number if database isn't ready)
    let orderId = `INV-${Math.floor(Math.random() * 1000000)}`;
    try {
      const { data, error } = await supabase
        .from("orders")
        .insert([
          {
            status: "Pending",
            total_amount: totalAmount,
            shipping_address: { email, phone, address: "Harare, Zimbabwe" },
            items: items.map((item: any) => ({
              product_id: item.product_id,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              size: item.size
            }))
          }
        ])
        .select("id")
        .single();

      if (!error && data) {
        orderId = data.id;
      } else {
        console.warn("Supabase order insert failed, using fallback ID:", error?.message);
      }
    } catch (e: any) {
      console.warn("Supabase connection skipped/failed, using fallback ID:", e.message);
    }
    
    // Create a new payment
    const payment = paynow.createPayment(orderId, email);

    // Add items to payment
    items.forEach((item: any) => {
      payment.add(item.name, item.price * item.quantity);
    });

    let redirectUrl = "";
    let pollUrl = "";
    
    // For development/mocking if integration id isn't set yet:
    if (integrationId === "12345" || integrationId === "") {
      return NextResponse.json({ 
        success: true, 
        orderId,
        message: "Simulated checkout (Add real keys to .env to use live Paynow)",
        redirectUrl: "http://localhost:3000/shop?payment=success" 
      });
    }

    if (isEcocash && phone) {
      // EcoCash Mobile Money Push
      const response = await paynow.sendMobile(payment, phone, "ecocash");
      if (response.success) {
        pollUrl = response.pollUrl;
        return NextResponse.json({ success: true, orderId, pollUrl, message: "EcoCash prompt sent to phone" });
      } else {
        return NextResponse.json({ error: response.error }, { status: 400 });
      }
    } else {
      // Standard Hosted Web Checkout (Card/Vpayments)
      const response = await paynow.send(payment);
      if (response.success) {
        redirectUrl = response.redirectUrl;
        return NextResponse.json({ success: true, orderId, redirectUrl });
      } else {
        return NextResponse.json({ error: response.error }, { status: 400 });
      }
    }
  } catch (error: any) {
    console.error("Paynow Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
