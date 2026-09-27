# ShadowLog お問い合わせ・メール送信 不具合修正仕様書

**作成日**: 2026年9月27日  
**担当**: 実務担当 (Conversation ID: `f203da78-5104-423c-92ad-efa86de6e77a`)  
**ステータス**: 修正指示 (Fix Request)  

---

## 1. 発生している現象と原因分析

オーナー様が本番環境（Vercel）の設定画面最下部からテスト送信を実施したところ、
**管理者宛（`shadowlog.app@gmail.com`）および送信元（ユーザー）のどちらにもメールが届かない** 状態が発生した。

### 原因1: Vercel環境変数の未反映
本番環境（Vercel）の環境変数に `RESEND_API_KEY` および `ADMIN_NOTIFICATION_EMAIL` が未設定の場合、`getResendClient()` が `null` となり、メール送信処理が完全にスキップされる。

### 原因2: `route.ts` 内でのSupabase環境変数の二重プレフィックス未対応
`getSupabaseAdmin()` において、Vercelのインテグレーション変数（`NEXT_PUBLIC_SUPABASE_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_SUPABASE_SERVICE_ROLE_KEY` / `NEXT_PUBLIC_NEXT_PUBLIC_SUPABASE_SUPABASE_ANON_KEY`）が考慮されておらず、`placeholder-project.supabase.co` にフォールバックしていたため、Supabase DBへのチケット保存も失敗していた。

### 原因3: Resendテストドメイン（`onboarding@resend.dev`）の送信先制限
Resendの無料枠・未認証ドメインでは、**アカウント登録メアド（`shadowlog.app@gmail.com`）宛にしかメール送信が許可されない**（登録外のメアドへの送信は 403 Forbidden となる）。
そのため、送信元（ユーザー）宛の自動返信メールは、独自ドメインをResendに認証させるまでResend側で弾かれる。

---

## 2. 実務担当への改修指示内容

### ① `src/app/api/feedback/route.ts` の改修
1. **Supabaseクライアントの環境変数フォールバックの完全化**:
   ```ts
   function getSupabaseAdmin() {
     const supabaseUrl =
       process.env.NEXT_PUBLIC_SUPABASE_URL ||
       process.env.NEXT_PUBLIC_SUPABASE_SUPABASE_URL ||
       process.env.SUPABASE_URL ||
       "https://placeholder-project.supabase.co";
     const supabaseServiceKey =
       process.env.SUPABASE_SERVICE_ROLE_KEY ||
       process.env.NEXT_PUBLIC_SUPABASE_SUPABASE_SERVICE_ROLE_KEY ||
       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
       process.env.NEXT_PUBLIC_NEXT_PUBLIC_SUPABASE_SUPABASE_ANON_KEY ||
       "placeholder-key";
     return createClient(supabaseUrl, supabaseServiceKey);
   }
   ```
2. **Resend APIキーチェックとログ強化**:
   - `apiKey` が存在しない場合、コンソールに `console.error("RESEND_API_KEY is not configured in environment variables.")` を出力。
   - `resend.emails.send` のレスポンス（`data`, `error`）をログ出力し、管理者宛とユーザー宛のエラー内容（403など）を明確にキャッチする。
3. **Resendテストドメイン時のユーザー自動返信の安全化**:
   - ユーザー宛自動返信について、送信先が `ADMIN_EMAIL` と同一でない場合、Resendの `onboarding@resend.dev` では拒否されるため、エラーを握りつぶさずにログ記録しつつ管理者宛送信（こちらは届く）を確実に貫徹させる。
4. **APIレスポンスの拡充**:
   - レスポンスJSONに `dbSaved: boolean`, `adminEmailSent: boolean`, `userEmailSent: boolean`, `adminError?: string`, `userError?: string` を含め、デバッグを容易にする。

### ② 単体テスト・ビルド検証
- `npm run test`（全テストパス）
- `npm run build`（ビルドパス）

### ③ GitHubプッシュ ＆ デプロイ
- コミットして `origin main` へプッシュ。
