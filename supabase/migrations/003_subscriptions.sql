-- ─── 003: Subscription columns + events table ───
-- Run in Supabase Dashboard → SQL Editor

-- 1) Add Lemon Squeezy columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ls_customer_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ls_subscription_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS usage_reset_at TIMESTAMPTZ DEFAULT NOW();

-- 2) Subscription event log
CREATE TABLE IF NOT EXISTS subscription_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  ls_event_id TEXT,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3) RLS for subscription_events
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;

-- Users can read their own events
CREATE POLICY "Users can view own subscription events"
  ON subscription_events FOR SELECT
  USING (auth.uid() = user_id);

-- Service role (webhook) can insert events for any user
-- (This works because the webhook uses SUPABASE_SERVICE_ROLE_KEY which bypasses RLS)

-- 4) Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_sub_events_user ON subscription_events(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_ls_cust ON profiles(ls_customer_id);
