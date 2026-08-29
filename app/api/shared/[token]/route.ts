// app/api/shared/[token]/route.ts — Get shared conversation
// GET: Ambil percakapan publik berdasarkan token

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // Gunakan service role untuk akses public (tanpa auth)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Cari share link
    const { data: shareLink, error: linkError } = await supabase
      .from("share_links")
      .select("conversation_id, is_public, expires_at")
      .eq("token", token)
      .single();

    if (linkError || !shareLink) {
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

    if (
      shareLink.expires_at &&
      new Date(shareLink.expires_at) < new Date()
    ) {
      return NextResponse.json(
        { error: "This share link has expired" },
        { status: 410 }
      );
    }

    // Ambil percakapan
    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .select("title, created_at")
      .eq("id", shareLink.conversation_id)
      .single();

    if (convError || !conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Ambil pesan
    const { data: messages, error: msgError } = await supabase
      .from("messages")
      .select("role, content, image_url, created_at")
      .eq("conversation_id", shareLink.conversation_id)
      .order("created_at", { ascending: true });

    if (msgError) {
      console.error("Failed to fetch messages:", msgError);
      return NextResponse.json(
        { error: "Failed to fetch messages" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      title: conversation.title,
      created_at: conversation.created_at,
      messages: messages || [],
    });
  } catch (error) {
    console.error("Shared conversation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
