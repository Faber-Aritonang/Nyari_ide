// app/api/conversations/[id]/branch/route.ts — Branch conversation
// POST: Create a new conversation from a specific message point

import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/session";
import { query, queryOne, isUuid } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { messageId } = await request.json();

    if (!isUuid(id) || !isUuid(messageId)) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Verify conversation belongs to user
    const conversation = await queryOne<{ id: string; title: string }>(
      "SELECT id, title FROM conversations WHERE id = $1 AND user_id = $2",
      [id, user.id]
    );

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Pastikan pesan branch point ada dalam conversation ini
    const branchMessage = await queryOne<{ created_at: string }>(
      "SELECT created_at FROM messages WHERE id = $1 AND conversation_id = $2",
      [messageId, id]
    );

    if (!branchMessage) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    // Create new conversation
    const newConv = await queryOne(
      "INSERT INTO conversations (user_id, title) VALUES ($1, $2) RETURNING *",
      [user.id, `Branch: ${conversation.title}`]
    );

    if (!newConv) {
      return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 });
    }

    // Copy messages up to & including branch point ke conversation baru
    try {
      await query(
        `INSERT INTO messages (conversation_id, role, content, image_url, generated_image_url)
         SELECT $1, m.role, m.content, m.image_url, m.generated_image_url
         FROM messages m
         WHERE m.conversation_id = $2 AND m.created_at <= $3`,
        [newConv.id, id, branchMessage.created_at]
      );
    } catch (insertError) {
      logger.error("Failed to copy messages:", insertError);
      // Still return the new conversation even if message copy fails
    }

    return NextResponse.json(newConv, { status: 201 });
  } catch (error) {
    logger.error("Branch conversation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
