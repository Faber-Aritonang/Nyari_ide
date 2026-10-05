// app/api/rag/documents/route.ts — Document management for RAG
// GET: List documents user
// POST: Upload document baru

import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/session";
import { query, queryOne } from "@/lib/db";
import { chunkText, generateEmbedding } from "@/lib/rag/embeddings";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await query(
      "SELECT id, title, filename, file_type, file_size, chunk_count, created_at FROM documents WHERE user_id = $1 ORDER BY created_at DESC",
      [user.id]
    );

    return NextResponse.json({ documents: data || [] });
  } catch (error) {
    logger.error("GET documents error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
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
    const doc = await queryOne<{ id: string }>(
      "INSERT INTO documents (user_id, title, filename, content, file_type, file_size) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
      [
        user.id,
        title,
        filename || title,
        truncatedContent,
        file_type || "txt",
        truncatedContent.length,
      ]
    );

    if (!doc) {
      return NextResponse.json({ error: "Failed to save document" }, { status: 500 });
    }

    // 2. Chunk teks
    const chunks = chunkText(truncatedContent);

    // 3. Simpan chunks dan generate embeddings
    let chunkCount = 0;
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];

      // Simpan chunk
      const chunkData = await queryOne<{ id: string }>(
        "INSERT INTO document_chunks (document_id, user_id, chunk_index, content, token_count) VALUES ($1, $2, $3, $4, $5) RETURNING id",
        [
          doc.id,
          user.id,
          i,
          chunk,
          Math.ceil(chunk.length / 4), // rough estimate
        ]
      );

      if (!chunkData) {
        logger.error("Failed to save chunk:", i);
        continue;
      }

      try {
        // Generate dan simpan embedding (vector disimpan sebagai string "[...]") 
        const embedding = await generateEmbedding(chunk);

        await query(
          `INSERT INTO embeddings (chunk_id, user_id, embedding, source_type, source_id, content, metadata)
           VALUES ($1, $2, $3::vector, 'document', $4, $5, $6::jsonb)`,
          [
            chunkData.id,
            user.id,
            JSON.stringify(embedding),
            doc.id,
            chunk,
            JSON.stringify({ document_title: title, chunk_index: i }),
          ]
        );

        chunkCount++;
      } catch (embedError) {
        logger.error("Failed to save embedding:", embedError);
      }
    }

    // Update chunk count
    await query("UPDATE documents SET chunk_count = $2 WHERE id = $1", [doc.id, chunkCount]);

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
