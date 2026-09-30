# 問題バンク（300文蓄積＆週次10%入れ替え）・裏先読み（プリフェッチ）・4ジャンル再編 実装仕様書

**作成日**: 2026年9月30日  
**統括担当**: Antigravity Management  
**実装担当**: Full-Stack Developer  

---

## 1. 目的と背景

1. **例文生成5秒待ちの解消**:
   - 現在の「ボタンを押してからGPT＋TTSを直列実行して5秒待つ」体感をなくすため、**「1問目をやっている最中に裏で次の1問を先読み（プリフェッチ）する機能」** と **「生成した例文＋音声をDBに貯めて再利用する問題バンク（`sentence_bank`）」** を導入する。
2. **コストの固定化と飽きない新陳代謝**:
   - 最初から大量生成するのではなく、日々の練習で生成された問題を各ジャンル・レベルごとに **最大300文** まで貯めていく。
   - 300文に達した後はバンクから即時配信（0.1秒・APIコスト0円）しつつ、**毎週「使用された回数（`usage_count`）が多い上位10%（30文）」を削除して新しい問題と入れ替える** ルールで鮮度を保つ。
3. **ジャンルの4カテゴリ再編**:
   - `Finance` を `Business` へ統合し、`Medical` を削除して、**`Tech` / `Business` / `Marketing` / `Daily` の4ジャンル** に整理する。

---

## 2. ジャンル再編仕様（6ジャンル ➔ 4ジャンル）

### ① `Industry` 型の更新 (`src/types/index.ts`)
```ts
export type Industry =
  | "tech"
  | "business"
  | "marketing"
  | "daily";
```
- **後方互換マイグレーション**:
  - ローカルストレージ（`shadowlog_user_settings`, `shadowlog_weak_words`, `shadowlog_stored_sessions` 等）やリクエストボディに旧 `"finance"` が渡された場合は `"business"` に、旧 `"medical"` が渡された場合は `"daily"` に安全にフォールバック変換するヘルパー `normalizeIndustry(input?: string): Industry` を用意する。

### ② プロンプト・シチュエーションの統合 (`src/lib/ai/prompts.ts`)
- 旧 `finance` のシチュエーション（決算発表、投資判断、リスク管理、M&A、予算配分など）を `business` のシチュエーション配列へ統合し、ビジネス・財務の幅広いトピックが生成されるようにする。
- 旧 `medical` を削除する。

### ③ UI表記の更新 (`practice/page.tsx`, `settings/page.tsx`)
- 4ジャンル選択UI:
  1. `tech`: `Tech (IT・開発)`
  2. `business`: `Business (ビジネス・財務)`
  3. `marketing`: `Marketing (マーケ・企画)`
  4. `daily`: `Daily (日常・街中会話)`

---

## 3. 問題バンク（`sentence_bank`）と10%ローテーション仕様

### ① Supabase スキーマ (`supabase/sentence_bank_schema.sql`)
```sql
CREATE TABLE IF NOT EXISTS public.sentence_bank (
  id TEXT PRIMARY KEY,
  industry TEXT NOT NULL,
  level TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'sentence',
  english TEXT NOT NULL,
  japanese TEXT NOT NULL,
  audio_base64 TEXT,
  word_count INT NOT NULL DEFAULT 0,
  usage_count INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sentence_bank_slot
  ON public.sentence_bank(industry, level, mode, usage_count ASC);
```

### ② 問題バンク管理エンジン (`src/lib/ai/sentence-bank.ts`)
- 定数:
  - `MAX_SENTENCES_PER_SLOT = 300`（各ジャンル×レベル×モードの上限300文）
  - `WEEKLY_REPLACE_RATIO = 0.10`（入れ替え比率 10% ＝ 最大30文）
- **主要関数**:
  1. `saveToSentenceBank(item: SentenceResponse)`:
     - 生成された問題（英文、和訳、audioBase64、industry、level、mode）をバンクに保存する。
     - もし該当スロット（`industry + level + mode`）の件数が `MAX_SENTENCES_PER_SLOT`（300文）を超えていた場合、**`usage_count` が多い上位10%（最大30文）を自動削除（パージ）** して新陳代謝枠を確保する。
  2. `pickFromSentenceBank({ industry, level, mode, weakWords, excludeIds })`:
     - バンクから条件に合う問題を検索し、以下の優先度で1問選定する：
       - **優先度1**: `excludeIds` に含まれず、かつユーザーの `weakWords`（苦手単語）のいずれかを含む問題
       - **優先度2**: `excludeIds` に含まれない未出題の問題（`usage_count` が少ないものを優先しつつランダム性を持たせる）
       - **優先度3**: すべて解答済みの場合はスロット内からランダム
     - 選定された問題の `usage_count` を `+1` 更新して返す。
  3. `rotateMostUsedSentences(industry?, level?, mode?)`:
     - 指定されたスロット（または全12スロット）について、**`usage_count`（使用回数）が多い上位10%（300文満杯時は30文）を削除** する週次ローテーション関数。

### ③ `/api/generate-sentence/route.ts` の動作フロー
- リクエストパラメータ: `{ industry, level, topic, mode, weakWords, excludeIds, preferBank }`
- **動作ルール**:
  1. 該当スロット（`industry, level, mode`）のバンク蓄積数をチェック。
  2. **バンクが300文（上限）に達している場合**、または `preferBank: true` で未出題ストックがある場合：
     - バンクから `pickFromSentenceBank` で **0.1秒で即時返却**（OpenAI APIコールなし・コスト0円）。
  3. **バンクが300文未満の場合**:
     - OpenAI（GPT-4o-mini + TTS-1）で新しい問題を生成し、**自動的に `saveToSentenceBank` でバンクに蓄積** した上でクライアントへ返却する。
     - （OpenAIキー未設定やエラー時は既存のバンクまたはフォールバック辞書から返却）。

### ④ 週次ローテーションAPI (`/api/sentence-bank/rotate/route.ts`)
- POST / GET で呼び出し可能なエンドポイント（Cronまたは管理者実行用）。
- 各ジャンル・レベルのストックから、使用回数（`usage_count`）が多い上位10%を削除し、新しい問題が入る枠を開放する。

---

## 4. 裏での「次の1問」先読み（プリフェッチ）仕様 (`src/app/(dashboard)/practice/page.tsx`)

- **仕組み**:
  1. ユーザーが現在の問題（`sentence`）を受け取った直後、バックグラウンドで次の1問を `/api/generate-sentence` にリクエストし、`prefetchedSentenceRef` にキャッシュしておく。
  2. 同時に、これまで出題した問題のID・英文リストを `seenSentenceIdsRef` に記録し、`excludeIds` としてAPIに渡すことで重複出題を防止する。
  3. ユーザーが **「次のフレーズへ ➔」** または **「別のフレーズ」** を押した際：
     - もし同じ条件（`industry, level, mode`）の `prefetchedSentenceRef.current` がすでに準備完了していれば、**API通信を待たずに 0.0秒（即時）で `setSentence` に反映** する！
     - そして直ちにまた「その次の1問」のバックグラウンド先読みを開始する。
     - もし条件（ジャンルやレベル）が途中で変更された場合は、古いプリフェッチを破棄して新しい条件で取得する。

---

## 5. テスト要件

1. `tests/unit/sentence-bank.test.ts` を新規作成:
   - バンクへの保存、苦手単語（`weakWords`）優先選定、`excludeIds` による重複除外、`usage_count` のインクリメント、上位10%の使用回数順ローテーション削除が正しく動作することを検証。
2. 既存テスト（`tests/unit/passage-prompts.test.ts` 等）を4ジャンル仕様に合わせて更新。
3. `npm test` および `npx tsc --noEmit` がすべてパスすること。
