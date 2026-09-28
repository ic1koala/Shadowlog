-- ShadowLog Waitlist Subscribers Schema for Supabase
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/hshysgjrezfeuolvotnp/sql/new

CREATE TABLE IF NOT EXISTS public.waitlist_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for subscriber query performance
CREATE INDEX IF NOT EXISTS idx_waitlist_subscribers_created_at ON public.waitlist_subscribers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_waitlist_subscribers_email ON public.waitlist_subscribers(email);

-- Row Level Security (RLS)
ALTER TABLE public.waitlist_subscribers ENABLE ROW LEVEL SECURITY;

-- Service Role full access policy
DROP POLICY IF EXISTS "Allow service role full access to waitlist_subscribers" ON public.waitlist_subscribers;
CREATE POLICY "Allow service role full access to waitlist_subscribers"
  ON public.waitlist_subscribers FOR ALL USING (true);

-- Public / Anon can insert waitlist subscribers
DROP POLICY IF EXISTS "Anyone can insert to waitlist" ON public.waitlist_subscribers;
CREATE POLICY "Anyone can insert to waitlist"
  ON public.waitlist_subscribers FOR INSERT WITH CHECK (true);
