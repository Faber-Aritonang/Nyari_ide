// app/api/conversations/route.ts — List & buat percakapan baru

import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/session";
import { query, queryOne } from "@/lib/db";
import { logger } from "@/lib/logger";

// GET /api/conversations — List semua percakapan user
export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await query(
      "SELECT * FROM conversations WHERE user_id = $1 ORDER BY created_at DESC",
      [user.id]
    );
    return NextResponse.json(data);
  } catch (error) {
    logger.error("Failed to list conversations:", error);
    return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 });
  }
}

// POST /api/conversations — Buat percakapan baru
export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { title } = await request.json();

    const data = await queryOne(
      "INSERT INTO conversations (user_id, title) VALUES ($1, $2) RETURNING *",
      [user.id, title || "Percakapan baru"]
    );

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    logger.error("Failed to create conversation:", error);
    return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 });
  }
}
