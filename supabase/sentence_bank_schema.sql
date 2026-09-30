-- ShadowLog: 共有問題バンク (sentence_bank) スキーマ
-- 4業種(tech, business, marketing, daily) × 3難易度(beginner, intermediate, advanced) × mode(sentence, passage)
-- 各スロット最大300問を蓄積し、週次で出題回数(usage_count)上位10%(最大30問)を自動入れ替えする

CREATE TABLE IF NOT EXISTS public.sentence_bank (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  english TEXT NOT NULL,
  japanese TEXT NOT NULL,
  audio_base64 TEXT,
  word_count INTEGER NOT NULL DEFAULT 0,
  industry TEXT NOT NULL,
  level TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'sentence',
  usage_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sentence_bank_slot
  ON public.sentence_bank (industry, level, mode);

CREATE INDEX IF NOT EXISTS idx_sentence_bank_usage
  ON public.sentence_bank (industry, level, mode, usage_count DESC);

ALTER TABLE public.sentence_bank ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read sentence_bank" ON public.sentence_bank;
CREATE POLICY "Allow public read sentence_bank"
  ON public.sentence_bank
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow public insert sentence_bank" ON public.sentence_bank;
CREATE POLICY "Allow public insert sentence_bank"
  ON public.sentence_bank
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update sentence_bank" ON public.sentence_bank;
CREATE POLICY "Allow public update sentence_bank"
  ON public.sentence_bank
  FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Allow public delete sentence_bank" ON public.sentence_bank;
CREATE POLICY "Allow public delete sentence_bank"
  ON public.sentence_bank
  FOR DELETE
  USING (true);
