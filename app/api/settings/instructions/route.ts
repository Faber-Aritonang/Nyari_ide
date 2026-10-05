// app/api/settings/instructions/route.ts — Custom instructions management
// GET: ambil custom instructions user
// POST/PUT: simpan custom instructions

import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/session";
import { query, queryOne } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await queryOne<{ instructions: string }>(
      "SELECT instructions FROM custom_instructions WHERE user_id = $1",
      [user.id]
    );

    // Jika belum ada record, return empty string
    return NextResponse.json({ instructions: data?.instructions || "" });
  } catch (error) {
    logger.error("GET instructions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { instructions } = await request.json();

    if (typeof instructions !== "string") {
      return NextResponse.json(
        { error: "instructions must be a string" },
        { status: 400 }
      );
    }

    // Limit: max 2000 characters
    const trimmed = instructions.slice(0, 2000);

    // Upsert: insert or update
    await query(
      `INSERT INTO custom_instructions (user_id, instructions, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_id)
       DO UPDATE SET instructions = $2, updated_at = NOW()`,
      [user.id, trimmed]
    );

    return NextResponse.json({ success: true, instructions: trimmed });
  } catch (error) {
    logger.error("POST instructions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
