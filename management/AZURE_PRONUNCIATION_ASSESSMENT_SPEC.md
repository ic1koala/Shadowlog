# 仕様書: 管理者テストモード「Azure AI Speech 発音評価エンジン」＆「音響環境メンション」PoC実装

**策定日**: 2026年10月11日  
**ステータス**: 仕様確定（オーナー様合意・API疎通実証済み）  
**担当**: 技術相談担当 ➔ 実装担当（引き継ぎ用）  
**共有先**: プロジェクト統括担当 (`e4ece4cd-0a8e-4b24-8777-a23d9c79dcfc`)

---

## 1. 目的と背景

- **課題**: 従来のWhisper＋Diff方式では、AIの強力すぎる文脈自動補正により「適当な発音でも100点になる」「言い間違えてもOK判定される」という重大なユーザー不満・判定精度の限界が発生していた。
- **解決策**:
  - 音素（Phoneme）レベルで音響波形をネイティブモデルと直接照合する **「Azure AI Speech 発音評価API（Pronunciation Assessment）」** を導入。
  - 一般ユーザーへの影響を避けるため、まずは**管理者テストモード（`isAdminEmail(userEmail)`）限定**で導入・検証する。
  - さらに、Azureの `SNR`（S/N比: 信号対雑音比）およびブラウザ側の入力音量を活用し、ノイズ過多やマイクが遠い場合に具体的な改善を促す**「環境スマートメンション」**を実装する。

---

## 2. システム要件 & API設計

### 2.1 環境変数
`.env.local` に設定済み（疎通検証済み）：
- `AZURE_SPEECH_KEY`: 認証キー（32桁）
- `AZURE_SPEECH_REGION`: `japaneast`

### 2.2 バックエンド新設ルート: `/api/transcribe-diff/azure`
（または既存 `/api/transcribe-diff` 内の `engine: "whisper" | "azure"` 分岐）
- **入力**:
  - `audio`: 音声ファイル（Blob / FormData）
  - `originalText`: 模範英文（ReferenceText）
- **処理**:
  1. Azure Speech Pronunciation Assessment REST API へリクエスト送信。
     - エンドポイント: `https://${region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US`
     - ヘッダー: `Pronunciation-Assessment: base64(JSON parameters)`
       ```json
       {
         "ReferenceText": originalText,
         "GradingSystem": "HundredMark",
         "Granularity": "Phoneme",
         "Dimension": "Comprehensive",
         "EnableProsodyAssessment": "True"
       }
       ```
  2. レスポンス（`json.NBest[0]`）の解析:
     - 4軸スコア: `AccuracyScore`（正確度）, `FluencyScore`（流暢さ）, `CompletenessScore`（完全性）, `ProsodyScore`（抑揚・リズム）, `PronScore`（総合スコア）
     - 単語別判定: `Words` 配列（各単語の `AccuracyScore`, `ErrorType`: `None` | `Mispronunciation` | `Omission` | `Insertion`）
     - 環境分析: `SNR`（S/N比, dB）, `RecognitionStatus`（`Success` | `BabbleTimeout` | `InitialSilenceTimeout` | `NoMatch`）
- **出力**:
  ```typescript
  export interface AzureAssessmentResult {
    overallScore: number;       // PronScore (0-100)
    accuracyScore: number;      // 正確度 (0-100)
    fluencyScore: number;       // 流暢さ (0-100)
    completenessScore: number;  // 完全性 (0-100)
    prosodyScore: number;       // 抑揚・リズム (0-100)
    words: Array<{
      word: string;
      accuracyScore: number;
      errorType: "None" | "Mispronunciation" | "Omission" | "Insertion";
      phonemes?: Array<{ phoneme: string; accuracyScore: number }>;
    }>;
    environmentMention?: {
      type: "warning" | "info";
      message: string;
    };
  }
  ```

---

## 3. 環境スマートメンション仕様

以下の条件に応じて、採点結果画面にアドバイスバッジ・トーストを自動付与する：

| 判定条件 | 状態 | ユーザーへのメッセージ |
| :--- | :--- | :--- |
| **Azure `RecognitionStatus === "InitialSilenceTimeout"`** | 無音・マイク不調 | 📢 **「音声が検出されませんでした」**<br/>マイクの許可設定をご確認の上、もう一度お話しください。 |
| **Azure `RecognitionStatus === "BabbleTimeout"`** | カフェ・周囲の人の会話 | 📢 **「周囲の話し声が多く検出されました」**<br/>正確な判定のため、静かな環境で録音してください。 |
| **Azure `SNR < 15.0 dB`** | 背景雑音・エアコン・環境ノイズ | 📢 **「周辺の雑音・ノイズが多いようです」**<br/>静かな部屋に移動するか、イヤホンマイクをご使用ください。 |
| **平均マイク入力音量 < 5%** | 声が小さい・マイクが遠い | 📢 **「マイクの声が少し遠いようです」**<br/>マイクに口元を近づけるか、もう少し大きめの声でお話しください。 |

---

## 4. UIデザイン要件（管理者テストモード）

### 4.1 管理者限定の切り替えトグル
- `isAdminEmail(userEmail)` が `true` の場合:
  - 練習画面（`/practice`）のヘッダーまたは操作バー付近に `[🧪 採点エンジン: Whisper ｜ Azure]` の切り替えトグルを配置（デフォルト: Azure）。
- 一般ユーザーの場合:
  - 従来のWhisperエンジン（安定稼働中）を100%維持。

### 4.2 採点結果カード（Azureモード時）
1. **スコアヘッダー**:
   - 総合発音スコア（例: **78点**）を大きく表示。
   - 4軸バッジ（`正確度 82点` / `流暢さ 75点` / `完全性 90点` / `抑揚 70点`）を視覚的に整理。
2. **環境メンションバッジ**:
   - ノイズや音量注意がある場合、カード最上部にアンバー色のアラートバッジを表示。
3. **単語ハイライト**:
   - `ErrorType: "None"` ➔ 緑色（正解）
   - `ErrorType: "Mispronunciation"` ➔ 橙色（発音不良・スコア低）
   - `ErrorType: "Omission"` ➔ 赤色（脱落・読み飛ばし）

---

## 5. 検証・品質要件

1. `AZURE_SPEECH_KEY` / `AZURE_SPEECH_REGION` によるAPI呼び出しが正常に動作すること。
2. 管理者のみ新エンジンを利用でき、一般ユーザーの画面や挙動を壊さないこと。
3. カタカナ発音や間違えた英文を喋った際に、適切な低スコア（Mispronunciation）が反映されること。
4. `npm run type-check`, `npx vitest run`, `npm run build` がすべて合格すること。
