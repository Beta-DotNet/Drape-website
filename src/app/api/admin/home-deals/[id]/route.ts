import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function PATCH(request: NextRequest, context: { params: { id: string } | Promise<{ id: string }> }) {
  const params = (await Promise.resolve(context.params)) as { id: string };




  try {
    const body = await request.json();
    const { title, description, image_url, cta_text, cta_link, is_active, priority } = body;

    if (!title?.trim() || !description?.trim()) {
      return NextResponse.json({ error: "Title and description are required." }, { status: 400 });
    }

    const { data, error } = await supabaseServer
      .from("home_deals")
      .update({
        title: title.trim(),
        description: description.trim(),
        image_url: image_url?.trim() || null,
        cta_text: cta_text?.trim() || null,
        cta_link: cta_link?.trim() || null,
        is_active: is_active ?? true,
        priority: Number(priority) || 0,
      })
      .eq("id", params.id)
      .select("*")
      .single();

    if (error) {
      console.error("[admin/home-deals PATCH] Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error("[admin/home-deals PATCH] Unhandled error:", err);
    return NextResponse.json({ error: "Unable to update home deal." }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: { params: { id: string } | Promise<{ id: string }> }) {
  const params = (await Promise.resolve(context.params)) as { id: string };


  try {
    const { data, error } = await supabaseServer
      .from("home_deals")
      .delete()
      .eq("id", params.id);

    if (error) {
      console.error("[admin/home-deals DELETE] Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error("[admin/home-deals DELETE] Unhandled error:", err);
    return NextResponse.json({ error: "Unable to delete home deal." }, { status: 500 });
  }
}

