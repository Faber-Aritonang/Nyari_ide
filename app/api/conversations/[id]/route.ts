// app/api/conversations/[id]/route.ts — Hapus percakapan

import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/session";
import { query, isUuid } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!isUuid(id)) {
    return NextResponse.json({ error: "Invalid conversation id" }, { status: 400 });
  }

  try {
    // Hanya hapus jika milik user ini (messages & share_links ikut terhapus via ON DELETE CASCADE)
    await query(
      "DELETE FROM conversations WHERE id = $1 AND user_id = $2",
      [id, user.id]
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    logger.error("Failed to delete conversation:", error);
    return NextResponse.json({ error: "Failed to delete conversation" }, { status: 500 });
  }
}
