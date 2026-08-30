// app/api/rag/documents/route.ts — Document management for RAG
// GET: List documents user
// POST: Upload document baru

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { chunkText, generateEmbedding } from "@/lib/rag/embeddings";
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

    const { data, error } = await supabase
      .from("documents")
      .select("id, title, filename, file_type, file_size, chunk_count, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("Failed to fetch documents:", error);
      return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }

    return NextResponse.json({ documents: data || [] });
  } catch (error) {
    logger.error("GET documents error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, content, file_type, filename } = await request.json();

    if (!title || !content) {
      return NextResponse.json(
        { error: "title and content are required" },
        { status: 400 }
      );
    }

    // Limit: max 100KB teks
    const truncatedContent = content.slice(0, 100000);

    // 1. Simpan document
    const { data: doc, error: docError } = await supabase
      .from("documents")
      .insert({
        user_id: user.id,
        title,
        filename: filename || title,
        content: truncatedContent,
        file_type: file_type || "txt",
        file_size: truncatedContent.length,
      })
      .select("id")
      .single();

    if (docError) {
      logger.error("Failed to save document:", docError);
      return NextResponse.json({ error: "Failed to save document" }, { status: 500 });
    }

    // 2. Chunk teks
    const chunks = chunkText(truncatedContent);

    // 3. Simpan chunks dan generate embeddings
    let chunkCount = 0;
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];

      // Simpan chunk
      const { data: chunkData, error: chunkError } = await supabase
        .from("document_chunks")
        .insert({
          document_id: doc.id,
          user_id: user.id,
          chunk_index: i,
          content: chunk,
          token_count: Math.ceil(chunk.length / 4), // rough estimate
        })
        .select("id")
        .single();

      if (chunkError) {
        logger.error("Failed to save chunk:", chunkError);
        continue;
      }

      // Generate dan simpan embedding
      const embedding = await generateEmbedding(chunk);

      await supabase.from("embeddings").insert({
        chunk_id: chunkData.id,
        user_id: user.id,
        embedding: JSON.stringify(embedding),
        source_type: "document",
        source_id: doc.id,
        content: chunk,
        metadata: { document_title: title, chunk_index: i },
      });

      chunkCount++;
    }

    // Update chunk count
    await supabase
      .from("documents")
      .update({ chunk_count: chunkCount })
      .eq("id", doc.id);

    return NextResponse.json({
      success: true,
      document_id: doc.id,
      chunks_created: chunkCount,
    });
  } catch (error) {
    logger.error("POST documents error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
