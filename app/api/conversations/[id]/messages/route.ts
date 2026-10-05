// app/api/conversations/[id]/messages/route.ts — Ambil & simpan pesan dalam percakapan

import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/session";
import { query, queryOne, isUuid } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!isUuid(id)) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  try {
    // Verify conversation belongs to user
    const conversation = await queryOne(
      "SELECT id FROM conversations WHERE id = $1 AND user_id = $2",
      [id, user.id]
    );

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const data = await query(
      "SELECT id, role, content, reaction, generated_image_url FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC",
      [id]
    );

    return NextResponse.json(data);
  } catch (error) {
    logger.error("Failed to fetch messages:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!isUuid(id)) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  try {
    // Verify conversation belongs to user
    const conversation = await queryOne(
      "SELECT id FROM conversations WHERE id = $1 AND user_id = $2",
      [id, user.id]
    );

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const body = await request.json();
    const { role, content, generated_image_url } = body;

    if (!role || !content) {
      return NextResponse.json(
        { error: "Role and content are required" },
        { status: 400 }
      );
    }

    const data = await queryOne(
      "INSERT INTO messages (conversation_id, role, content, generated_image_url) VALUES ($1, $2, $3, $4) RETURNING *",
      [id, role, content, generated_image_url || null]
    );

    // Perbarui updated_at percakapan
    await query("UPDATE conversations SET updated_at = NOW() WHERE id = $1", [id]);

    return NextResponse.json(data);
  } catch (error) {
    logger.error("Failed to save message:", error);
    return NextResponse.json({ error: "Failed to save message" }, { status: 500 });
  }
}
