import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await request.json();
  const { title, description, image_url, link_url, badge_text, is_active, start_date, end_date, priority } = body;

  if (!title?.trim() || !description?.trim()) {
    return NextResponse.json({ error: "Title and description are required." }, { status: 400 });
  }

  const { data, error } = await supabaseServer
    .from("home_deals")
    .update({
      title: title.trim(),
      description: description.trim(),
      image_url: image_url?.trim() || null,
      link_url: link_url?.trim() || null,
      badge_text: badge_text?.trim() || null,
      is_active: is_active ?? true,
      start_date: start_date || null,
      end_date: end_date || null,
      priority: Number(priority) || 0,
    })
    .eq("id", params.id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const { data, error } = await supabaseServer
    .from("home_deals")
    .delete()
    .eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
