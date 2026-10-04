-- ShadowLog Web Push Subscriptions Schema for Supabase (FB-033)
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/hshysgjrezfeuolvotnp/sql/new

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT,
  auth TEXT,
  reminder_time TEXT NOT NULL DEFAULT '21:00',
  smart_skip_if_practiced BOOLEAN NOT NULL DEFAULT true,
  enabled BOOLEAN NOT NULL DEFAULT true,
  user_agent TEXT,
  last_notified_date TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_enabled_time
  ON public.push_subscriptions(enabled, reminder_time);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id
  ON public.push_subscriptions(user_id);

-- Row Level Security (RLS)
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow service role full access to push_subscriptions" ON public.push_subscriptions;
CREATE POLICY "Allow service role full access to push_subscriptions"
  ON public.push_subscriptions FOR ALL USING (true);

DROP POLICY IF EXISTS "Users can manage own push_subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can manage own push_subscriptions"
  ON public.push_subscriptions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
