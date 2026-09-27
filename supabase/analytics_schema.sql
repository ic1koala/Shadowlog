-- Daily Analytics Table Schema
-- Used for lightweight PV / UU / Path / UserType tracking and admin analytics persistence.

CREATE TABLE IF NOT EXISTS public.daily_analytics (
  date DATE PRIMARY KEY,
  pv INT NOT NULL DEFAULT 0,
  uu_count INT NOT NULL DEFAULT 0,
  visitors JSONB NOT NULL DEFAULT '[]'::jsonb,
  paths JSONB NOT NULL DEFAULT '{}'::jsonb,
  user_types JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.daily_analytics ENABLE ROW LEVEL SECURITY;

-- Service Role has full access to daily_analytics
CREATE POLICY "Allow service role full access to daily_analytics"
  ON public.daily_analytics FOR ALL USING (true);
