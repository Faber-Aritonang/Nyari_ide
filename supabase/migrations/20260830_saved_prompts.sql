-- Migration: Create saved_prompts table for Prompt Library
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS saved_prompts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE saved_prompts ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own prompts" ON saved_prompts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own prompts" ON saved_prompts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own prompts" ON saved_prompts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own prompts" ON saved_prompts
  FOR DELETE USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_saved_prompts_user_id ON saved_prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_prompts_category ON saved_prompts(category);
