import { DifficultyLevel, Industry, DiffResult, CoachFeedback, WPMInfo } from "@/types";

export interface PromptTemplate {
  systemPrompt: string;
  userPrompt: string;
}

const INDUSTRY_SITUATIONS: Record<Industry, string[]> = {
  tech: [
    "Production outage post-mortem and root cause analysis",
    "API rate limiting, concurrency, and architecture discussion",
    "Code review feedback on pull request and refactoring suggestion",
    "Sprint planning, backlog grooming, and velocity estimation",
    "Adopting an open-source library vs building in-house tooling",
    "Container orchestration, Kubernetes deployment, and CI/CD pipelines",
    "Database schema migration, indexing, and query optimization",
    "Cybersecurity vulnerability patch and zero-trust policies",
    "Integrating LLMs and AI agent workflows into existing microservices",
    "Frontend performance optimization and Core Web Vitals tuning",
  ],
  business: [
    "Quarterly business review and KPI variance explanation",
    "Cross-functional alignment between sales, product, and legal",
    "Negotiating contract renewals, SLA terms, and enterprise pricing",
    "Pitching an innovative pilot program to executive stakeholders",
    "Resolving team bottlenecks and promoting psychological safety",
    "Navigating budget reallocation and fiscal resource constraints",
    "Vendor evaluation, RFP scoring, and risk mitigation strategies",
    "Managing customer escalation and turning churn risk into loyalty",
    "Onboarding remote distributed team members across time zones",
    "Post-merger organizational change management and culture integration",
  ],
  finance: [
    "Analyzing quarterly EBITDA margins and cash burn projections",
    "Portfolio rebalancing in response to central bank interest rate hikes",
    "M&A due diligence, valuation multiples, and synergy estimates",
    "Hedging currency risk against foreign exchange market volatility",
    "Auditing internal controls for compliance and risk reporting",
    "Assessing credit risk ratings for corporate debt issuance",
    "ESG investment criteria and sustainable fund performance disclosure",
    "Capital allocation strategy between dividends and R&D reinvestment",
  ],
  medical: [
    "Discussing Phase III clinical trial efficacy and adverse event rates",
    "Interpreting diagnostic imaging results and biomarker assays",
    "Explaining treatment options and potential side effects with compassion",
    "Implementing electronic health record (EHR) interoperability protocols",
    "Hospital infection control standards and antimicrobial stewardship",
    "Telemedicine triage workflows and remote patient monitoring devices",
    "Ethical considerations in genetic screening and personalized medicine",
  ],
  marketing: [
    "Optimizing customer acquisition cost (CAC) and lifetime value (LTV)",
    "A/B testing ad creative variants, copy headlines, and conversion funnels",
    "Formulating an omnichannel brand narrative for product launch",
    "Influencer collaboration contract and attribution modeling",
    "Addressing social media sentiment and public relations opportunities",
    "Search engine optimization (SEO) algorithm update recovery roadmap",
    "Webinar attendee engagement metrics and lead qualification scoring",
  ],
  daily: [
    "Ordering a customized specialty beverage and pastries at a local cafe",
    "Navigating an unexpected flight cancellation and rebooking at the airport gate",
    "Asking a neighborhood resident for hidden gem dining recommendations",
    "Discussing favorite podcast episodes and thought-provoking book takeaways",
    "Troubleshooting smart home lighting and wireless router connectivity",
    "Negotiating terms for an apartment lease renewal and maintenance request",
    "Planning a weekend hiking trip with weather contingencies and gear checklists",
    "Sharing creative cooking techniques and ingredient substitutions with friends",
  ],
};

export function getSentenceGenerationPrompt(
  industry: Industry,
  level: DifficultyLevel,
  topic?: string
): PromptTemplate {
  const levelGuidelines: Record<DifficultyLevel, string> = {
    beginner:
      "Target length: 6 to 10 words. Use simple subject-verb-object structures, clear basic vocabulary, and no difficult jargon. Suitable for A1-A2 CEFR level.",
    intermediate:
      "Target length: 12 to 18 words. Use compound sentences, business idioms or domain terminology, and natural phrasing. Suitable for B1-B2 CEFR level.",
    advanced:
      "Target length: 20 to 30 words. Use complex sentence structures (relative clauses, conditionals, participial constructions), sophisticated industry vocabulary, and natural rhythm suitable for professional presentations or executive meetings. Suitable for C1 CEFR level.",
  };

  const situations = INDUSTRY_SITUATIONS[industry] || INDUSTRY_SITUATIONS.tech;
  const randomSituation = situations[Math.floor(Math.random() * situations.length)];
  const randomSeed = Math.random().toString(36).substring(2, 8);

  const systemPrompt = `You are an expert English language coach specializing in shadowing practice.
Your task is to generate ONE fresh, authentic, contextually rich English sentence along with its natural Japanese translation.
NEVER generate generic, repetitive, or cliché template sentences.

Strict Output Format:
Return ONLY a valid JSON object with the following schema:
{
  "english": "The exact English sentence to practice.",
  "japanese": "自然な日本語訳。"
}
Do NOT include markdown fences, extra commentary, or additional fields.`;

  const userPrompt = `Generate a unique shadowing practice sentence with the following specifications:
- Industry/Domain: ${industry}
- Context/Situation: ${topic ? topic : randomSituation}
- Difficulty Level: ${level} (${levelGuidelines[level]})
- Variation Seed: ${randomSeed}

Requirements:
- Make the vocabulary, syntax, and sentence structure novel and distinct from typical textbook examples.
- Ensure natural conversational or business cadence and rhythm suitable for oral shadowing practice.`;

  return { systemPrompt, userPrompt };
}

/**
 * Generates prompt for full-paragraph presentation/speech passage (60-90 words).
 */
export function getPassageGenerationPrompt(
  industry: Industry,
  level: DifficultyLevel,
  topic?: string
): PromptTemplate {
  const situations = INDUSTRY_SITUATIONS[industry] || INDUSTRY_SITUATIONS.tech;
  const randomSituation = situations[Math.floor(Math.random() * situations.length)];
  const randomSeed = Math.random().toString(36).substring(2, 8);

  const systemPrompt = `You are an elite executive speechwriter and English speaking coach.
Your task is to generate ONE coherent, inspiring, and natural presentation/speech passage (paragraph of 3 to 5 sentences, 60 to 90 words total) along with its natural Japanese translation.
Avoid formulaic openings like "Good morning everyone". Dive right into substantive, engaging speech content.

Strict Output Format:
Return ONLY a valid JSON object with the following schema:
{
  "english": "The full continuous passage to shadow.",
  "japanese": "自然な日本語段落訳。"
}
Do NOT include markdown fences, extra commentary, or additional fields.`;

  const userPrompt = `Generate an engaging business presentation or conference speech passage with the following specifications:
- Industry/Domain: ${industry}
- Scenario/Topic: ${topic ? topic : randomSituation}
- Difficulty Level: ${level}
- Target Word Count: 60 to 90 words (3 to 5 clear, rhythmic sentences)
- Variation Seed: ${randomSeed}

Style Guidelines:
- Write in the style of an authentic keynote speech, engineering town hall, or executive briefing.
- Use natural transitional signposts and engaging rhetoric.
- Ensure rhythmic pauses and clear chunking for continuous shadowing.`;

  return { systemPrompt, userPrompt };
}

/**
 * Generates prompt for AI English speaking coach review based on transcription diff.
 */
export function getCoachReviewPrompt(
  originalText: string,
  spokenText: string,
  diff: DiffResult
): PromptTemplate {
  const missingWords = diff.tokens.filter((t) => t.status === "missing").map((t) => t.word);
  const mismatchWords = diff.tokens
    .filter((t) => t.status === "mismatch")
    .map((t) => `「${t.word}」(発音認識: 「${t.spokenWord}」)`);

  const systemPrompt = `あなたは受講者のシャドーイング技術と発音を劇的に向上させる、プロの英語発音・スピーキング専任コーチです。
受講者が練習した「模範英文」と「Whisper音声認識で聞き取られた発話内容」、および「単語差分解析（一致・脱落・誤読）」を分析し、
生徒のモチベーションを高めつつ、次回の発話で直ちに改善できる的確で実践的な指導レビューを日本語で作成してください。

【レビュー作成のガイドライン】
1. overallComment:
   - 全体講評（1〜2文）。スコアやリズム、最後まで発話できた姿勢を褒めつつ、プロの視点で総括してください。
2. pronunciationAdvice:
   - 音声変化・リンキング（音の繋がり）・リダクション（音の弱化・脱落）や発音に関する具体的指導（2〜3文）。
   - 特に脱落（missing）した単語や誤読（mismatch）がある場合、なぜそう聞こえやすいのか、どう口や舌を動かすと自然に発音できるかを的確に解説してください。
3. retryFocusPoint:
   - 「もう一度この文を復習・発話する際に、ここだけを意識してやってみよう！」という具体的で実行しやすいワンアクションのアドバイス（1文）。

【出力フォーマット】
以下のキーを持つ厳密なJSONオブジェクトのみを出力してください（Markdownのバッククォート等不要）:
{
  "overallComment": "全体講評（1〜2文）",
  "pronunciationAdvice": "発音・リンキング・リズムに関する的確な指導（2〜3文）",
  "retryFocusPoint": "次回復習時に意識すべきワンポイント（1文）"
}`;

  const userPrompt = `以下のシャドーイング結果をレビューしてください：
- 模範英文: "${originalText}"
- 認識された発話: "${spokenText || "（音声未認識）"}"
- 正解率スコア: ${diff.accuracyScore}% (${diff.matchedWordCount} / ${diff.originalWordCount} 単語一致)
- 脱落した単語 (Missing): ${missingWords.length > 0 ? missingWords.join(", ") : "なし"}
- ズレ・誤読の単語 (Mismatch): ${mismatchWords.length > 0 ? mismatchWords.join(", ") : "なし"}

英語学習者が「なるほど！もう一回練習してみよう」と前向きになれる、的確なコーチングをお願いします。`;

  return { systemPrompt, userPrompt };
}

/**
 * Generates prompt for full-paragraph long-form passage speech coaching.
 */
export function getPassageCoachReviewPrompt(
  originalText: string,
  spokenText: string,
  diff: DiffResult,
  wpmInfo?: WPMInfo
): PromptTemplate {
  const missingWords = diff.tokens.filter((t) => t.status === "missing").map((t) => t.word);
  const mismatchWords = diff.tokens
    .filter((t) => t.status === "mismatch")
    .map((t) => `「${t.word}」(認識: 「${t.spokenWord}」)`);

  const systemPrompt = `あなたは役員向けエグゼクティブ・スピーチコーチです。
受講者が挑戦した長文プレゼン・スピーチ（60〜90語）のシャドーイング結果を分析し、
単語ごとの発音だけでなく、長文ならではの「息継ぎ（チャンキング）」「話速（WPM）」「後半の持久力・スタミナ維持」について的確な指導レビューを作成してください。

【出力フォーマット（厳密なJSON）】
{
  "overallComment": "長文スピーチ全体の完成度に対するプロ講評（1〜2文）",
  "pronunciationAdvice": "脱落・ズレが起きた箇所やリンキングに関する発音指導（2〜3文）",
  "pacingAdvice": "話速（WPM）や息継ぎ（ポーズ）の取り方に関する実践的アドバイス（1〜2文）",
  "retryFocusPoint": "次回の通しリトライで最も意識すべきワンポイント（1文）"
}`;

  const userPrompt = `以下の長文通しシャドーイング結果をレビューしてください：
- 模範長文: "${originalText}"
- 認識された発話: "${spokenText || "（音声未認識）"}"
- 正解率スコア: ${diff.accuracyScore}% (${diff.matchedWordCount} / ${diff.originalWordCount} 単語)
- 話速: ${wpmInfo ? `${wpmInfo.wpm} WPM (${wpmInfo.label})` : "未測定"}
- 脱落した単語: ${missingWords.slice(0, 5).join(", ") || "なし"}
- ズレ・誤読: ${mismatchWords.slice(0, 3).join(", ") || "なし"}

受講者がプロフェッショナルなスピーチ力を身につけられるよう、建設的で熱意ある指導をお願いします。`;

  return { systemPrompt, userPrompt };
}

/**
 * High-quality fallback passages for offline/mock scenarios.
 */
export function getFallbackPassage(industry: Industry, level?: DifficultyLevel): { english: string; japanese: string } {
  void level;
  const passages: Record<Industry, { english: string; japanese: string }> = {
    tech: {
      english:
        "Good morning, everyone. Today, I am excited to introduce our new cloud architecture designed to scale seamlessly across global regions. By migrating our core databases to distributed microservices, we have achieved a ninety-nine point nine percent uptime. Looking ahead, our primary objective is to integrate real-time machine learning pipelines while keeping latency under fifty milliseconds.",
      japanese:
        "皆さん、おはようございます。本日は、世界各地域へシームレスに拡張可能な新しいクラウドアーキテクチャをご紹介します。コアデータベースを分散マイクロサービスへ移行したことで、99.9%の稼働率を達成しました。今後は、遅延を50ミリ秒未満に維持しつつ、リアルタイム機械学習パイプラインを統合することを主要目標としています。",
    },
    business: {
      english:
        "Thank you all for joining this quarterly strategic review. Over the past three months, our cross-functional teams have demonstrated exceptional collaboration, resulting in a fifteen percent increase in client retention. Furthermore, our expansion into emerging markets has created significant competitive advantages. As we move into the next quarter, maintaining financial discipline and customer trust remains our highest priority.",
      japanese:
        "四半期戦略レビューにご参加いただきありがとうございます。この3ヶ月間、部門横断チームが素晴らしい連携を見せ、顧客維持率は15%向上しました。さらに、新興市場への進出は大きな競争優位性を生み出しています。来四半期に向けて、財務規律と顧客の信頼維持を最優先課題として取り組んでまいります。",
    },
    medical: {
      english:
        "Welcome to today's clinical briefing. Our research team has completed the second phase of trials for our targeted therapy protocol. Preliminary findings indicate a substantial improvement in patient outcomes with minimal side effects. Moving forward, we will collaborate closely with regulatory authorities to accelerate the approval process and ensure the highest safety standards.",
      japanese:
        "本日の臨床ブリーフィングへようこそ。当研究チームは標的治療プロトコルの第2相試験を完了しました。予備的結果では、副作用を最小限に抑えつつ患者の治療成績が大幅に改善したことが示されています。今後は規制当局と緊密に連携し、最高水準の安全性を確保しながら承認手続きを進めてまいります。",
    },
    finance: {
      english:
        "Welcome to our annual investor presentation. Despite macroeconomic volatility, our diversified investment portfolio delivered resilient risk-adjusted returns this fiscal year. In addition, our automated risk mitigation framework successfully shielded our assets from market downturns. Moving forward, we remain committed to delivering sustainable value to all our stakeholders.",
      japanese:
        "年次投資家向けプレゼンテーションへようこそ。マクロ経済の変動にもかかわらず、分散投資ポートフォリオは強靭なリスク調整後リターンを達成しました。さらに、自動化されたリスク管理フレームワークが市場の下落から資産を保護しました。今後もすべてのステークホルダーへ持続的な価値を提供してまいります。",
    },
    marketing: {
      english:
        "Today, I want to share the results of our omnichannel brand campaign. By leveraging conversational storytelling across digital platforms, we saw customer engagement surge by forty percent. More importantly, organic referral rates doubled compared to the previous campaign. As we approach the holiday season, our focus will shift toward personalized customer experiences and loyalty programs.",
      japanese:
        "本日は、オムニチャネルブランドキャンペーンの成果を共有します。デジタルプラットフォームでのストーリーテリングを活用したことで、顧客エンゲージメントは40%急増しました。さらに、オーガニックな紹介率は前回の2倍に達しました。ホリデーシーズンに向けて、パーソナライズされた顧客体験とロイヤルティプログラムに注力します。",
    },
    daily: {
      english:
        "Hello, everyone, and thank you so much for coming today. It is truly wonderful to gather here and celebrate this special milestone together. Over the years, we have shared countless memorable experiences, supported each other through challenges, and created lasting friendships. I hope everyone enjoys the evening, delicious food, and great conversations with good company.",
      japanese:
        "皆さん、こんにちは。本日はお集まりいただき本当にありがとうございます。こうして皆で集まり、特別な節目を祝えることを嬉しく思います。これまで数々の忘れられない経験を共有し、困難な時も支え合い、末永い友情を育んできました。美味しい食事と素敵な会話を心ゆくまでお楽しみください。",
    },
  };

  return passages[industry] || passages.tech;
}

/**
 * Fallback coach feedback generator for offline, rate-limit, or testing scenarios.
 */
export function generateFallbackCoachFeedback(diff: DiffResult, wpmInfo?: WPMInfo): CoachFeedback {
  const score = diff.accuracyScore;
  const missing = diff.tokens.filter((t) => t.status === "missing").map((t) => t.word);
  const mismatch = diff.tokens.filter((t) => t.status === "mismatch");

  let pacingAdvice: string | undefined;
  if (wpmInfo) {
    if (wpmInfo.rating === "slow") {
      pacingAdvice = `話速は ${wpmInfo.wpm} WPM です。一語一語を丁寧に発音できていますが、次はもう少しテンポを上げて 120〜140 WPM の標準会話スピードを意識してみましょう。`;
    } else if (wpmInfo.rating === "natural" || wpmInfo.rating === "fluent") {
      pacingAdvice = `話速は ${wpmInfo.wpm} WPM で、理想的なスピーチスピード（${wpmInfo.label}）を維持できています！息継ぎのタイミングも安定しています。`;
    } else {
      pacingAdvice = `話速は ${wpmInfo.wpm} WPM と非常にハイテンポです。早口になりすぎて子音が潰れないよう、カンマや接続詞で一瞬のブレス（間）を置くことを意識しましょう。`;
    }
  }

  if (score >= 90) {
    return {
      overallComment: "素晴らしいリズムと明瞭さです！フレーズ音声のスピードとイントネーションを的確に捉えられています。",
      pronunciationAdvice:
        "単語一つひとつの発音だけでなく、文全体の流れるようなメロディがしっかり再現できています。さらに磨きをかけるため、文頭から文末まで息を止めず、ひと息で滑らかに言い切る感覚を意識してみましょう。",
      retryFocusPoint: "次は音声の感情やトーンまで真似して、より自然なネイティブの語りを再現してみましょう！",
      pacingAdvice,
    };
  }

  if (score >= 70) {
    let advice = "大半の重要語（名詞・動詞）がしっかり相手に届く発音で捉えられています。";
    if (missing.length > 0) {
      advice += ` 「${missing.slice(0, 2).join("」や「")}」などの小さな機能語（前置詞・代名詞等）は前後の単語と繋がって弱く短く発音されるため、強く言おうとせず音を滑らかに連結（リンキング）させる意識を持つとさらに良くなります。`;
    } else {
      advice += " 全体のリズムが良くできています。各単語のアクセント（一番強く長く発音する部分）を少し強調すると、一段と聞き取りやすい英語になります。";
    }
    return {
      overallComment: "とても惜しいところまで来ています！文の骨格をしっかり捉えて発声できています。",
      pronunciationAdvice: advice,
      retryFocusPoint:
        missing.length > 0
          ? `「${missing[0]}」の前後の音の繋がりを意識して、もう一度声に出してみましょう！`
          : "単語間の隙間をなくして、一続きの息で発音することを意識してリトライしてみましょう！",
      pacingAdvice,
    };
  }

  if (score >= 50) {
    let advice = "まずは声に出して英語のリズムに飛び込めた姿勢が素晴らしいです。";
    if (missing.length > 0) {
      advice += ` 今回聞き取られにくかった「${missing.slice(0, 3).join("」「")}」は、フレーズ音声をもう一度よく聴いて、単語の頭の子音を少しクリアに出すよう意識してみましょう。`;
    }
    if (mismatch.length > 0) {
      advice += ` 「${mismatch[0]!.word}」は母音の口の開き方を少し大きめにすると、より正確に認識されやすくなります。`;
    }
    return {
      overallComment: "ナイスチャレンジです！速さに焦らず、まずは音のまとまりを掴んでいきましょう。",
      pronunciationAdvice: advice,
      retryFocusPoint: "速度を0.6xに落としてフレーズ音声を聴き、音の繋がりを確認してからもう一度挑戦してみましょう！",
      pacingAdvice,
    };
  }

  return {
    overallComment: "まずは大きな声で発話に挑戦できたことが第一歩です！最初から完璧を目指す必要はありません。",
    pronunciationAdvice:
      "スピードが速く感じられた場合は、0.6xのゆっくり再生を活用してください。英文を見ながら音声を2〜3回聴き、単語の区切りではなく『意味のカタマリ（チャンク）』ごとに真似て発音すると、グッと認識率が上がります。",
    retryFocusPoint: "速度0.6xでフレーズ音声を聴き直し、口の形を意識しながらもう一度リトライしてみましょう！",
    pacingAdvice,
  };
}
