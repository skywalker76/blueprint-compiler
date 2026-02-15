-- ═══════════════════════════════════════════
-- Blueprint Compiler: Feedback Table Migration
-- Run this in Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════

CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  blueprint_id TEXT,
  rating TEXT CHECK (rating IN ('up', 'down')) NOT NULL,
  comment TEXT,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Users can insert their own feedback
CREATE POLICY "Users can insert own feedback"
  ON feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can read their own feedback
CREATE POLICY "Users can read own feedback"
  ON feedback FOR SELECT
  USING (auth.uid() = user_id);

-- Allow anon inserts for anonymous feedback
CREATE POLICY "Anonymous feedback allowed"
  ON feedback FOR INSERT
  WITH CHECK (user_id IS NULL);
