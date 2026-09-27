# ShadowLog 管理者専用 顧客リスト画面 実装指示書

**作成日**: 2026年9月27日  
**ステータス**: 完了 (Completed)  
**依頼元**: 顧客管理担当 (CRM / CS)  
**実装担当**: 実務担当サブエージェント  

---

## 1. 背景と目的
デモテストの実施に伴い、登録メンバー（テスター・顧客）のメールアドレスや練習進捗をアプリ内から一目で確認できる **「管理者専用 顧客リスト画面」** を新設する。
Supabaseコンソールにログインせずとも、登録者一覧・利用頻度・プラン状況を把握できるようにする。
※ 画面の最終的な配置（ナビゲーション上の位置）はオーナー様と後ほど相談するため、まずはURL `/admin/customers` にて実装し、管理者認証ガードを設ける。

---

## 2. 要件定義

### ① 画面パス
- **`/admin/customers`**
- 管理者のみアクセス可能（非管理者の場合は `/` または `/login` へリダイレクト）
- 管理者判定: メールアドレスが `shadowlog.app@gmail.com` であること

### ② APIエンドポイント
- **`GET /api/admin/customers`**
- 認証チェック:
  - リクエスト元のSupabaseセッション、またはVIPテスター判定（`shadowlog.app@gmail.com`）を確認。
- 取得データ（`profiles`, `auth.users`, `user_tickets`, `practice_sessions` を集約）:
  - ユーザーID (`id`)
  - メールアドレス (`email`)
  - プラン種別 (`plan`: free / base / pro)
  - 登録日時 (`created_at`)
  - 練習消化チケット数 (`tickets_used`)
  - Pro味見枠消化数 (`pro_trials_used`)
  - 累計練習セッション数 (`practice_count`)
  - 最終練習日時 (`last_practiced_at`)

### ③ UI設計
1. **サマリーKPIカード**:
   - 総登録者数（人）
   - 今週の新規登録者数（人）
   - 累計練習セッション数（回）
   - 有料プラン / Proテスター数
2. **顧客一覧テーブル**:
   - 検索バー（メールアドレスでのリアルタイム絞り込み）
   - プランフィルター（All / Free / Base / Pro）
   - カラム: メールアドレス、プランバッジ、登録日、練習回数、最新練習日、アクション
3. **エクスポート機能**:
   - 「CSVエクスポート」ボタン（顧客管理用・スプレッドシート連携用）
4. **デザイン**:
   - Tailwind CSS によるダーク/ライト対応、モバイルレスポンシブ

---

## 3. 実装対象ファイル

1. `src/app/api/admin/customers/route.ts` (新規作成)
2. `src/app/admin/customers/page.tsx` (新規作成)
3. `src/lib/auth/admin-checker.ts` (新規作成または既存ヘルパー拡張)
4. 必要に応じた単体テストの追加・更新
