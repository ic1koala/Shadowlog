-- ShadowLog Feedback & Bug Reports Schema for Supabase
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/hshysgjrezfeuolvotnp/sql/new

CREATE TABLE IF NOT EXISTS public.feedback_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('bug', 'audio_mic', 'feature_request', 'question', 'other')),
  content TEXT NOT NULL,
  screenshot_url TEXT,
  environment_info JSONB,
  status TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'in_progress', 'resolved')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for admin query performance
CREATE INDEX IF NOT EXISTS idx_feedback_tickets_status ON public.feedback_tickets(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_tickets_user_email ON public.feedback_tickets(user_email);

-- Row Level Security (RLS)
ALTER TABLE public.feedback_tickets ENABLE ROW LEVEL SECURITY;

-- Anyone (guests and registered users) can submit feedback
DROP POLICY IF EXISTS "Anyone can insert feedback" ON public.feedback_tickets;
CREATE POLICY "Anyone can insert feedback" ON public.feedback_tickets
  FOR INSERT WITH CHECK (true);

-- Users can view their own submitted tickets, VIP admin can view all
DROP POLICY IF EXISTS "Users can view own feedback" ON public.feedback_tickets;
CREATE POLICY "Users can view own feedback" ON public.feedback_tickets
  FOR SELECT USING (
    auth.uid() = user_id 
    OR auth.jwt() ->> 'email' = 'shadowlog.app@gmail.com'
  );

-- Admin can update ticket status
DROP POLICY IF EXISTS "Admin can update feedback" ON public.feedback_tickets;
CREATE POLICY "Admin can update feedback" ON public.feedback_tickets
  FOR UPDATE USING (
    auth.jwt() ->> 'email' = 'shadowlog.app@gmail.com'
  );
