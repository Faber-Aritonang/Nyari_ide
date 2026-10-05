// app/api/messages/[id]/reaction/route.ts — Update message reaction
// PATCH: Update reaction (like/dislike)

import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/session";
import { queryOne, query, isUuid } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { reaction } = await request.json();

    // Validate reaction value
    if (reaction !== null && reaction !== "like" && reaction !== "dislike") {
      return NextResponse.json(
        { error: "Invalid reaction. Must be 'like', 'dislike', or null" },
        { status: 400 }
      );
    }

    if (!isUuid(id)) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    // Verify message belongs to user (via conversation)
    const message = await queryOne<{ id: string; conversation_id: string; user_id: string }>(
      `SELECT m.id, m.conversation_id, c.user_id
       FROM messages m
       JOIN conversations c ON c.id = m.conversation_id
       WHERE m.id = $1`,
      [id]
    );

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    // Check ownership
    if (message.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Update reaction
    await query("UPDATE messages SET reaction = $2 WHERE id = $1", [id, reaction]);

    return NextResponse.json({ success: true, reaction });
  } catch (error) {
    logger.error("Reaction error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
