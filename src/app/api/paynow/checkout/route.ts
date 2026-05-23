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
    
    // Create a new payment
    const invoiceNumber = `INV-${Math.floor(Math.random() * 1000000)}`;
    const payment = paynow.createPayment(invoiceNumber, email);

    // Add items to payment
    items.forEach((item: any) => {
      payment.add(item.name, item.price * item.quantity);
    });

    let redirectUrl = "";
    let pollUrl = "";
    
    // For development/mocking if integration id isn't set yet:
    if (integrationId === "12345" || integrationId === "") {
      // Mock mode since keys aren't real yet.
      return NextResponse.json({ 
        success: true, 
        message: "Simulated checkout (Add real keys to .env to use live Paynow)",
        redirectUrl: "http://localhost:3000/shop?payment=success" 
      });
    }

    if (isEcocash && phone) {
      // EcoCash Mobile Money Push
      const response = await paynow.sendMobile(payment, phone, "ecocash");
      if (response.success) {
        pollUrl = response.pollUrl;
        // The user will receive a prompt on their phone.
        return NextResponse.json({ success: true, pollUrl, message: "EcoCash prompt sent to phone" });
      } else {
        return NextResponse.json({ error: response.error }, { status: 400 });
      }
    } else {
      // Standard Hosted Web Checkout (Card/Vpayments)
      const response = await paynow.send(payment);
      if (response.success) {
        redirectUrl = response.redirectUrl;
        return NextResponse.json({ success: true, redirectUrl });
      } else {
        return NextResponse.json({ error: response.error }, { status: 400 });
      }
    }
  } catch (error: any) {
    console.error("Paynow Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
