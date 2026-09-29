# ShadowLog 練習履歴リアルタイム同期・消失防止 緊急改修仕様書

**作成日**: 2026年9月29日  
**ステータス**: 緊急対応中 (Critical Fix)  
**依頼元**: 顧客管理担当 (CRM / CS)  
**実装担当**: 実務担当サブエージェント  

---

## 1. 障害の事象と原因

### 【事象】
- `96430.yummy.717@gmail.com` 様がログイン後に何度も練習しているにもかかわらず、Supabaseの `practice_sessions` に反映されず 0 回のままになっている。
- `jabonbolivar@gmail.com` 様も、ログイン前に練習した4回分のみ同期され、ログイン後の練習が反映されていない。

### 【原因】
1. **オートセーブ処理でのSupabase同期欠落**:
   - `src/app/(dashboard)/practice/page.tsx` の採点完了時オートセーブ（324行目〜364行目）において、`recordPracticeSession`（ローカルストレージ保存）と `/api/stats` へのfetchのみが実行されており、**`savePracticeSessionToSupabase` が呼び出されていなかった**。
   - 手動の `handleSaveSession` にのみ同期コードが存在したが、UI上すでにオートセーブで保存済み扱いとなるため、ユーザーがボタンを押す導線が存在しなかった。
2. **既存データの未送信救出の欠落**:
   - `migrateGuestDataToSupabase` は初回ログイン時（`migrationKey === true`）に1度しか走らず、ログイン後にローカルストレージに溜まった練習データをクラウドへ差分同期する機能がなかった。
3. **`/api/stats` のテーブルスキーマ不整合**:
   - `/api/stats/route.ts` 内の `practice_sessions` へのINSERTが古いカラム名（`sentence`, `transcription`）のままでDBエラーとなっていた。

---

## 2. 改修要件

### ① `src/app/(dashboard)/practice/page.tsx`
- 採点完了時（Diff取得完了時）のオートセーブブロック内で、**`savePracticeSessionToSupabase(saved.session)` を即時実行**する。
- 弱点単語のマスター状況（`updateWeakWordMasteredInSupabase`）も同様にオートセーブで即時同期する。

### ② `src/lib/storage/sync-service.ts`
- **`syncLocalSessionsToSupabase()` の新設・強化**:
  - ローカルストレージ内の全練習セッションを取得。
  - Supabase上の既存セッション（`sentence_id` または `id`）と突合し、**Supabaseに未保存のセッションをすべて差分INSERT**する。
  - これにより、`96430.yummy.717@gmail.com` 様等の端末ローカルに残っている過去の練習履歴が、次回アプリを開いた瞬間に自動でクラウドへ吸い上げられ復元される。
- **`practice/page.tsx` の初期マウント時**、および **`review/page.tsx` の初期マウント時** に `syncLocalSessionsToSupabase()` を非同期実行する。

### ③ `src/app/api/stats/route.ts`
- `practice_sessions` へのINSERTペイロードのカラム名を、Supabase本番スキーマ（`sentence_id`, `text_en`, `text_jp`, `transcribed_text`, `accuracy_score`, `wpm`, `diff_result`, `coach_feedback`）に正しく整合させる。

---

## 3. 実装対象ファイル
1. `src/app/(dashboard)/practice/page.tsx`
2. `src/lib/storage/sync-service.ts`
3. `src/app/api/stats/route.ts`
4. 単体テストの追加・更新
