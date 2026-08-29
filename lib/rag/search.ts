// lib/rag/search.ts — RAG Search Service
// Search similar content dari documents & conversations

import { createClient } from "@/lib/supabase/server";
import { generateEmbedding, cosineSimilarity } from "./embeddings";

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
 */
export async function searchEmbeddings(
  query: string,
  userId: string,
  options: SearchOptions = {}
): Promise<SearchResult[]> {
  const {
    matchCount = 5,
    matchThreshold = 0.3,
    sourceType = "all",
  } = options;

  const supabase = await createClient();

  // Generate embedding untuk query
  const queryEmbedding = await generateEmbedding(query);

  // Search menggunakan pgvector
  const { data, error } = await supabase.rpc("search_embeddings", {
    query_embedding: queryEmbedding,
    match_count: matchCount,
    match_threshold: matchThreshold,
    p_user_id: userId,
  });

  if (error) {
    console.error("RAG search error:", error);
    // Fallback ke simple text search
    return simpleTextSearch(query, userId, matchCount);
  }

  // Filter by source type if needed
  let results = data || [];
  if (sourceType !== "all") {
    results = results.filter((r: SearchResult) => r.source_type === sourceType);
  }

  return results;
}

/**
 * Simple text search sebagai fallback
 */
async function simpleTextSearch(
  query: string,
  userId: string,
  limit: number
): Promise<SearchResult[]> {
  const supabase = await createClient();
  const searchTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);

  if (searchTerms.length === 0) return [];

  // Search di embeddings content
  const { data, error } = await supabase
    .from("embeddings")
    .select("id, content, source_type, source_id, metadata")
    .eq("user_id", userId)
    .or(
      searchTerms.map(term => `content.ilike.%${term}%`).join(",")
    )
    .limit(limit);

  if (error) {
    console.error("Simple text search error:", error);
    return [];
  }

  return (data || []).map((item) => ({
    ...item,
    similarity: 0.5, // Default similarity
    metadata: item.metadata || {},
  }));
}

/**
 * Retrieve context untuk chat berdasarkan query
 * Menggabungkan results menjadi satu context string
 */
export async function retrieveContext(
  query: string,
  userId: string,
  maxTokens: number = 2000
): Promise<string> {
  const results = await searchEmbeddings(query, userId, {
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
  const supabase = await createClient();

  // Hapus index lama untuk conversation ini
  await supabase
    .from("embeddings")
    .delete()
    .eq("source_type", "conversation")
    .eq("source_id", conversationId);

  // Index setiap pesan assistant (bukan user)
  const assistantMessages = messages.filter(m => m.role === "assistant" && m.content);

  for (const msg of assistantMessages.slice(-10)) { // Index 10 pesan terakhir
    const embedding = await generateEmbedding(msg.content);

    await supabase.from("embeddings").insert({
      user_id: userId,
      chunk_id: null, // conversation chunks tidak perlu table terpisah
      embedding: JSON.stringify(embedding),
      source_type: "conversation",
      source_id: conversationId,
      content: msg.content,
      metadata: { role: msg.role },
    });
  }
}
