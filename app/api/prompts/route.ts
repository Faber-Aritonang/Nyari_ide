// app/api/prompts/route.ts — Prompt Library API
// GET: List user's saved prompts
// POST: Save a new prompt

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: prompts, error } = await supabase
      .from("saved_prompts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch prompts:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(prompts || []);
  } catch (error) {
    console.error("GET prompts error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, content, category } = await request.json();

    if (!title || !content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
    }

    const { data: prompt, error } = await supabase
      .from("saved_prompts")
      .insert({
        user_id: user.id,
        title,
        content,
        category: category || "general",
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to save prompt:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(prompt, { status: 201 });
  } catch (error) {
    console.error("POST prompts error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "Prompt ID is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("saved_prompts")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Failed to delete prompt:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE prompts error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
