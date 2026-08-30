// app/api/images/route.ts — Fetch all generated images
// GET: Return all messages with generated_image_url

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user's conversation IDs first
    const { data: userConversations } = await supabase
      .from("conversations")
      .select("id")
      .eq("user_id", user.id);

    const convIds = userConversations?.map((c) => c.id) || [];

    if (convIds.length === 0) {
      return NextResponse.json({ images: [] });
    }

    // Fetch all messages with generated images from user's conversations
    const { data: messages, error } = await supabase
      .from("messages")
      .select("id, content, generated_image_url, created_at, conversation_id")
      .in("conversation_id", convIds)
      .not("generated_image_url", "is", null)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[images] Error fetching images:", error);
      return NextResponse.json({ error: "Failed to fetch images" }, { status: 500 });
    }

    // Also get conversation titles for context
    const conversationIds = [...new Set(messages?.map((m) => m.conversation_id) || [])];
    const { data: conversations } = await supabase
      .from("conversations")
      .select("id, title")
      .in("id", conversationIds);

    const conversationMap = new Map(conversations?.map((c) => [c.id, c.title]) || []);

    const images = messages?.map((m) => ({
      id: m.id,
      url: m.generated_image_url,
      prompt: m.content?.replace(/^\[🎨.*?\]\s*/, "").trim() || "",
      conversationId: m.conversation_id,
      conversationTitle: conversationMap.get(m.conversation_id) || "Unknown",
      createdAt: m.created_at,
    })) || [];

    return NextResponse.json({ images });
  } catch (error) {
    console.error("[images] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
