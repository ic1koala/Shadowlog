-- ShadowLog Database Schema for Supabase
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/hshysgjrezfeuolvotnp/sql/new

-- 1. Profiles Table (Extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'base', 'pro')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. User Tickets & Trials Table
CREATE TABLE IF NOT EXISTS public.user_tickets (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tickets_used INT NOT NULL DEFAULT 0,
  pro_trials_used INT NOT NULL DEFAULT 0,
  daily_practice_count INT NOT NULL DEFAULT 0,
  last_practice_date DATE DEFAULT CURRENT_DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Practice Sessions (Learning Records & Scores)
CREATE TABLE IF NOT EXISTS public.practice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sentence_id TEXT,
  text_en TEXT NOT NULL,
  text_jp TEXT,
  transcribed_text TEXT,
  accuracy_score NUMERIC(5, 2) NOT NULL DEFAULT 0,
  wpm NUMERIC(5, 1) NOT NULL DEFAULT 0,
  diff_result JSONB,
  coach_feedback JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for user query performance
CREATE INDEX IF NOT EXISTS idx_practice_sessions_user_id ON public.practice_sessions(user_id, created_at DESC);

-- 4. Weak Words (Struggling Words Notebook)
CREATE TABLE IF NOT EXISTS public.weak_words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  fail_count INT NOT NULL DEFAULT 1,
  is_mastered BOOLEAN NOT NULL DEFAULT FALSE,
  last_practiced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, word)
);

CREATE INDEX IF NOT EXISTS idx_weak_words_user_id ON public.weak_words(user_id, is_mastered);

-- 5. Row Level Security (RLS) Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weak_words ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can view & update their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- User Tickets: Users can view & update own tickets
CREATE POLICY "Users can view own tickets" ON public.user_tickets
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own tickets" ON public.user_tickets
  FOR UPDATE USING (auth.uid() = id);

-- Practice Sessions: Users can view, insert, delete own sessions
CREATE POLICY "Users can view own sessions" ON public.practice_sessions
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own sessions" ON public.practice_sessions
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete own sessions" ON public.practice_sessions
  FOR DELETE USING (auth.uid() = id);

-- Weak Words: Users can view, insert, update, delete own weak words
CREATE POLICY "Users can view own weak words" ON public.weak_words
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own weak words" ON public.weak_words
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own weak words" ON public.weak_words
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can delete own weak words" ON public.weak_words
  FOR DELETE USING (auth.uid() = id);

-- 6. Trigger: Auto-create profile & tickets upon user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, plan)
  VALUES (
    NEW.id,
    NEW.email,
    CASE WHEN NEW.email = 'shadowlog.app@gmail.com' THEN 'pro' ELSE 'free' END
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_tickets (user_id, tickets_used, pro_trials_used)
  VALUES (NEW.id, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
