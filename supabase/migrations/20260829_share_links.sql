-- ==========================================
-- MIGRATION: Share Links (v2.0)
-- ==========================================

-- Tabel share links untuk berbagi percakapan
CREATE TABLE share_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Index untuk pencarian token cepat
CREATE INDEX idx_share_links_token ON share_links(token);

-- RSI: User bisa manage share links milik sendiri
ALTER TABLE share_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own share links" ON share_links
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy untuk akses public (tanpa auth)
CREATE POLICY "Public read access for shared links" ON share_links
  FOR SELECT TO anon
  USING (is_public = true AND (expires_at IS NULL OR expires_at > NOW()));
