// app/api/rag/documents/[id]/route.ts — Delete document
// DELETE: Hapus document dan semua chunks/embeddings terkait

import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/session";
import { query, isUuid } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    if (!isUuid(id)) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // 1. Hapus embeddings terkait
    await query(
      "DELETE FROM embeddings WHERE source_type = 'document' AND source_id = $1",
      [id]
    );

    // 2 & 3. Hapus document (chunks ikut terhapus via ON DELETE CASCADE)
    // Hanya hapus jika milik user ini
    const result = await query<{ id: string }>(
      "DELETE FROM documents WHERE id = $1 AND user_id = $2 RETURNING id",
      [id, user.id]
    );

    if (result.length === 0) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("DELETE document error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
