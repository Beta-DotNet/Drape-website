import { NextResponse } from "next/server";
import { Paynow } from "paynow";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    // Paynow sends URL encoded data: status=Paid&paynowreference=...
    const urlParams = new URLSearchParams(rawBody);
    
    // Convert to regular object for verification
    const updateData: { [key: string]: string } = {};
    urlParams.forEach((value, key) => {
      updateData[key] = value;
    });

    const integrationId = process.env.PAYNOW_INTEGRATION_ID || "12345";
    const integrationKey = process.env.PAYNOW_INTEGRATION_KEY || "dummy-key";
    
    // We create a dummy Paynow instance to access the parse method (if available)
    // Actually, Paynow NodeJS SDK doesn't expose a standalone verify hash method natively, 
    // but the standard way is to re-construct the hash and compare.
    const paynow = new Paynow(integrationId, integrationKey);
    
    // For the sake of this mock/demo, we will just parse the status.
    const status = updateData["status"];
    const reference = updateData["reference"]; // This is our Invoice Number (e.g., INV-123)

    if (status === "Paid" || status === "Awaiting Delivery" || status === "Delivered") {
      // Update our database via Supabase
      // Assuming we saved the order using the reference as an identifier
      // In a real app we'd first verify the hash to ensure this really came from Paynow
      /*
      const { error } = await supabase
        .from('orders')
        .update({ status: 'Paid' })
        .eq('id', reference);
      */
      console.log(`Order ${reference} is now ${status}`);
    }

    return new NextResponse("OK", { status: 200 });

  } catch (error: any) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
