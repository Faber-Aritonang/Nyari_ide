// app/api/usage/route.ts — Usage Dashboard API
// GET: Return usage statistics for the current user

import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/session";
import { query, queryOne } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userConversations = "SELECT id FROM conversations WHERE user_id = $1";

    // 1. Total conversations
    const totalConvRow = await queryOne<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM conversations WHERE user_id = $1`,
      [user.id]
    );
    const totalConversations = parseInt(totalConvRow?.count || "0", 10);

    if (totalConversations === 0) {
      return NextResponse.json({
        stats: { totalConversations: 0, totalMessages: 0, userMessages: 0, assistantMessages: 0, totalImages: 0, totalDocuments: 0, accountAge: 0 },
        messagesByDay: {},
        topConversations: [],
      });
    }

    // 2 & 3. Total messages + per role (1 query)
    const roleCounts = await query<{ role: string; count: string }>(
      `SELECT role, COUNT(*)::text AS count
       FROM messages
       WHERE conversation_id IN (${userConversations})
       GROUP BY role`,
      [user.id]
    );
    const countFor = (role: string) =>
      parseInt(roleCounts.find((r) => r.role === role)?.count || "0", 10);
    const userMessages = countFor("user");
    const assistantMessages = countFor("assistant");
    const totalMessages = roleCounts.reduce((sum, r) => sum + parseInt(r.count, 10), 0);

    // 4. Images generated
    const imagesRow = await queryOne<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM messages
       WHERE conversation_id IN (${userConversations}) AND generated_image_url IS NOT NULL`,
      [user.id]
    );
    const totalImages = parseInt(imagesRow?.count || "0", 10);

    // 5. Messages per day (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentMessages = await query<{ created_at: string }>(
      `SELECT created_at
       FROM messages
       WHERE conversation_id IN (${userConversations}) AND created_at >= $2`,
      [user.id, sevenDaysAgo.toISOString()]
    );

    // Group by day
    const messagesByDay: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      messagesByDay[key] = 0;
    }
    recentMessages.forEach((m) => {
      const day = new Date(m.created_at).toISOString().split("T")[0];
      if (messagesByDay[day] !== undefined) {
        messagesByDay[day]++;
      }
    });

    // 6. Documents uploaded
    const docsRow = await queryOne<{ count: string }>(
      "SELECT COUNT(*)::text AS count FROM documents WHERE user_id = $1",
      [user.id]
    );
    const totalDocuments = parseInt(docsRow?.count || "0", 10);

    // 7. Most active conversations (by updated_at)
    const topConversations = await query<{ id: string; title: string }>(
      "SELECT id, title FROM conversations WHERE user_id = $1 ORDER BY updated_at DESC NULLS LAST LIMIT 5",
      [user.id]
    );

    // Get message counts for top conversations (1 query instead of N)
    const topConvIds = topConversations.map((c) => c.id);
    let msgCountMap = new Map<string, number>();
    if (topConvIds.length > 0) {
      const topConvMessages = await query<{ conversation_id: string; count: string }>(
        `SELECT conversation_id, COUNT(*)::text AS count
         FROM messages
         WHERE conversation_id = ANY($1::uuid[])
         GROUP BY conversation_id`,
        [topConvIds]
      );
      msgCountMap = new Map(
        topConvMessages.map((m) => [m.conversation_id, parseInt(m.count, 10)])
      );
    }

    const topConvWithCounts = topConversations.map((conv) => ({
      ...conv,
      messageCount: msgCountMap.get(conv.id) || 0,
    }));

    // 8. Account age (dari tabel "user" Better Auth)
    const profile = await queryOne<{ createdAt: string }>(
      'SELECT "createdAt" FROM "user" WHERE id = $1',
      [user.id]
    );

    const accountAge = profile?.createdAt
      ? Math.floor(
          (Date.now() - new Date(profile.createdAt).getTime()) / (1000 * 60 * 60 * 24)
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
