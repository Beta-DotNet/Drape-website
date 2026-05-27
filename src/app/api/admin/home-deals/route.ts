import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, image_url, cta_text, cta_link, is_active, priority } = body;

    if (!title?.trim() || !description?.trim()) {
      return NextResponse.json({ error: "Title and description are required." }, { status: 400 });
    }

    const { data, error } = await supabaseServer
      .from("home_deals")
      .insert({
        title: title.trim(),
        description: description.trim(),
        image_url: image_url?.trim() || null,
        cta_text: cta_text?.trim() || null,
        cta_link: cta_link?.trim() || null,
        is_active: is_active ?? true,
        priority: Number(priority) || 0,
      })
      .select("*")
      .single();

    if (error) {
      console.error("[admin/home-deals POST] Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error("[admin/home-deals POST] Unhandled error:", err);
    return NextResponse.json({ error: "Unable to create home deal." }, { status: 500 });
  }
}

