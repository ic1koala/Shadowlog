# SaaSプロジェクト推進 ドキュメント管理テンプレート集 (5点セット)

本フォルダには、モダンSaaS開発・Webサービス立ち上げで実際に運用されている**「ドキュメント管理の標準テンプレート（5点セット）」**が格納されています。

新規プロジェクトを始める際は、本フォルダ内の各テンプレートファイルをプロジェクトの `management/` または `docs/` 配下にコピーし、プロダクト名や仕様に合わせて穴埋めするだけで、プロレベルのやること管理・意思決定ガバナンスが即座に立ち上がります。

---

## 📂 収録テンプレート一覧

| ファイル名 | 役割・活用シーン | 更新頻度 |
|:---|:---|:---|
| **`PROGRESS_MEMO.template.md`** | **全体進捗 ＆ 決定事項マスター**<br>プロジェクトの現在のフェーズ、確定した重要方針、直近のアクションアイテムを一元把握。 | 決定事項発生ごと |
| **`FEEDBACK_LOG.template.md`** | **ユーザー・テスターの声（VoC）管理簿**<br>初期テスターやユーザーからの要望・不具合・価格感をログ化し、優先度と対応状況を追跡。 | FB受領ごと |
| **`weeklylog.template.md`** | **週次定点振り返りログ**<br>過去1週間の決定、実装、課題と解決策、コスト指標を定期的に定点記録しノウハウを蓄積。 | 毎週1回（月曜朝等） |
| **`SYSTEM_SPECIFICATION.template.md`** | **サービス・基本仕様設計書**<br>サービスの価格体系、利用制限、AI/API原価、DB設計、運用ルールを網羅するマスター仕様書。 | 仕様変更時（即時） |
| **`FEATURE_SPEC.template.md`** | **機能単位の実装指示書**<br>新機能や修正タスクの背景、画面/API要件、テスト方針をエンジニア・AIへ明確に指示。 | 実装タスク着手ごと |

---

## 🚀 導入ステップ（新規プロジェクトでの使い方）

1. 新しいプロジェクトのルート直下に `management/` ディレクトリを作成します：
   ```bash
   mkdir -p management
   ```
2. 本テンプレート集から必要なファイルをコピーし、末尾の `.template.md` を `.md` にリネームします：
   ```bash
   cp "For sale/templates/PROGRESS_MEMO.template.md" "management/PROGRESS_MEMO.md"
   cp "For sale/templates/FEEDBACK_LOG.template.md" "management/FEEDBACK_LOG.md"
   cp "For sale/templates/weeklylog.template.md" "management/weeklylog.md"
   cp "For sale/templates/SYSTEM_SPECIFICATION.template.md" "management/SYSTEM_SPECIFICATION.md"
   ```
3. ファイル内の `[プロジェクト名]` や `[月額料金]` などのプレースホルダーを自身のプロダクトに合わせて書き換えて運用を開始します。
