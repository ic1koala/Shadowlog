# 仕様書: AIプロンプト自然化・日常会話ペルソナ分離・バズワード排除 (FB-038)

**策定日**: 2026年10月6日  
**ステータス**: ✅ **実装完了・テスト合格（FB-038）**  
**関連チケット**: `FB-038`  
**対象ファイル**: `src/lib/ai/prompts.ts`, `tests/unit/passage-prompts.test.ts`  

---

## 1. 課題と背景

出題履歴 #58 において、以下の不自然な文章が生成された：
> *"As we embrace the vibrant colors of autumn, let’s take a moment to reflect on our journey toward work-life harmony. This season invites us not only to strategize for the upcoming year but also to nurture our well-being through meaningful connections. Imagine discovering a hidden gem dining spot right in our neighborhood..."*

### 主な原因:
1. `daily`（日常会話）の話題（レストラン推薦）にもかかわらず、長文プロンプトが一律「エグゼクティブ・スピーチ（基調講演）」トーンになっていた。
2. 季節テーマ（秋・来期の戦略立案）＋トレンド（ワークライフハーモニー）＋シチュエーション（近所のレストラン）の3つが無理やり合体（キメラ化）した。
3. `INDUSTRY_TRENDS.daily` に「Work-life harmony, digital wellness」等のLinkedIn風バズワードが含まれていた。
4. 季節感の反映が強要され、英語ネイティブでも普段言わないポエム調（"As we embrace the vibrant colors of autumn..."）が生成された。

---

## 2. オーナー様ご指定の方針

1. **普段使わない言葉（ワークライフハーモニー等）など、変な文章が作成されない対策を講じる。**
2. **季節の特色は出して欲しいが、無理やり紐付ける必要はなく、話題に合わなければ省略可能とする。**
3. **日常で実際に使いそうな自然な文章（Plain / Conversational English）を心がける。**

---

## 3. 実装詳細仕様 (`src/lib/ai/prompts.ts`)

### ① `INDUSTRY_TRENDS.daily` の見直し
抽象的なバズワードを排除し、日常のリアルなトピックに変更：
```ts
daily: [
  "Finding great local cafes, cozy lunch spots, and seasonal dining",
  "Casual conversation with colleagues about weekend plans and hobbies",
  "Smart home convenience, useful lifestyle apps, and simple daily routines",
  "Outdoor weekend walks, day trips, and exploring neighborhood spots",
  "Cooking simple meals at home and sharing easy recipe ideas",
],
```

### ② `getPassageGenerationPrompt` のペルソナ分岐（Daily vs Business/Tech）
`daily` ジャンルの場合は、エグゼクティブ・スピーチライターではなく、親しい同僚・友人との自然な長めの会話・語りかけスタイルに切り替える：
- **Daily**:
  - `systemPrompt`:
    "You are a native English speaker sharing a natural, engaging, and authentic story or recommendation with a friend or colleague."
  - "Avoid dramatic speeches, executive posturing, or corporate clichés. Keep the tone warm, conversational, and grounded in real life."
- **Tech / Business / Marketing**:
  - 従来の実務的・プロフェッショナルなプレゼン・スピーチトーンを維持。

### ③ 季節感（Seasonal Timing）のオプショナル化 ＆ ポエム調の禁止
System Prompt / User Prompt に以下のルールを明確に追加：
```text
Seasonal Context Rules:
- Incorporate seasonal timing ONLY if it fits the topic naturally.
- Keep seasonal references subtle, brief, and realistic (e.g., "Now that it's getting chilly outside...", "Before the holidays kick in...").
- NEVER use flowery, poetic, or dramatic clichés (e.g., NEVER write "As we embrace the vibrant colors of autumn...").
- If the seasonal theme does not fit the scenario naturally, completely omit it.
```

### ④ 抽象的バズワードの禁止 ＆ 口頭セルフチェック（Sanity Check）
System Prompt に以下のルールを追加：
```text
Authentic Spoken Phrasing & Plain English:
- Do NOT use unnatural corporate buzzwords, esoteric jargon, or philosophical metaphors in everyday topics (e.g., strictly avoid buzzwords like "work-life harmony", "digital wellness", "paradigm shift" in casual contexts).
- Sanity Check: Ensure every sentence is authentic English that a real native speaker would actually say in real conversation or practical presentations.
```

### ⑤ 単文プロンプト（`getSentenceGenerationPrompt`）への同様の適用
短文生成プロンプト（初級・中級・上級・マイ単語生成）においても、季節感のオプショナル化とポエム調・バズワード禁止ルールを共通適用する。

---

## 4. 検証基準
- `npm run type-check`: エラー 0件
- `npx next lint`: エラー 0件
- `npx vitest run`: 全テスト合格
