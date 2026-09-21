# ShadowLog (シャドーログ)

**ShadowLog** は、ユーザーの属性（業種・関心・目標レベル）に最適化された英語例文を自動生成し、ブラウザ上でシャドーイングを行い、Whisperで文字起こしした発話内容との差分（Diff）を可視化するWebサービスです。

## 主な機能
- **AI例文自動生成**: GPT-4o-miniによる業種（IT・金融・医療等）および難易度別の自然な例文＆日本語訳生成
- **模範音声再生**: OpenAI TTS-1によるクリアな模範発話（速度調整対応）
- **高精度音声文字起こし**: OpenAI Whisperによる発話認識
- **Diff差分可視化**: Needleman-Wunschアルゴリズムによる単語レベルの一致・脱落・余剰・誤読ハイライト表示
- **発話量＆ストリーク可視化**: 累計単語数カウントアップ、連続学習日数バッジ、12週間のアクティビティヒートマップ

## 技術スタック
- **Framework**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS, Lucide React
- **Backend / Database**: Next.js Route Handlers, Supabase
- **AI**: OpenAI API (GPT-4o-mini, Whisper, TTS-1)
- **Testing**: Vitest, React Testing Library

## 起動方法
```bash
# 依存パッケージインストール
npm install

# 開発サーバー起動
npm run dev

# 型チェック
npm run type-check

# テスト実行
npm test

# 本番ビルド
npm run build
```
