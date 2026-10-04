# 仕様書: 習慣化Webプッシュ通知リマインド機能（iPhone PWA / Android 対応 ＆ 練習済み自動スキップ）

**策定日**: 2026年10月4日  
**ステータス**: 仕様確定（オーナー様合意済み・メール通知なし／Webプッシュ特化）  
**担当**: プロジェクト統括担当 (`e4ece4cd-0a8e-4b24-8777-a23d9c79dcfc`) ➔ 実務・実装担当  
**関連チケット**: `FB-033`  

---

## 1. 背景と目的

- **オーナー様ご判断**:
  - メールによるリマインドは「やりたいけどやれない時に未読メールがどんどん溜まって嫌がられる（罪悪感・離脱につながる）」リスクがあるため**採用しない**。
  - スマホ画面にその時だけスマートに届き、溜まらない**「① Webプッシュ通知」のみ**に特化して実装する。
- **目的**:
  - **Android（Chrome等）**: ブラウザまたはホーム画面追加（PWA）からワンタップで通知許可し、指定時刻にリマインド通知を届ける。
  - **iPhone（iOS 16.4以降 Safari）**: 「共有 ➔ ホーム画面に追加」でPWA起動した状態でWebプッシュ通知を許可・受信できるようにする。まだホーム画面に追加していないiPhoneユーザーには、分かりやすい「📲 ホーム画面に追加（アプリ化）3ステップ案内」を表示する。
  - **ウザがられないスマート配信**: 「その日にすでに1回でもシャドーイング練習を終えている場合は通知を自動スキップ」し、未練習でストリーク（連続記録）が途切れそうな日だけ優しくリマインドする。

---

## 2. システム構成 & 実装ファイル一覧

### 新規作成ファイル
1. `public/sw.js`
   - Service Worker本体。
   - `push` イベントの受信と `self.registration.showNotification()` の実行。
   - `notificationclick` イベントで通知を閉じ、既存のShadowLogタブにフォーカスまたは `/` を開く。
   - クライアントからの `SHOW_TEST_NOTIFICATION` メッセージを受信して即座にテスト通知を表示するハンドラ。
2. `src/lib/notifications/push-manager.ts`
   - デバイス・環境判定ユーティリティ＆通知管理ロジック（純粋関数＋ブラウザAPIラッパー）。
   - `isIOSDevice(userAgent?: string, maxTouchPoints?: number): boolean`
   - `isStandaloneMode(): boolean` (`window.matchMedia('(display-mode: standalone)').matches` または `navigator.standalone === true`)
   - `getPushEnvironmentStatus(): "supported" | "ios_needs_pwa" | "unsupported"`
   - `ReminderSettings` 型と LocalStorage 読み書き (`shadowlog_reminder_settings`: `{ enabled: boolean, time: string, smartSkipIfPracticed: boolean, lastNotifiedDate?: string }`)
   - `hasPracticedToday(sessions: { date?: string }[]): boolean`（JST基準で本日練習済みか判定）
   - `registerServiceWorker()`、`requestPushPermission()`、`sendTestNotification()`、`subscribeToPushServer(settings)`
3. `src/components/features/settings/ReminderSettingsSection.tsx`
   - 設定画面（`/settings`）内に配置する「⏰ 毎日の学習リマインド通知（Webプッシュ）」セクションコンポーネント。
4. `src/app/api/push/subscribe/route.ts`
   - `POST`: サブスクリプション情報と希望通知時刻（`reminderTime`）を Supabase `push_subscriptions` テーブルへUPSERT保存（DB未作成・オフライン時はグレースフルに200 fallback）。
   - `DELETE`: 通知OFF時にサブスクリプションを無効化。
5. `src/app/api/push/cron/route.ts`
   - `GET` / `POST`: 定期実行（または管理者トリガー）用エンドポイント。対象時刻のユーザーを抽出し、本日の `practice_sessions` が0件のユーザーのみを通知対象として判定・Web Push送信。
6. `supabase/push_subscriptions_schema.sql`
   - `push_subscriptions` テーブル定義とRLSポリシー。
7. `tests/unit/push-manager.test.ts`
   - 環境判定（iOS Safari vs iOS PWA vs Android）、練習済みスキップ判定、設定保存・時刻フォーマット検証等のユニットテスト。

### 既存改修ファイル
1. `src/app/(dashboard)/settings/page.tsx`
   - 上部クイックナビ（`quickNavItems`）に `{ id: "section-reminder", label: "リマインド", icon: Bell }` を追加。
   - 学習設定セクションの直前（または直後）に `<div id="section-reminder"><ReminderSettingsSection /></div>` を組み込み。
2. `src/app/(dashboard)/layout.tsx`（またはクライアント初期化箇所）
   - リマインドが `enabled: true` の場合、Service Worker（`/sw.js`）の登録維持と、アプリ起動・バックグラウンド待機中の指定時刻ローカル通知チェック（本日未練習時のみ1日1回発火）を実行。

---

## 3. UI / UX 詳細要件 (`ReminderSettingsSection.tsx`)

### ① ヘッダー & スマートスキップ安心バッジ
- タイトル: `⏰ 毎日の学習リマインド（プッシュ通知）`
- サブテキスト: `決まった時間にスマホへ通知し、1日1文のシャドーイング習慣化をサポートします（メールは届きません）。`
- 安心設計バッジ:
  - `✨ スマート通知：その日に1回でも練習を終えている場合は、自動的に通知をスキップします。`

### ② 環境別の表示と操作フロー
1. **Android / PCブラウザ / iPhone PWA（ホーム画面から起動済み）の場合 (`status === "supported"`)**:
   - **ON/OFF トグルボタン**:
     - ONにすると `Notification.requestPermission()` を呼び出し、許可されたら Service Worker (`/sw.js`) を登録して設定を保存。
     - もしブラウザ設定で通知が「ブロック（`denied`）」されている場合は、「⚠️ 端末またはブラウザの設定で通知がオフになっています。設定から通知を許可してください」と親切なガイドを表示。
   - **通知時間の選択UI**:
     - ワンタップで選べるプリセットピルボタン:
       - `🌅 08:00 (朝活)`
       - `☀️ 12:30 (昼休み)`
       - `🌙 20:00 (帰宅後)`
       - `🔥 21:00 (一番人気)`
       - `🦉 22:30 (就寝前)`
     - 自由な時刻を指定できる `<input type="time">` も併設。
   - **「🔔 今すぐテスト通知を送ってみる」ボタン**:
     - 通知ONの状態でタップすると、Service Worker経由（またはNotification API）で即座にテスト通知（タイトル: `🔥 ShadowLog リマインドテスト`、本文: `通知設定はバッチリです！今日も1文だけ声に出してみましょう🎧`）を発火させ、自分のスマホにどう届くかその場で確認できる。

2. **iPhone / iPad の通常ブラウザ（Safari等）で開いている場合 (`status === "ios_needs_pwa"`)**:
   - iOSの仕様上、ホーム画面に追加する前でも「通知時刻の事前選択・保存」は可能にしつつ、目立つ案内カードを表示する：
     ```text
     ┌─────────────────────────────────────────────────────────────┐
     │ 🍎 iPhoneでプッシュ通知を受け取るための簡単3ステップ          │
     │ iPhoneの仕様により、ホーム画面に追加すると通知が届くようになります │
     │                                                             │
     │  Step 1: Safari画面下の「共有ボタン [↑]」をタップ            │
     │  Step 2: メニューから「ホーム画面に追加 [＋]」を選択         │
     │  Step 3: ホーム画面の「ShadowLog」アイコンから開いて通知をON │
     └─────────────────────────────────────────────────────────────┘
     ```
   - ※ AndroidやPCのユーザーでも、希望すれば「📲 スマホのホーム画面にアプリとして追加する方法」をアコーディオンで確認できるようにする。

---

## 4. 品質・テスト要件

1. `npm run type-check` (`npx tsc --noEmit`) で型エラー **0件**。
2. `npx vitest run` (`npm test`) で新規テスト（`tests/unit/push-manager.test.ts`）を含む全テストスイートが **100% PASS**。
3. `npm run build` でプロダクションビルドがエラーなく完了すること。
