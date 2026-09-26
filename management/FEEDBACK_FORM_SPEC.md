# ShadowLog 不具合報告・お問い合わせ機能 実装仕様書

**作成日**: 2026年9月26日  
**ステータス**: 実装準備完了 (Ready for Implementation)  
**担当**: 実務担当 (Conversation ID: `f203da78-5104-423c-92ad-efa86de6e77a`)  

---

## 1. 背景と目的
初期テスターや一般ユーザーからの不具合報告、音声・マイクのトラブル、機能改善要望を迅速に吸い上げ、プロダクト改善のPDCAを加速させるため、設定画面（`/settings`）最下部にお問い合わせ・不具合報告フォームを新設する。

---

## 2. アーキテクチャ概要

```mermaid
flowchart TD
    User["ユーザー（設定画面）"] --> Form["お問い合わせフォーム（/settings）"]
    Form -->|環境情報・スクショ添付| API["POST /api/feedback"]
    API -->|1. ログ永続化| DB[("Supabase DB (feedback_tickets)")]
    API -->|2. 管理者通知 (Reply-To: ユーザー)| AdminMail["shadowlog.app@gmail.com"]
    API -->|3. 自動返信確認メール| UserMail["ユーザーのメールアドレス"]
```

---

## 3. UI/UX仕様 (`src/app/(dashboard)/settings/page.tsx`)

### ① 配置場所
設定画面の一番下、「学習データ・記録の初期化」の下に新セクションとして配置。

### ② フォーム構成
1. **カテゴリクイック選択（ピル型ボタン）**:
   - `bug`: 🐛 不具合・エラー報告（デフォルト）
   - `audio_mic`: 🎙️ 音声・マイク関連
   - `feature_request`: 💡 改善要望・アイデア
   - `question`: ❓ 使い方・質問
   - `other`: 📝 その他
2. **送信者メールアドレス**:
   - ログイン中: アカウントのメールアドレス（`user.email`）を自動入力（編集可能）。
   - 未ログイン（ゲスト）: 手動入力必須（バリデーションあり）。
3. **内容詳細（Textarea）**:
   - プレースホルダー: 「発生した現象、操作した画面やタイミングをご記入ください（例: AirPods接続時に録音が途中で止まる、等）」
4. **スクリーンショット添付機能**:
   - ファイル選択ボタン（PNG, JPEG, WebP, 最大5MB）
   - 画像クリップボード貼り付け（`Cmd+V` / `Ctrl+V`）対応
   - 選択中画像のプレビュー表示 ＆ 削除（×）ボタン
5. **送信ボタン**:
   - 送信中はローディング表示（二重送信防止）
   - 送信成功時に完了モーダルまたはトースト表示（「送信完了いたしました。確認メールをお送りしました」）

---

## 4. 自動収集する環境情報 (Environment Info)

ユーザーの手間をゼロにするため、送信時にクライアント側で以下の情報を自動収集し、ペイロードの `environment_info` に付与する：
```json
{
  "userAgent": "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0...)",
  "language": "ja-JP",
  "screenSize": "393x852",
  "currentUrl": "https://shadowlog.app/practice",
  "selectedMic": "AirPods Pro (Bluetooth)",
  "userPlan": "base",
  "userId": "uuid-xxx",
  "isOnline": true
}
```

---

## 5. バックエンドAPI仕様 (`src/app/api/feedback/route.ts`)

- **メソッド**: `POST`
- **リクエストボディ**:
  - `category`: string
  - `email`: string
  - `content`: string
  - `screenshotBase64`: string (optional)
  - `environmentInfo`: object
  - `userId`: string (optional)

### 処理フロー:
1. **Supabase Storageへの画像保存（スクショがある場合）**:
   - バケット `feedback-attachments`（またはDBにBase64/URLとして保存）
2. **Supabase DBへの保存**:
   - `public.feedback_tickets` テーブルにレコード作成（status: `'unread'`）
3. **Resend APIによるメール送信**:
   - **管理者宛通知**:
     - `to`: `shadowlog.app@gmail.com`
     - `from`: `ShadowLog Support <onboarding@resend.dev>`
     - `replyTo`: 送信者のメールアドレス（※管理者がGmailで「返信」を押すだけでユーザーに届く）
     - `subject`: `【ShadowLog 報告】[${categoryLabel}] ${email} 様より`
     - 本文: お問い合わせ内容、環境情報、スクショリンク
   - **ユーザー宛自動返信**:
     - `to`: 送信者のメールアドレス
     - `from`: `ShadowLog Support <onboarding@resend.dev>`
     - `subject`: `【ShadowLog】お問い合わせを受け付けました`
     - 本文: 受付完了メッセージ、お問い合わせ内容のログ
     - ※ Resendの無料テストドメイン制限（認証ドメイン以外への送信制限）でエラーになる可能性があるため、ユーザー宛メールは `try...catch` で安全にラップし、管理者通知とDB保存が最優先で確実に成功するように実装すること。

---

## 6. 実装タスク一覧

1. [ ] `resend` パッケージのインストール (`npm i resend`)
2. [ ] `src/app/api/feedback/route.ts` の作成（Resend連携 ＆ Supabase DB保存）
3. [ ] `src/app/(dashboard)/settings/page.tsx` に不具合報告・問い合わせUIコンポーネントを実装
4. [ ] スクショ画像添付＆プレビュー、クリップボード貼り付け処理の実装
5. [ ] 環境情報の自動収集ユーティリティ実装
6. [ ] 単体テスト・ビルド確認 ＆ GitHubプッシュ ＆ Vercel自動デプロイ
