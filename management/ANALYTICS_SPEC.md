# アクセス解析・Dailyログ機能 実装指示書 (for 統括ダッシュボード)

**発行日**: 2026年9月25日  
**発行者**: プロジェクト統括担当 (Antigravity Management)  
**対象**: 実務担当エンジニア (`f203da78-5104-423c-92ad-efa86de6e77a`)  

---

## 1. 目的 & ゴール
一般ユーザーには一切見えない形でアプリ全体のアクセスログを静かに収集し、**統括ダッシュボード（`management/checklist.html` / `public/management.html`）内でのみ** 日次（Daily）PV数、ユニーク訪問者数、URL別アクセスランキングをウォッチできるようにする。

---

## 2. 実装タスク詳細

### タスク 1: 軽量アクセスロガーAPIの実装
- **エンドポイント**: `src/app/api/analytics/log/route.ts`
  - `POST`: クライアントから送信された `{ path, referrer, userType }` を記録。
    - 日付別（YYYY-MM-DD）、URLパス別、ユーザー種別（guest / free / pro / vip）ごとに集計カウントをインクリメント。
    - サーバー側ストレージ（ファイルベース or Supabase `page_views` or メモリ/永続ストア）に日別集計として保存。
  - `GET`: 直近30日間の日別集計データ、およびURL別集計データを返却。

### タスク 2: クライアント側サイレントトラッカーの設置
- **コンポーネント**: `src/components/analytics/PageTracker.tsx`
  - Next.js の `usePathname()` を監視し、ページ遷移時に `navigator.sendBeacon` または `fetch`（非同期・ノンブロッキング）で `/api/analytics/log` へ送信。
  - 一般ユーザーの画面には何も表示しない（完全な裏方コンポーネント）。
  - `src/app/layout.tsx` に組み込む。

### タスク 3: 統括ダッシュボード（`management/checklist.html`）への解析UI統合
- `management/checklist.html` および `public/management.html` に **「📊 Dailyアクセス解析ログ」** セクションを追加。
  - **本日のアクセス数 (PV / UU)**
  - **直近14日間の日次アクセス推移バーチャート**
  - **URL別アクセス数ランキング**（例: `/practice`, `/`, `/review`, `/terms` など）
  - **ユーザー内訳**（ゲスト vs 登録会員）
- ページ読み込み時に `/api/analytics/log` から最新の集計データを取得してグラフ・数値を自動更新。

---

## 3. セキュリティ要件
- 一般ユーザー向けのメニュー（ナビバー、フッター、設定画面等）にはアナリティクスのリンクや表示を一切出さないこと。
- 統括ダッシュボード（`management.html`）でのみ集計を表示すること。

---

## 4. 品質検証 & デプロイ
1. `npm run build` がエラーなく完了すること。
2. Gitコミット（`feat: implement silent analytics logger and daily access metrics in management dashboard`）。
3. GitHub（`origin main`）へのプッシュおよびVercel自動デプロイ。
4. 完了後、統括担当へ報告。
