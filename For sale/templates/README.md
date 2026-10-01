# SaaSプロジェクト推進 ドキュメント管理テンプレート集 (5点セット・第2版)

**最終更新**: 2026年10月1日  

本フォルダには、モダンSaaS開発・生成AI Webサービス立ち上げで実際に運用・実証されている**「ドキュメント管理の標準テンプレート（5点セット）」**が格納されています。

新規プロジェクトを始める際は、本フォルダ内の各テンプレートファイルをプロジェクトの `management/` または `docs/` 配下にコピーし、プロダクト名や仕様に合わせて穴埋めするだけで、**4ロール分業・勝手に直さないガバナンス・抜け漏れ防止4大プロトコル・2フェーズ原価管理・管理者限定プレビュー検証**まで網羅したプロレベルの推進体制が即座に立ち上がります。

---

## 📂 収録テンプレート一覧

| ファイル名 | 役割・活用シーン | 更新頻度 |
|:---|:---|:---|
| **`PROGRESS_MEMO.template.md`** | **全体進捗 ＆ 決定事項マスター**<br>現在のフェーズ、4ロール分業体制、2フェーズ原価決定ログ、直近アクションアイテムを一元把握。 | 決定事項発生ごと |
| **`FEEDBACK_LOG.template.md`** | **ユーザー・テスターの声（VoC）管理簿**<br>抜け漏れ防止4大プロトコルに基づき、要望・不具合・速度改善・価格感を即時起票して追跡。 | FB受領・相談ごと |
| **`weeklylog.template.md`** | **週次開発・運営クロニクル**<br>決定事項、実装内容、**直面したつまづき（課題）とどう改善したか**、採算・品質指標を時系列で蓄積。 | 毎週1回（月曜朝等） |
| **`SYSTEM_SPECIFICATION.template.md`** | **サービス・基本仕様設計書**<br>価格体系、利用制限、0.0秒先読み＆コンテンツバンク仕様、2フェーズAI原価、DB・管理画面仕様を網羅。 | 仕様変更時（即時） |
| **`FEATURE_SPEC.template.md`** | **機能単位の実装指示書**<br>背景、管理者テストモード（Feature Toggle）分離要件、ゼロ・レイアウトシフトUI要件、テスト方針を明記。 | 実装タスク着手ごと |

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
   cp "For sale/templates/FEATURE_SPEC.template.md" "management/FEATURE_SPEC.template.md"
   ```
3. ファイル内の `[プロダクト名]` や `[月額料金]` などのプレースホルダーを自身のプロダクトに合わせて書き換えて運用を開始します。
