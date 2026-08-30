// app/api/messages/[id]/reaction/route.ts — Update message reaction
// PATCH: Update reaction (like/dislike)

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

export async function PATCH(
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
    const { reaction } = await request.json();

    // Validate reaction value
    if (reaction !== null && reaction !== "like" && reaction !== "dislike") {
      return NextResponse.json(
        { error: "Invalid reaction. Must be 'like', 'dislike', or null" },
        { status: 400 }
      );
    }

    // Verify message belongs to user (via conversation)
    const { data: message, error: fetchError } = await supabase
      .from("messages")
      .select("id, conversation_id, conversations!inner(user_id)")
      .eq("id", id)
      .single();

    if (fetchError || !message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    // Check ownership
    if ((message.conversations as any).user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Update reaction
    const { error: updateError } = await supabase
      .from("messages")
      .update({ reaction })
      .eq("id", id);

    if (updateError) {
      logger.error("Failed to update reaction:", updateError);
      return NextResponse.json(
        { error: "Failed to update reaction" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, reaction });
  } catch (error) {
    logger.error("Reaction error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
