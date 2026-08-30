// lib/rag/embeddings.ts — Embedding service untuk RAG
// Menggunakan TF-IDF sederhana (tanpa API external) atau OpenAI ada-002

import { logger } from "@/lib/logger";

export const EMBEDDING_DIMENSIONS = 1536;
export const CHUNK_SIZE = 500; // karakter per chunk
export const CHUNK_OVERLAP = 50; // overlap antar chunk
export const MAX_CHUNKS_PER_DOCUMENT = 100;

/**
 * Chunk teks menjadi bagian-bagian kecil
 * dengan overlap untuk konteks yang lebih baik
 */
export function chunkText(
  text: string,
  chunkSize: number = CHUNK_SIZE,
  overlap: number = CHUNK_OVERLAP
): string[] {
  const chunks: string[] = [];
  const cleanText = text.replace(/\s+/g, " ").trim();
  
  if (cleanText.length <= chunkSize) {
    return [cleanText];
  }

  let start = 0;
  while (start < cleanText.length && chunks.length < MAX_CHUNKS_PER_DOCUMENT) {
    const end = Math.min(start + chunkSize, cleanText.length);
    let chunk = cleanText.slice(start, end);
    
    // Coba potong di kalimat/paragraf
    if (end < cleanText.length) {
      const lastPeriod = chunk.lastIndexOf(".");
      const lastNewline = chunk.lastIndexOf("\n");
      const breakPoint = Math.max(lastPeriod, lastNewline);
      
      if (breakPoint > chunkSize * 0.5) {
        chunk = chunk.slice(0, breakPoint + 1);
        start = start + breakPoint + 1 - overlap;
      } else {
        start = end - overlap;
      }
    } else {
      start = cleanText.length;
    }
    
    if (chunk.trim()) {
      chunks.push(chunk.trim());
    }
  }

  return chunks;
}

/**
 * Generate simple TF-IDF-like embedding (untuk demo)
 * Dalam production, gunakan OpenAI ada-002 atau model embedding lain
 */
export function generateSimpleEmbedding(text: string): number[] {
  const vector = new Array(EMBEDDING_DIMENSIONS).fill(0);
  const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  
  // Simple hash-based embedding
  for (const word of words) {
    let hash = 0;
    for (let i = 0; i < word.length; i++) {
      hash = ((hash << 5) - hash + word.charCodeAt(i)) | 0;
    }
    
    // Distribute hash ke multiple positions
    const pos1 = Math.abs(hash) % EMBEDDING_DIMENSIONS;
    const pos2 = Math.abs(hash >> 8) % EMBEDDING_DIMENSIONS;
    const pos3 = Math.abs(hash >> 16) % EMBEDDING_DIMENSIONS;
    
    vector[pos1] += 1;
    vector[pos2] += 0.5;
    vector[pos3] += 0.25;
  }
  
  // Normalize vector
  const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
  if (magnitude > 0) {
    for (let i = 0; i < vector.length; i++) {
      vector[i] /= magnitude;
    }
  }
  
  return vector;
}

/**
 * Generate embedding menggunakan OpenAI ada-002
 * Memerlukan OPENAI_API_KEY di environment
 */
export async function generateOpenAIEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    // Fallback ke simple embedding
    logger.warn("OPENAI_API_KEY not found, using simple embedding");
    return generateSimpleEmbedding(text);
  }

  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "text-embedding-ada-002",
      input: text.slice(0, 8191), // OpenAI max tokens
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI embedding failed: ${response.status}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

/**
 * Generate embedding (auto-select method)
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (process.env.OPENAI_API_KEY) {
    return generateOpenAIEmbedding(text);
  }
  return generateSimpleEmbedding(text);
}

/**
 * Hitung cosine similarity antara dua vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
