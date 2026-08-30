// app/api/settings/instructions/route.ts — Custom instructions management
// GET: ambil custom instructions user
// POST/PUT: simpan custom instructions

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("custom_instructions")
      .select("instructions")
      .eq("user_id", user.id)
      .single();

    // Jika belum ada record, return empty string
    if (error && error.code === "PGRST116") {
      return NextResponse.json({ instructions: "" });
    }

    if (error) {
      logger.error("Failed to fetch custom instructions:", error);
      return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }

    return NextResponse.json({ instructions: data?.instructions || "" });
  } catch (error) {
    logger.error("GET instructions error:", error);
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

    const { instructions } = await request.json();

    if (typeof instructions !== "string") {
      return NextResponse.json(
        { error: "instructions must be a string" },
        { status: 400 }
      );
    }

    // Limit: max 2000 characters
    const trimmed = instructions.slice(0, 2000);

    // Upsert: insert or update
    const { error } = await supabase.from("custom_instructions").upsert(
      {
        user_id: user.id,
        instructions: trimmed,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    if (error) {
      logger.error("Failed to save custom instructions:", error);
      return NextResponse.json({ error: "Failed to save" }, { status: 500 });
    }

    return NextResponse.json({ success: true, instructions: trimmed });
  } catch (error) {
    logger.error("POST instructions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
