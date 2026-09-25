# ShadowLog 実務修正仕様書 (2026/09/25 修整要望対応)

**発行日**: 2026年9月25日  
**発行者**: プロジェクト統括担当 (Antigravity Management)  
**対象**: 実務担当エンジニア (`f203da78-5104-423c-92ad-efa86de6e77a`)  

---

## 1. 概要
オーナー様よりいただいたフィードバックに基づき、即座に対応可能な以下の5つの改修・バグ修正を実施する。

---

## 2. 実装タスク一覧

### タスク 1: シャドーイング実績の自動反映（オートセーブ）
- **対象**: `src/app/(dashboard)/practice/page.tsx`
- **問題**: 現在は手動で「学習記録を保存」ボタンを押さないと実績が反映されず、ユーザーが「ワード数が反映されない」と感じている。
- **改修要件**:
  - `handleAudioReady` 内で Whisper による文字起こし・Diff判定が完了した直後に、自動的に `recordPracticeSession` および `/api/stats` への記録保存を即時実行する。
  - `window.dispatchEvent(new Event("shadowlog:session-update"))` を発火させ、ダッシュボードやカルテへの反映を完全自動化する。
  - 手動保存ボタンは「保存済み」アイコン等の視覚フィードバックに変更。

### タスク 2: 特定商取引法表記の表示位置変更
- **対象**: `src/app/(dashboard)/layout.tsx`, `src/components/features/subscription/UpgradeModal.tsx`
- **要件**:
  - 全画面共通フッター（`layout.tsx`）のリンクから「特定商取引法に基づく表記」を**削除**する（個人住所保護のため）。
  - 課金アップセルモーダル（`UpgradeModal.tsx`）の決済ボタン下部に「[特定商取引法に基づく表記](/tokushoho)」リンクを配置・維持する（決済が行われる画面にのみ表示）。

### タスク 3: 検証モード（VIP）へのログイン簡易導線の設置
- **対象**: `src/app/(auth)/login/page.tsx`
- **要件**:
  - ログイン画面下部に「🧪 検証・テスター用クイックサインイン」ボタンを配置。
  - クリックするとワンクリックで `shadowlog.app@gmail.com` でログイン状態がセットされ、即座に「👑 VIP Tester (完全無制限)」モードとしてダッシュボードへ遷移できるようにする。

### タスク 4: プラン回数表記の更新（ベーシック30回 / Pro完全無制限）
- **対象**: `src/components/features/subscription/UpgradeModal.tsx`, `src/components/features/subscription/TicketBadge.tsx`, `src/app/api/stripe/checkout/route.ts`
- **要件**:
  - ベーシックプランの回数表記を「1日 20回」から **「1日 30回」** に更新。
  - Proプランは **「練習回数 完全無制限」** をより分かりやすくハイライト。

### タスク 5: API英文生成の多様性向上（重複防止）
- **対象**: `src/app/api/generate-sentence/route.ts`, `src/lib/ai/prompts.ts`
- **要件**:
  - `temperature` を 0.7〜0.85 に調整。
  - プロンプトに多様なシチュエーション（会議、雑談、交渉、トラブル対応、技術ディスカッション等）のランダムシードを注入し、毎回新鮮な構文と語彙が生成されるように改善。

---

## 3. 検証 & デプロイ
1. `npm test`（全テスト合格確認）。
2. `npm run build`（ビルド成功確認）。
3. Gitコミット ＆ GitHub（`origin main`）へのプッシュ（Vercel自動デプロイ）。
4. 完了後、統括担当へ報告。
