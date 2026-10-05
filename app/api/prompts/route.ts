// app/api/prompts/route.ts — Prompt Library API
// GET: List user's saved prompts
// POST: Save a new prompt
// DELETE: Delete a saved prompt

import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/session";
import { query, queryOne, isUuid } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const prompts = await query(
      "SELECT * FROM saved_prompts WHERE user_id = $1 ORDER BY created_at DESC",
      [user.id]
    );

    return NextResponse.json(prompts);
  } catch (error) {
    logger.error("GET prompts error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, content, category } = await request.json();

    if (!title || !content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
    }

    const prompt = await queryOne(
      "INSERT INTO saved_prompts (user_id, title, content, category) VALUES ($1, $2, $3, $4) RETURNING *",
      [user.id, title, content, category || "general"]
    );

    return NextResponse.json(prompt, { status: 201 });
  } catch (error) {
    logger.error("POST prompts error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "Prompt ID is required" }, { status: 400 });
    }

    if (!isUuid(id)) {
      return NextResponse.json({ error: "Invalid prompt id" }, { status: 400 });
    }

    await query("DELETE FROM saved_prompts WHERE id = $1 AND user_id = $2", [id, user.id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("DELETE prompts error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
