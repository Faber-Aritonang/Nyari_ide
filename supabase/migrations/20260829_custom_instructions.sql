-- ==========================================
-- MIGRATION: Custom Instructions (v2.0)
-- ==========================================

-- Tabel custom instructions per user
CREATE TABLE custom_instructions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  instructions TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: User hanya bisa baca/tulis custom instructions milik sendiri
ALTER TABLE custom_instructions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own custom instructions" ON custom_instructions
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
