// app/api/conversations/[id]/branch/route.ts — Branch conversation
// POST: Create a new conversation from a specific message point

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

    const { id } = await params;
    const { messageId } = await request.json();

    // Verify conversation belongs to user
    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .select("id, title")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (convError || !conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Get all messages up to and including the branch point
    const { data: messages, error: msgError } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true });

    if (msgError) {
      return NextResponse.json({ error: msgError.message }, { status: 500 });
    }

    // Find the branch point index
    const branchIndex = messages?.findIndex((m) => m.id === messageId) ?? -1;
    if (branchIndex === -1) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    // Take messages up to and including the branch point
    const branchMessages = messages?.slice(0, branchIndex + 1) || [];

    // Create new conversation
    const { data: newConv, error: newConvError } = await supabase
      .from("conversations")
      .insert({
        user_id: user.id,
        title: `Branch: ${conversation.title}`,
      })
      .select()
      .single();

    if (newConvError) {
      return NextResponse.json({ error: newConvError.message }, { status: 500 });
    }

    // Copy messages to new conversation
    if (branchMessages.length > 0) {
      const messagesToInsert = branchMessages.map((m) => ({
        conversation_id: newConv.id,
        role: m.role,
        content: m.content,
        image_url: m.image_url,
        generated_image_url: m.generated_image_url,
      }));

      const { error: insertError } = await supabase
        .from("messages")
        .insert(messagesToInsert);

      if (insertError) {
        console.error("Failed to copy messages:", insertError);
        // Still return the new conversation even if message copy fails
      }
    }

    return NextResponse.json(newConv, { status: 201 });
  } catch (error) {
    console.error("Branch conversation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
