// app/api/images/route.ts — Fetch all generated images
// GET: Return all messages with generated_image_url

import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/session";
import { query } from "@/lib/db";
import { logger } from "@/lib/logger";

interface ImageRow {
  id: string;
  content: string | null;
  generated_image_url: string;
  created_at: string;
  conversation_id: string;
  conversation_title: string;
}

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all messages with generated images from user's conversations
    const rows = await query<ImageRow>(
      `SELECT m.id, m.content, m.generated_image_url, m.created_at, m.conversation_id, c.title AS conversation_title
       FROM messages m
       JOIN conversations c ON c.id = m.conversation_id
       WHERE c.user_id = $1 AND m.generated_image_url IS NOT NULL
       ORDER BY m.created_at DESC`,
      [user.id]
    );

    const images = rows.map((m) => ({
      id: m.id,
      url: m.generated_image_url,
      prompt: m.content?.replace(/^\[🎨.*?\]\s*/, "").trim() || "",
      conversationId: m.conversation_id,
      conversationTitle: m.conversation_title || "Unknown",
      createdAt: m.created_at,
    }));

    return NextResponse.json({ images });
  } catch (error) {
    logger.error("[images] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
