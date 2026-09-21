# Project Specification: ShadowLog (シャドーログ)

## 1. プロジェクト概要
**ShadowLog** は、ユーザーの属性（業種・関心・目標レベル）に最適化された英語例文を自動生成し、ブラウザ上でシャドーイングを行い、Whisperで文字起こしした発話内容との差分（Diff）を可視化するWebサービス。
発話した単語数を自動集計し、累計発話ワード数や連続学習日数（ストリーク）を可視化して学習の習慣化と達成感を促す。

- **ディレクトリ規約**: `src/` ベースの Next.js App Router 構成
- **フロントエンド**: Next.js (TypeScript), Tailwind CSS, shadcn/ui, Lucide React
- **バックエンド**: Next.js Server Components / Route Handlers, Vercel
- **DB / 認証**: Supabase (Auth & PostgreSQL / RLS適用)
- **AI基盤**: OpenAI API (GPT-4o-mini, Whisper, TTS-1)
- **テストフレームワーク**: Vitest, React Testing Library

---

## 2. 自己検証ループ (Autonomous Self-Correction Loop)

各フェーズの実装ごとに必ず以下の検証ループを自律的に完走させること。

1. **静的解析**:
   - `npm run type-check` (または `tsc --noEmit`) を実行し、TypeScriptの型エラーが0件であることを確認する。
   - `any` 型の使用は禁止。未定義プロパティやオプショナルチェーンの抜け漏れをなくす。
   - `npm run lint` を実行し、構文・リンターエラーをすべて解消する。
2. **自動テストの実行**:
   - `npx vitest run tests/` を実行し、関連する単体・結合テストが100%パスするまでコードのリファクタリングを自律的に繰り返す。
3. **エッジケース防御**:
   - 音声が空で送信された場合、マイク使用が拒否された場合、OpenAI APIのレートリミット到達時などに、画面がクラッシュせず適切なエラーメッセージやフォールバックUIが表示されることをコードレベルで担保する。

**【重要ルール】上記の検証（型チェック＋テスト）がすべてパスするまで、絶対に次のフェーズへ進まないこと。**

---

## 3. フェーズ別実装計画

- **Phase 1: コアロジック（Diff計算＆単語数集計）と単体テスト**
  - `src/lib/diff/diff-calculator.ts` の実装（小文字正規化、記号除去、レーベンシュタイン/Diffによる一致・脱落・誤読・余剰判定、正解単語数カウント）。
  - `tests/unit/diff-calculator.test.ts` を作成し、境界値（完全一致、全不一致、空文字列、長文）を網羅。テスト完全合格を確認。

- **Phase 2: OpenAI API連携（生成・音声・文字起こし）と統合テスト**
  - `src/app/api/generate-sentence/route.ts` (GPT-4o-miniでの例文生成 + OpenAI TTS-1での模範音声生成)。
  - `src/app/api/transcribe-diff/route.ts` (Whisperでの音声認識 + `diff-calculator` による差分解析)。
  - `tests/integration/api-routes.test.ts` によるレスポンス検証。

- **Phase 3: フロントエンド実装（シャドーイング画面・録音UI）**
  - `src/hooks/use-audio-recorder.ts` (ブラウザのMediaRecorder制御と状態管理)。
  - `src/components/features/practice/AudioRecorder.tsx` (録音・停止・波形表示・マイク権限エラー通知)。
  - `src/components/features/practice/DiffViewer.tsx` (緑:一致、赤:脱落、黄:余剰のハイライト表示)。
  - `src/app/(dashboard)/practice/page.tsx` の画面統合。

- **Phase 4: ダッシュボード・Supabaseデータ連携・ビルド検証**
  - `src/app/api/stats/route.ts` (練習ログ保存、累計発話ワード数のインクリメント、ストリーク判定)。
  - `src/components/features/dashboard/WordStatsCard.tsx` (累計発話単語数のカウントアップ表示)。
  - `src/app/(dashboard)/page.tsx` (ダッシュボード画面)。
  - プロジェクト全体のビルド（`npm run build`）を実行し、本番デプロイ可能な状態であることを確認。
