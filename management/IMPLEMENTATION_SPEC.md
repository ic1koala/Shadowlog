# ShadowLog 実装指示仕様書 (for Implementation Engineer)

**発行日**: 2026年9月24日  
**発行者**: プロジェクト統括担当 (Antigravity Management)  
**対象**: 実装担当エンジニア  

---

## 1. 目的 & ゴール
ShadowLogの収益化・Stage 1に向けて、以下の3つのコア機能を実装する。
1. **VIPホワイトリスト（特定メアド無制限）判定**
2. **3段階チケット管理（ゲスト5回 + 登録後15回 + Pro味見2回）**
3. **UI連携（ヘッダーバッジ・残り回数警告・アップセルモーダル）**
4. **Stripe Checkout API（月額500円 / 1,480円）疎通**

---

## 2. 詳細仕様

### 仕様 2.1: VIPホワイトリスト判定
- **環境変数**: `VIP_TESTER_EMAILS=shadowlog.app@gmail.com,...`
- ログインユーザーのメールアドレスが環境変数のリスト（小文字比較、カンマ区切り）に含まれる場合：
  - `isVip = true`
  - プラン判定: 自動的に `pro`（無制限）
  - チケット残数: `Infinity`（消費なし）

### 仕様 2.2: 3段階チケット管理
- **Layer 1 (ゲスト・未登録)**:
  - 短文モードのみ利用可能
  - 無料チケット: **累計 5 回**（LocalStorage: `shadowlog_guest_tickets_used`）
  - 5回消費後: 練習停止 ➔ 「無料登録でさらに15回プレゼント！」モーダル表示
- **Layer 2 (無料会員登録済・メアド登録)**:
  - 登録完了で **追加 15 回**（累計 20 回利用可能）
  - クラウド（Supabase）またはLocalStorageで管理
  - ★ **Pro味見枠**: Pro限定機能（長文スピーチ・業界別生成）を **2回まで無料体験** 可能（`shadowlog_pro_trial_used`）
- **Layer 3 (有料プラン / VIP)**:
  - `pro`: 完全無制限（チケット消費なし）
  - `basic`: 月額500円（1日20回）

### 仕様 2.3: UIコンポーネント連携
- **ヘッダー (`src/components/layout` またはダッシュボード)**:
  - ゲスト時: `残り 5/5 チケット (無料登録で+15回)`
  - 無料登録時: `残り 15/15 チケット` ＋ `👑 Pro体験: 残り 2/2 回`
  - VIP / Pro時: `👑 Pro (無制限)` バッジ
- **採点完了フック (`use-audio-recorder` または `practice/page.tsx`)**:
  - 音声認識完了時に `consumeTicket()` を呼び出し、残数を減らす。
  - 残り0になった場合、練習ボタンを無効化しアップセルモーダルを表示。

---

## 3. 実装・検証チェックリスト
- [ ] `src/lib/auth/vip-checker.ts`: VIPメール判定ユーティリティ
- [ ] `src/lib/storage/ticket-store.ts`: チケット残数取得・消費・プラン判定ロジック
- [ ] `src/components/features/subscription/TicketBadge.tsx`: ヘッダー用チケット表示
- [ ] `src/components/features/subscription/UpgradeModal.tsx`: チケット枯渇時・Pro案内モーダル
- [ ] `src/app/api/stripe/checkout/route.ts`: Stripe Checkout Session生成API
- [ ] `tests/unit/ticket-store.test.ts`: チケット消費・境界値・VIP判定のテスト（100%パス）
