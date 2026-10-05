// app/api/search/route.ts — Search messages across conversations
// GET: Search messages by keyword

import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/session";
import { query } from "@/lib/db";
import { logger } from "@/lib/logger";

interface SearchRow {
  id: string;
  role: string;
  content: string;
  conversation_id: string;
  conversation_title: string;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const queryText = searchParams.get("q");

    if (!queryText || queryText.trim().length === 0) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    // Search messages content (case-insensitive)
    const rows = await query<SearchRow>(
      `SELECT m.id, m.role, m.content, m.conversation_id, c.title AS conversation_title
       FROM messages m
       JOIN conversations c ON c.id = m.conversation_id
       WHERE c.user_id = $1 AND m.content ILIKE $2
       ORDER BY m.created_at DESC
       LIMIT 20`,
      [user.id, `%${queryText}%`]
    );

    // Transform results to include conversation info
    const results = rows.map((msg) => ({
      message_id: msg.id,
      role: msg.role,
      content: msg.content,
      conversation_id: msg.conversation_id,
      conversation_title: msg.conversation_title || "Untitled",
    }));

    return NextResponse.json({ results, query: queryText });
  } catch (error) {
    logger.error("Search API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
