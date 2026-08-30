// app/api/usage/route.ts — Usage Dashboard API
// GET: Return usage statistics for the current user

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's conversation IDs (messages don't have user_id directly)
    const { data: userConversations } = await supabase
      .from("conversations")
      .select("id")
      .eq("user_id", user.id);

    const convIds = userConversations?.map((c) => c.id) || [];

    // 1. Total conversations
    const totalConversations = convIds.length;

    if (convIds.length === 0) {
      return NextResponse.json({
        stats: { totalConversations: 0, totalMessages: 0, userMessages: 0, assistantMessages: 0, totalImages: 0, totalDocuments: 0, accountAge: 0 },
        messagesByDay: {},
        topConversations: [],
      });
    }

    // 2. Total messages
    const { count: totalMessages } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .in("conversation_id", convIds);

    // 3. Messages by role (user vs assistant)
    const { data: messagesByRole } = await supabase
      .from("messages")
      .select("role")
      .in("conversation_id", convIds);

    const userMessages = messagesByRole?.filter((m) => m.role === "user").length || 0;
    const assistantMessages = messagesByRole?.filter((m) => m.role === "assistant").length || 0;

    // 4. Images generated
    const { count: totalImages } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .in("conversation_id", convIds)
      .not("generated_image_url", "is", null);

    // 5. Messages per day (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: recentMessages } = await supabase
      .from("messages")
      .select("created_at")
      .in("conversation_id", convIds)
      .gte("created_at", sevenDaysAgo.toISOString());

    // Group by day
    const messagesByDay: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      messagesByDay[key] = 0;
    }
    recentMessages?.forEach((m) => {
      const day = m.created_at.split("T")[0];
      if (messagesByDay[day] !== undefined) {
        messagesByDay[day]++;
      }
    });

    // 6. Documents uploaded
    const { count: totalDocuments } = await supabase
      .from("documents")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);

    // 7. Most active conversations
    const { data: topConversations } = await supabase
      .from("conversations")
      .select("id, title")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(5);

    // Get message counts for top conversations (1 query instead of N)
    const topConvIds = topConversations?.map((c) => c.id) || [];
    const { data: topConvMessages } = topConvIds.length > 0
      ? await supabase
          .from("messages")
          .select("conversation_id")
          .in("conversation_id", topConvIds)
      : { data: [] };

    const msgCountMap = new Map<string, number>();
    topConvMessages?.forEach((m) => {
      msgCountMap.set(m.conversation_id, (msgCountMap.get(m.conversation_id) || 0) + 1);
    });

    const topConvWithCounts = topConversations?.map((conv) => ({
      ...conv,
      messageCount: msgCountMap.get(conv.id) || 0,
    })) || [];

    // 8. Account age
    const { data: profile } = await supabase
      .from("profiles")
      .select("created_at")
      .eq("id", user.id)
      .single();

    const accountAge = profile?.created_at
      ? Math.floor(
          (Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24)
        )
      : 0;

    return NextResponse.json({
      stats: {
        totalConversations: totalConversations || 0,
        totalMessages: totalMessages || 0,
        userMessages,
        assistantMessages,
        totalImages: totalImages || 0,
        totalDocuments: totalDocuments || 0,
        accountAge,
      },
      messagesByDay,
      topConversations: topConvWithCounts,
    });
  } catch (error) {
    logger.error("[usage] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
