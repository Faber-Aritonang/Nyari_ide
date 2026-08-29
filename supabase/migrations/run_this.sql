-- ==========================================
-- NYARI_IDE v2.0 — Jalankan ini di Supabase SQL Editor
-- ==========================================

-- 1. Custom Instructions
CREATE TABLE custom_instructions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  instructions TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE custom_instructions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own custom instructions" ON custom_instructions
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2. Share Links
CREATE TABLE share_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX idx_share_links_token ON share_links(token);

ALTER TABLE share_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own share links" ON share_links
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public read access for shared links" ON share_links
  FOR SELECT TO anon
  USING (is_public = true AND (expires_at IS NULL OR expires_at > NOW()));
