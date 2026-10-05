// app/api/conversations/[id]/share/route.ts — Generate share link
// POST: Generate atau dapatkan share link untuk percakapan

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

    const { id: conversationId } = await params;

    if (!isUuid(conversationId)) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Verifikasi conversation milik user ini
    const conversation = await queryOne<{ id: string; title: string }>(
      "SELECT id, title FROM conversations WHERE id = $1 AND user_id = $2",
      [conversationId, user.id]
    );

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Cek apakah sudah ada share link
    const existingLink = await queryOne<{ id: string; token: string; created_at: string }>(
      "SELECT id, token, created_at FROM share_links WHERE conversation_id = $1 AND user_id = $2",
      [conversationId, user.id]
    );

    const { is_public } = await request.json().catch(() => ({ is_public: true }));

    if (existingLink) {
      // Update is_public jika ada perubahan
      await query(
        "UPDATE share_links SET is_public = $2 WHERE id = $1",
        [existingLink.id, is_public ?? true]
      );

      return NextResponse.json({
        token: existingLink.token,
        url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://nyari-ide.vercel.app"}/shared/${existingLink.token}`,
        created_at: existingLink.created_at,
      });
    }

    // Generate share link baru (token dibuat oleh DB default)
    const newLink = await queryOne<{ token: string; created_at: string }>(
      "INSERT INTO share_links (conversation_id, user_id, is_public) VALUES ($1, $2, $3) RETURNING token, created_at",
      [conversationId, user.id, is_public ?? true]
    );

    if (!newLink) {
      return NextResponse.json(
        { error: "Failed to create share link" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      token: newLink.token,
      url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://nyari-ide.vercel.app"}/shared/${newLink.token}`,
      created_at: newLink.created_at,
    });
  } catch (error) {
    logger.error("Share link error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE: Hapus share link
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: conversationId } = await params;

    if (!isUuid(conversationId)) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    await query(
      "DELETE FROM share_links WHERE conversation_id = $1 AND user_id = $2",
      [conversationId, user.id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Delete share link error:", error);
    return NextResponse.json(
      { error: "Failed to delete share link" },
      { status: 500 }
    );
  }
}
