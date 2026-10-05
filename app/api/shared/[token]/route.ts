// app/api/shared/[token]/route.ts — Get shared conversation
// GET: Ambil percakapan publik berdasarkan token (tanpa auth)

import { NextRequest, NextResponse } from "next/server";
import { queryOne, query } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // Cari share link
    const shareLink = await queryOne<{
      conversation_id: string;
      is_public: boolean;
      expires_at: string | null;
    }>(
      "SELECT conversation_id, is_public, expires_at FROM share_links WHERE token = $1",
      [token]
    );

    if (!shareLink) {
      return NextResponse.json(
        { error: "Share link not found" },
        { status: 404 }
      );
    }

    // Cek apakah public dan belum expired
    if (!shareLink.is_public) {
      return NextResponse.json(
        { error: "This conversation is private" },
        { status: 403 }
      );
    }

    if (shareLink.expires_at && new Date(shareLink.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "This share link has expired" },
        { status: 410 }
      );
    }

    // Ambil percakapan
    const conversation = await queryOne<{ title: string; created_at: string }>(
      "SELECT title, created_at FROM conversations WHERE id = $1",
      [shareLink.conversation_id]
    );

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Ambil pesan
    const messages = await query<{
      role: string;
      content: string;
      image_url: string | null;
      created_at: string;
    }>(
      "SELECT role, content, image_url, created_at FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC",
      [shareLink.conversation_id]
    );

    return NextResponse.json({
      title: conversation.title,
      created_at: conversation.created_at,
      messages: messages,
    });
  } catch (error) {
    logger.error("Shared conversation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
