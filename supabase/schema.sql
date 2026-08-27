-- ==========================================
-- SCHEMA NYARI_IDE — v1 (FASE 0/1)
-- ==========================================

-- 1. Whitelist email yang boleh mendaftar
CREATE TABLE allowed_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  invited_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Percakapan (milik tiap user)
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT DEFAULT 'Percakapan baru',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Pesan dalam percakapan
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  role TEXT CHECK (role IN ('user','assistant','system')) NOT NULL,
  content TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================

ALTER TABLE allowed_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- allowed_emails: hanya bisa DIBACA oleh user login (untuk validasi whitelist saat register)
CREATE POLICY "Allow read for authenticated" ON allowed_emails
  FOR SELECT TO authenticated USING (true);

-- conversations: user hanya bisa lihat/milikinya sendiri
CREATE POLICY "Users manage own conversations" ON conversations
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- messages: akses via percakapan milik sendiri
CREATE POLICY "Users manage own messages" ON messages
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
        AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
        AND c.user_id = auth.uid()
    )
  );
