// lib/rag/search.ts — RAG Search Service
// Search similar content dari documents & conversations (pgvector)

import { query, queryOne } from "@/lib/db";
import { generateEmbedding } from "./embeddings";
import { logger } from "@/lib/logger";

export interface SearchResult {
  id: string;
  content: string;
  source_type: "document" | "conversation";
  source_id: string | null;
  similarity: number;
  metadata: Record<string, unknown>;
}

export interface SearchOptions {
  matchCount?: number;
  matchThreshold?: number;
  sourceType?: "document" | "conversation" | "all";
}

/**
 * Search embeddings menggunakan pgvector similarity
 * (fungsi search_embeddings() di neon/schema.sql)
 */
export async function searchEmbeddings(
  queryText: string,
  userId: string,
  options: SearchOptions = {}
): Promise<SearchResult[]> {
  const {
    matchCount = 5,
    matchThreshold = 0.3,
    sourceType = "all",
  } = options;

  try {
    // Generate embedding untuk query
    const queryEmbedding = await generateEmbedding(queryText);

    // Search menggunakan pgvector
    const rows = await query<{
      id: string;
      content: string;
      source_type: string;
      source_id: string | null;
      similarity: number;
      metadata: Record<string, unknown>;
    }>(
      "SELECT * FROM search_embeddings($1::vector, $2, $3, $4)",
      [
        JSON.stringify(queryEmbedding),
        matchCount,
        matchThreshold,
        userId,
      ]
    );

    // Filter by source type if needed
    let results = rows || [];
    if (sourceType !== "all") {
      results = results.filter((r) => r.source_type === sourceType);
    }

    return results.map((r) => ({
      ...r,
      source_type: r.source_type as "document" | "conversation",
      metadata: r.metadata || {},
    }));
  } catch (error) {
    logger.error("RAG search error:", error);
    // Fallback ke simple text search
    return simpleTextSearch(queryText, userId, matchCount);
  }
}

/**
 * Simple text search sebagai fallback
 */
async function simpleTextSearch(
  queryText: string,
  userId: string,
  limit: number
): Promise<SearchResult[]> {
  try {
    const searchTerms = queryText.toLowerCase().split(/\s+/).filter(t => t.length > 2);

    if (searchTerms.length === 0) return [];

    // Search di embeddings content (ILIKE ANY dengan array pattern)
    const patterns = searchTerms.map(term => `%${term}%`);
    const rows = await query<{
      id: string;
      content: string;
      source_type: string;
      source_id: string | null;
      metadata: Record<string, unknown>;
    }>(
      `SELECT id, content, source_type, source_id, metadata
       FROM embeddings
       WHERE user_id = $1 AND content ILIKE ANY($2::text[])
       LIMIT $3`,
      [userId, patterns, limit]
    );

    return (rows || []).map((item) => ({
      ...item,
      source_type: item.source_type as "document" | "conversation",
      similarity: 0.5, // Default similarity
      metadata: item.metadata || {},
    }));
  } catch (error) {
    logger.error("Simple text search error:", error);
    return [];
  }
}

/**
 * Retrieve context untuk chat berdasarkan query
 * Menggabungkan results menjadi satu context string
 */
export async function retrieveContext(
  queryText: string,
  userId: string,
  maxTokens: number = 2000
): Promise<string> {
  const results = await searchEmbeddings(queryText, userId, {
    matchCount: 5,
    matchThreshold: 0.2,
  });

  if (results.length === 0) return "";

  // Bangun context string
  const contextParts: string[] = [];
  let currentLength = 0;

  for (const result of results) {
    const prefix = result.source_type === "document"
      ? `[Dokumen]`
      : `[Percakapan sebelumnya]`;

    const part = `${prefix}\n${result.content}\n`;

    if (currentLength + part.length > maxTokens * 4) break; // rough char estimate

    contextParts.push(part);
    currentLength += part.length;
  }

  return contextParts.join("\n---\n");
}

/**
 * Index conversation ke embeddings
 */
export async function indexConversation(
  conversationId: string,
  userId: string,
  messages: Array<{ role: string; content: string }>
): Promise<void> {
  // Hapus index lama untuk conversation ini
  await query(
    "DELETE FROM embeddings WHERE source_type = 'conversation' AND source_id = $1",
    [conversationId]
  );

  // Index setiap pesan assistant (bukan user)
  const assistantMessages = messages.filter(m => m.role === "assistant" && m.content);

  for (const msg of assistantMessages.slice(-10)) { // Index 10 pesan terakhir
    const embedding = await generateEmbedding(msg.content);

    await query(
      `INSERT INTO embeddings (user_id, embedding, source_type, source_id, content, metadata)
       VALUES ($1, $2::vector, 'conversation', $3, $4, $5::jsonb)`,
      [
        userId,
        JSON.stringify(embedding),
        conversationId,
        msg.content,
        JSON.stringify({ role: msg.role }),
      ]
    );
  }
}
