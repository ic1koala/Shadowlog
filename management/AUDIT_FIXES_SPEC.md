# ShadowLog 定期点検修正 ＆ アクセスログSupabase永続化 実装指示書

**作成日**: 2026年9月28日  
**責任者**: プロジェクト統括担当 (Antigravity)  
**実装担当**: 実務担当サブエージェント  
**ステータス**: 指示・着手待ち  

---

## 1. 概要
オーナー様の承認に基づき、週次定期点検で発見された以下の3件の修正・実装を実施する。

1. **【文言修正】ベーシックプランの使い放題文言統一**:
   - `src/components/features/settings/PlanComparisonSection.tsx` の「1日上限 30回」を「短文シャドーイング無制限（使い放題）」へ修正。
2. **【導線追加】設定画面への管理者専用「顧客管理」導線設置**:
   - `src/app/(dashboard)/settings/page.tsx` において、管理者アカウント（`isAdminEmail(user.email)`）でログインしている場合、顧客管理画面（`/admin/customers`）へのアクセスリンクを表示。
3. **【DB永続化】アクセス解析ログ（Dailyログ）のSupabase永続化**:
   - `supabase/analytics_schema.sql` の作成。
   - `src/app/api/analytics/log/route.ts` を改修し、Supabase（`daily_analytics` テーブル）へPV/UU/訪問パスを永続化（インメモリへのフォールバック付き）。

---

## 2. 実装詳細

### ① 文言修正 (`src/components/features/settings/PlanComparisonSection.tsx`)
- 146行目付近：
  - 変更前: `<span><strong>1日上限 30回</strong>（月間最大900回）の短文練習</span>`
  - 変更後: `<span><strong>短文シャドーイング無制限</strong>（使い放題）</span>`

### ② 管理者用顧客管理導線 (`src/app/(dashboard)/settings/page.tsx`)
- `src/lib/auth/admin-checker.ts` の `isAdminEmail` を使用。
- ユーザーのログインセッションからメールアドレスを取得し、`isAdminEmail(email)` が真の場合に設定画面上部（タイトル下の目立つ位置）に「🛡️ 管理者専用: 顧客管理ダッシュボード ↗」ボタンを表示。
- クリックすると `/admin/customers` に遷移（または新規タブで開く）。

### ③ アクセスログのSupabase永続化
- **スキーマファイル作成**: `supabase/analytics_schema.sql`
  ```sql
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
  -- Service Role can do all, Public cannot read raw data directly
  CREATE POLICY "Allow service role full access to daily_analytics"
    ON public.daily_analytics FOR ALL USING (true);
  ```
- **API改修**: `src/app/api/analytics/log/route.ts`
  - `POST`:
    - JST日付 `YYYY-MM-DD` を取得。
    - Supabaseの `daily_analytics` テーブルにUPSERT（またはレコード取得➔加算更新）。
    - `visitors` 配列に `visitorKey` が含まれていなければ追加し `uu_count` をインクリメント。
    - `pv` を +1。
    - `paths[path]` を +1。
    - `user_types[userType]` を +1。
    - Supabase接続エラー時は既存のインメモリストア（`analyticsStore`）にフォールバック。
  - `GET`:
    - Supabaseの `daily_analytics` から過去14日分のレコードを取得。
    - `past14Days`, `pathRanking`, `userTypes`, `today`, `totalPv` を組み立てて返却。
    - Supabaseが空またはエラー時はインメモリ結果を返却。

---

## 3. テストと動作確認
- `npm test` を実行し、全テストが通過することを確認。
- `npx tsc --noEmit` で型チェックが通ることを確認。
