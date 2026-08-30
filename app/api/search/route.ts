// app/api/search/route.ts — Search messages across conversations
// GET: Search messages by keyword

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    // Search messages content (case-insensitive)
    const { data: messages, error } = await supabase
      .from("messages")
      .select(`
        id,
        role,
        content,
        conversation_id,
        conversations!inner(id, title, user_id)
      `)
      .eq("conversations.user_id", user.id)
      .ilike("content", `%${query}%`)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      logger.error("Search error:", error);
      return NextResponse.json({ error: "Search failed" }, { status: 500 });
    }

    // Transform results to include conversation info
    const results = (messages || []).map((msg: any) => ({
      message_id: msg.id,
      role: msg.role,
      content: msg.content,
      conversation_id: msg.conversation_id,
      conversation_title: msg.conversations?.title || "Untitled",
    }));

    return NextResponse.json({ results, query });
  } catch (error) {
    logger.error("Search API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
