# 仕様書: フレーズ読み上げ動的WPM表示 & 弱点カルテ・リベンジ例文生成

**策定日**: 2026年10月1日  
**ステータス**: 仕様確定（技術相談・オーナー合意済み）  
**担当**: 技術相談担当 ➔ 実装担当（引き継ぎ用）  
**共有先**: プロジェクト統括担当 (`e4ece4cd-0a8e-4b24-8777-a23d9c79dcfc`)

---

## 1. 概要と背景・目的

シャドーイング学習のコア体験および継続率（リテンション）を向上させるため、以下の2つの機能を導入する。

1. **フレーズ読み上げ速度の「動的WPM」リアルタイム表示**:
   - 従来の「0.6x / 1.0x / 1.2x」倍率表記に、その文の実際の音声長から算出した「実効WPM」を併記。
   - 発話解析結果のWPM指標と統一し、受講者が目指すべきネイティブ速度（目標WPM）を直感的に把握できる学習環境を提供する。
2. **発話ログ蓄積型「弱点カルテ & リベンジ例文生成」 (施策③)**:
   - 録音差分解析（Whisper + Needleman-Wunsch Diff）で検出された脱落単語（`missing`）および誤読単語（`mismatch`）をSupabaseに蓄積。
   - 蓄積された弱点単語・音素の傾向を分析し、次回のAI例文生成時に苦手単語を優先的に織り交ぜた「リベンジ例文」を自動生成する。

---

## 2. 機能A: 読み上げ速度の動的WPM表示 仕様

### 2.1 計算ロジック（クライアント側完結・追加APIゼロ）
- **処理時間 / 表示遅延**: **0.001ミリ秒未満（遅延ゼロ）**
  - 追加のサーバー通信は一切行わず、ロード済みの `HTMLAudioElement` の `duration` と単語数から即座に算出する。
- **計算式**:
  ```typescript
  // 単語数 / 音声秒数 で基準WPM(1.0x)を算出
  const baseWpm = Math.round((parsedWords.length / audioDuration) * 60);

  // 各再生速度ごとの実効WPM
  const slowWpm = Math.round(baseWpm * 0.6);   // 0.6x (スロー確認)
  const normalWpm = baseWpm;                    // 1.0x (標準)
  const fastWpm = Math.round(baseWpm * 1.2);    // 1.2x (ビジネス実践)
  ```
- **フォールバック**:
  - 音声メタデータ読み込み前、またはWeb Speech APIフォールバック時は、標準目安値（75 / 125 / 150 WPM）を表示。

### 2.2 UIデザイン（2段組みコンパクトカプセル）
- 対象ファイル: `src/components/features/practice/SentenceCard.tsx`
- 既存の丸ボタンの縦横比を整え、スマホでも横スクロールや改行を起こさないコンパクトな幅（各ボタン約48〜52px）で配置。
  - 上段: `0.6x`, `1.0x`, `1.2x`（太字、`text-xs font-bold`）
  - 下段: `~78`, `~130`, `~156`（極小文字、`text-[10px] text-muted-foreground`、単位 `WPM` は右端または選択時に表示）

---

## 3. 機能B: 弱点カルテ & リベンジ例文生成 仕様

### 3.1 データベース設計 (Supabase)
新設テーブル: `user_weaknesses`
```sql
CREATE TABLE IF NOT EXISTS public.user_weaknesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  word TEXT NOT NULL,                     -- 苦手単語 (小文字正規化)
  miss_type TEXT NOT NULL,                -- 'missing' (脱落) または 'mismatch' (誤読)
  spoken_word TEXT,                       -- mismatch時の聞き取られた発話内容
  context_sentence TEXT,                  -- 出題元の英文
  error_count INTEGER DEFAULT 1,          -- 累積ミス回数
  last_practiced_at TIMESTAMPTZ DEFAULT now(),
  mastered BOOLEAN DEFAULT false,         -- 克服フラグ (直近2回連続正解でtrue等)
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 高速検索用インデックス
CREATE INDEX IF NOT EXISTS idx_user_weaknesses_user_count 
ON public.user_weaknesses(user_id, error_count DESC);
```

### 3.2 収集フロー（`/api/transcribe-diff`）
1. 音声文字起こし＆Diff計算完了時、`diff.tokens` をフィルタリング。
2. `missing` または `mismatch` の単語を抽出（冠詞 `a`, `the` や前置詞等の重要機能語、および主要語）。
3. Supabaseに `upsert`（既存単語なら `error_count` をインクリメント、`last_practiced_at` を更新）。
4. レスポンス遅延を防ぐため、DB保存は非同期（バックグラウンド処理）で実行。

### 3.3 リベンジ例文生成フロー（`/api/generate-sentence`）
1. 例文生成リクエスト時、`user_weaknesses` から `mastered = false` かつミス回数が多い上位3〜5単語を取得。
2. GPT-4o-miniのシステムプロンプトに以下を注入：
   ```text
   【重点克服リベンジ要件】
   以下の学習者が苦手とする単語を自然な文脈で必ず1〜2語含めて英文を作成してください:
   - 弱点単語: [ ${weakWords.join(", ")} ]
   ```
3. ユーザーの練習画面上では、リベンジ単語に「🔥 弱点克服ワード」のさりげないバッジを表示し、モチベーションを最大化。

---

## 4. 実装フェーズ計画

- **Phase 1: フレーズ読み上げ動的WPM表示（即日反映可能・リスクゼロ）**
  - `SentenceCard.tsx` の `audioDuration` 取得とWPM計算ロジック追加
  - コンパクトUIの適用とスマホ表示確認
- **Phase 2: 弱点データ蓄積基盤（テストモード / モック検証）**
  - SupabaseマイグレーションSQLの適用
  - `/api/transcribe-diff` からの非同期保存処理追加
  - テストユーザーでの蓄積確認
- **Phase 3: リベンジ例文生成 & ダッシュボード弱点カルテ表示**
  - `/api/generate-sentence` への弱点注入
  - 弱点克服時のフラグ更新（リベンジ成功演出）
