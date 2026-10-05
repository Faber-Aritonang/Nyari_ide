-- ============================================
-- SCHEMA NYARI_IDE — NEON (PostgreSQL + pgvector)
-- Pengganti supabase/schema.sql + migrations
-- Jalankan di Neon SQL Editor atau: psql "$DATABASE_URL" -f neon/schema.sql
--
-- Catatan:
-- - Tabel auth Better Auth (user, session, account, verification)
--   dibuat otomatis oleh: npx auth@latest migrate  (jalankan SETELAH DATABASE_URL diisi)
-- - Tidak ada RLS: semua akses lewat API routes yang verifikasi session
--   dan selalu menyaring berdasarkan user_id.
-- ============================================

-- Ekstensi
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto; -- gen_random_bytes untuk token share link

-- ==========================================
-- 1. Whitelist email yang boleh mendaftar (maks 10)
-- ==========================================
CREATE TABLE IF NOT EXISTS allowed_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  invited_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 2. Percakapan (milik tiap user)
--    user_id TEXT → mengacu ke tabel "user" milik Better Auth
-- ==========================================
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  title TEXT DEFAULT 'Percakapan baru',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 3. Pesan dalam percakapan
-- ==========================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  role TEXT CHECK (role IN ('user','assistant','system')) NOT NULL,
  content TEXT,
  image_url TEXT,
  generated_image_url TEXT,
  reaction TEXT CHECK (reaction IN ('like','dislike')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 4. Custom instructions per user
-- ==========================================
CREATE TABLE IF NOT EXISTS custom_instructions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT UNIQUE NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  instructions TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 5. Share links (link publik percakapan)
-- ==========================================
CREATE TABLE IF NOT EXISTS share_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  user_id TEXT REFERENCES "user"(id) ON DELETE CASCADE NOT NULL,
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_share_links_token ON share_links(token);

-- ==========================================
-- 6. Prompt library
-- ==========================================
CREATE TABLE IF NOT EXISTS saved_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saved_prompts_user_id ON saved_prompts(user_id);

-- ==========================================
-- 7. Dokumen RAG
-- ==========================================
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  filename TEXT,
  content TEXT,
  file_type TEXT DEFAULT 'txt',
  file_size INTEGER DEFAULT 0,
  chunk_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 8. Chunks dokumen
-- ==========================================
CREATE TABLE IF NOT EXISTS document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  chunk_index INTEGER DEFAULT 0,
  content TEXT,
  token_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 9. Embeddings (pgvector) — untuk RAG search
-- ==========================================
CREATE TABLE IF NOT EXISTS embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  chunk_id UUID,
  embedding vector(1536) NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'document',
  source_id UUID,
  content TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- Indexes
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id ON document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_embeddings_user_id ON embeddings(user_id);
CREATE INDEX IF NOT EXISTS idx_embeddings_source ON embeddings(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_embeddings_embedding
  ON embeddings USING hnsw (embedding vector_cosine_ops);

-- ==========================================
-- Fungsi search_embeddings (pengganti RPC Supabase)
-- Dipakai lib/rag/search.ts dengan parameter:
--   query_embedding, match_count, match_threshold, p_user_id
-- ==========================================
CREATE OR REPLACE FUNCTION search_embeddings(
  query_embedding vector(1536),
  match_count INT DEFAULT 5,
  match_threshold FLOAT DEFAULT 0.3,
  p_user_id TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  source_type TEXT,
  source_id UUID,
  similarity FLOAT,
  metadata JSONB
)
LANGUAGE sql STABLE AS $$
  SELECT
    e.id,
    e.content,
    e.source_type,
    e.source_id,
    1 - (e.embedding <=> query_embedding) AS similarity,
    e.metadata
  FROM embeddings e
  WHERE e.user_id = p_user_id
    AND 1 - (e.embedding <=> query_embedding) > match_threshold
  ORDER BY e.embedding <=> query_embedding
  LIMIT match_count;
$$;
