-- ==========================================
-- MIGRATION: Message Reactions (v2.2)
-- ==========================================

-- 1. Add reaction column to messages table
ALTER TABLE messages ADD COLUMN IF NOT EXISTS reaction TEXT CHECK (reaction IN ('like', 'dislike', NULL));

-- 2. Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_messages_reaction ON messages(reaction);

-- 3. Add comment for documentation
COMMENT ON COLUMN messages.reaction IS 'User reaction to AI message: like (👍) or dislike (👎)';

-- 4. Create function to get reaction stats
CREATE OR REPLACE FUNCTION get_reaction_stats(p_user_id uuid)
RETURNS TABLE (
  total_messages bigint,
  likes bigint,
  dislikes bigint,
  like_ratio numeric
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_messages,
    COUNT(*) FILTER (WHERE reaction = 'like') as likes,
    COUNT(*) FILTER (WHERE reaction = 'dislike') as dislikes,
    CASE 
      WHEN COUNT(*) > 0 THEN 
        ROUND(COUNT(*) FILTER (WHERE reaction = 'like')::numeric / COUNT(*) * 100, 1)
      ELSE 0 
    END as like_ratio
  FROM messages m
  JOIN conversations c ON m.conversation_id = c.id
  WHERE c.user_id = p_user_id
    AND m.role = 'assistant'
    AND m.reaction IS NOT NULL;
END;
$$;
