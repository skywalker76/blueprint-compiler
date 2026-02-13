-- ═══════════════════════════════════════════════════════════
-- BLUEPRINT COMPILER — Supabase Schema
-- Run this in Supabase SQL Editor after creating your project
-- ═══════════════════════════════════════════════════════════

-- ─── PROFILES ───
-- Extends auth.users with app-specific data
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'team')),
  stripe_customer_id TEXT,
  monthly_generations INTEGER DEFAULT 0,
  generation_reset_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── BLUEPRINTS ───
-- Cloud-synced blueprint storage
CREATE TABLE blueprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  project_name TEXT NOT NULL,
  domain TEXT NOT NULL,
  mission TEXT,
  ide_target TEXT DEFAULT 'antigravity',
  rigor TEXT DEFAULT 'balanced',
  config JSONB NOT NULL DEFAULT '{}',
  generated JSONB NOT NULL DEFAULT '{}',
  quality_score INTEGER,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── USAGE TRACKING ───
-- Per-generation event log for analytics and limits
CREATE TABLE usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blueprint_id UUID REFERENCES blueprints(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('generate', 'refine', 'export', 'scan')),
  file_type TEXT,
  tokens_used INTEGER,
  quality_score INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── INDEXES ───
CREATE INDEX idx_blueprints_user ON blueprints(user_id);
CREATE INDEX idx_blueprints_public ON blueprints(is_public) WHERE is_public = TRUE;
CREATE INDEX idx_usage_user ON usage_tracking(user_id);
CREATE INDEX idx_usage_created ON usage_tracking(created_at);

-- ─── RLS POLICIES ───

-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Blueprints
ALTER TABLE blueprints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users CRUD own blueprints" ON blueprints
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Anyone reads public blueprints" ON blueprints
  FOR SELECT USING (is_public = TRUE);

-- Usage
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own usage" ON usage_tracking
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own usage" ON usage_tracking
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ─── AUTO-CREATE PROFILE ON SIGNUP ───
-- Trigger function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
