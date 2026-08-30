// app/api/conversations/[id]/share/route.ts — Generate share link
// POST: Generate atau dapatkan share link untuk percakapan

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: conversationId } = await params;

    // Verifikasi conversation milik user ini
    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .select("id, title")
      .eq("id", conversationId)
      .eq("user_id", user.id)
      .single();

    if (convError || !conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Cek apakah sudah ada share link
    const { data: existingLink } = await supabase
      .from("share_links")
      .select("id, token, created_at")
      .eq("conversation_id", conversationId)
      .eq("user_id", user.id)
      .single();

    if (existingLink) {
      // Update is_public jika ada perubahan
      const { is_public } = await request.json().catch(() => ({ is_public: true }));
      
      await supabase
        .from("share_links")
        .update({ is_public: is_public ?? true })
        .eq("id", existingLink.id);

      return NextResponse.json({
        token: existingLink.token,
        url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://nyari-ide.vercel.app"}/shared/${existingLink.token}`,
        created_at: existingLink.created_at,
      });
    }

    // Generate share link baru
    const { is_public } = await request.json().catch(() => ({ is_public: true }));

    const { data: newLink, error: linkError } = await supabase
      .from("share_links")
      .insert({
        conversation_id: conversationId,
        user_id: user.id,
        is_public: is_public ?? true,
      })
      .select("token, created_at")
      .single();

    if (linkError) {
      logger.error("Failed to create share link:", linkError);
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
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: conversationId } = await params;

    const { error } = await supabase
      .from("share_links")
      .delete()
      .eq("conversation_id", conversationId)
      .eq("user_id", user.id);

    if (error) {
      logger.error("Failed to delete share link:", error);
      return NextResponse.json(
        { error: "Failed to delete share link" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Delete share link error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
