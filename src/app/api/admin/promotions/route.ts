import { NextRequest, NextResponse } from "next/server";
import { hasSupabaseServiceRoleConfig, supabaseServer } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {

  if (!hasSupabaseServiceRoleConfig) {
    return NextResponse.json(
      {
        error:
          "Supabase service role env var SUPABASE_SERVICE_ROLE_KEY is missing on the server.",
      },
      { status: 503 }
    );
  }

  const body = await request.json();
  const { title, description, image_url, link_url, cta_text, is_active, start_date, end_date, priority } = body;


  if (!title?.trim() || !description?.trim()) {
    return NextResponse.json({ error: "Title and description are required." }, { status: 400 });
  }

  const insertPayload = {
    title: title.trim(),
    description: description.trim(),
    image_url: image_url?.trim() || null,
    link_url: link_url?.trim() || null,
    cta_text: cta_text?.trim() || null,
    is_active: is_active ?? true,
    start_date: start_date || null,
    end_date: end_date || null,
    priority: Number(priority) || 0,
  };

  const { data, error } = await supabaseServer
    .from("promotions" as any)
    .insert(insertPayload as any)
    .select("*")
    .single();



  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
