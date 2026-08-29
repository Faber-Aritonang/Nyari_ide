// app/api/rag/documents/[id]/route.ts — Delete document
// DELETE: Hapus document dan semua chunks/embeddings terkait

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  _request: NextRequest,
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

    // 1. Hapus embeddings terkait
    await supabase
      .from("embeddings")
      .delete()
      .eq("source_type", "document")
      .eq("source_id", id);

    // 2. Hapus chunks terkait
    const { data: chunks } = await supabase
      .from("document_chunks")
      .select("id")
      .eq("document_id", id);

    if (chunks && chunks.length > 0) {
      await supabase
        .from("document_chunks")
        .delete()
        .eq("document_id", id);
    }

    // 3. Hapus document
    const { error } = await supabase
      .from("documents")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Failed to delete document:", error);
      return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE document error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
