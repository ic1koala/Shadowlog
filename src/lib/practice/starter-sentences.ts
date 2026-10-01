import {
  DifficultyLevel,
  Industry,
  PracticeMode,
  SentenceResponse,
  normalizeIndustry,
} from "@/types";
import { loadAllSessions } from "@/lib/storage/user-learning-store";
import { countWords } from "@/lib/diff/diff-calculator";
import { getFallbackPassage } from "@/lib/ai/prompts";

export interface StarterSentenceItem {
  id: string;
  english: string;
  japanese: string;
  industry: Industry;
  level: DifficultyLevel;
  mode: PracticeMode;
}

/**
 * Curated high-quality pre-generated sentences for immediate untried initial practice.
 * Covers all 4 active industries (tech, business, marketing, daily) across 3 levels.
 */
export const STARTER_SENTENCES: StarterSentenceItem[] = [
  // ── Tech ──
  {
    id: "starter-tech-beg-1",
    english: "Please push your latest code changes to the remote repository.",
    japanese: "リモートリポジトリに最新のコード変更をプッシュしてください。",
    industry: "tech",
    level: "beginner",
    mode: "sentence",
  },
  {
    id: "starter-tech-beg-2",
    english: "We need to update the application dependencies before the deployment.",
    japanese: "デプロイの前にアプリケーションの依存関係を更新する必要があります。",
    industry: "tech",
    level: "beginner",
    mode: "sentence",
  },
  {
    id: "starter-tech-beg-3",
    english: "Check the system status dashboard to confirm all services are running.",
    japanese: "全サービスが稼働していることを確認するため、システムステータスダッシュボードを確認してください。",
    industry: "tech",
    level: "beginner",
    mode: "sentence",
  },
  {
    id: "starter-tech-int-1",
    english: "We need to optimize the database query to decrease response latency.",
    japanese: "応答遅延を短縮するためにデータベースのクエリを最適化する必要があります。",
    industry: "tech",
    level: "intermediate",
    mode: "sentence",
  },
  {
    id: "starter-tech-int-2",
    english: "The engineering team successfully automated our continuous integration pipeline.",
    japanese: "エンジニアリングチームは継続的インテグレーションパイプラインの自動化に成功しました。",
    industry: "tech",
    level: "intermediate",
    mode: "sentence",
  },
  {
    id: "starter-tech-int-3",
    english: "Our API gateway handles rate limiting to prevent server overload.",
    japanese: "当社のAPIゲートウェイはサーバーの過負荷を防ぐためレート制限を処理します。",
    industry: "tech",
    level: "intermediate",
    mode: "sentence",
  },
  {
    id: "starter-tech-adv-1",
    english: "The microservices architecture ensures high availability, horizontal scalability, and fault tolerance.",
    japanese: "マイクロサービスアーキテクチャにより、高可用性、水平スケーラビリティ、耐障害性が保証されます。",
    industry: "tech",
    level: "advanced",
    mode: "sentence",
  },
  {
    id: "starter-tech-adv-2",
    english: "Implementing zero-trust architecture requires continuous authentication and fine-grained access control.",
    japanese: "ゼロトラストアーキテクチャの実装には、継続的な認証ときめ細かなアクセス制御が必要です。",
    industry: "tech",
    level: "advanced",
    mode: "sentence",
  },

  // ── Business ──
  {
    id: "starter-biz-beg-1",
    english: "Please send me the meeting summary before the end of the day.",
    japanese: "本日中に会議の要約を送ってください。",
    industry: "business",
    level: "beginner",
    mode: "sentence",
  },
  {
    id: "starter-biz-beg-2",
    english: "Let's discuss the project timeline during our weekly team check-in.",
    japanese: "週次のチーム定例ミーティングでプロジェクトのスケジュールを話し合いましょう。",
    industry: "business",
    level: "beginner",
    mode: "sentence",
  },
  {
    id: "starter-biz-beg-3",
    english: "We should prepare the presentation slides for the client review.",
    japanese: "クライアントへの報告に向けてプレゼンテーション資料を準備しましょう。",
    industry: "business",
    level: "beginner",
    mode: "sentence",
  },
  {
    id: "starter-biz-int-1",
    english: "Our cross-functional team delivered the project ahead of schedule.",
    japanese: "私たちの部門横断チームは予定より早くプロジェクトを完了しました。",
    industry: "business",
    level: "intermediate",
    mode: "sentence",
  },
  {
    id: "starter-biz-int-2",
    english: "We need to align our quarterly objectives with the new corporate strategy.",
    japanese: "四半期の目標を新しい全社戦略と一致させる必要があります。",
    industry: "business",
    level: "intermediate",
    mode: "sentence",
  },
  {
    id: "starter-biz-int-3",
    english: "Stakeholder feedback indicates strong satisfaction with the initial product release.",
    japanese: "関係者からのフィードバックは、最初の製品リリースに対する高い満足度を示しています。",
    industry: "business",
    level: "intermediate",
    mode: "sentence",
  },
  {
    id: "starter-biz-adv-1",
    english: "Achieving sustainable competitive advantage demands operational efficiency and disciplined capital allocation.",
    japanese: "持続可能な競争優位性を達成するには、業務効率と規律ある資本配分が求められます。",
    industry: "business",
    level: "advanced",
    mode: "sentence",
  },
  {
    id: "starter-biz-adv-2",
    english: "The leadership team decided to divest underperforming assets to accelerate core growth.",
    japanese: "経営陣は中核事業の成長を加速させるため、低採算資産の売却を決定しました。",
    industry: "business",
    level: "advanced",
    mode: "sentence",
  },

  // ── Marketing ──
  {
    id: "starter-mkt-beg-1",
    english: "Our social media campaign reached over fifty thousand new users.",
    japanese: "当社のソーシャルメディアキャンペーンは5万人以上の新規ユーザーに届きました。",
    industry: "marketing",
    level: "beginner",
    mode: "sentence",
  },
  {
    id: "starter-mkt-beg-2",
    english: "We are testing three different email subject lines this week.",
    japanese: "今週は3つの異なるメールの件名をテストしています。",
    industry: "marketing",
    level: "beginner",
    mode: "sentence",
  },
  {
    id: "starter-mkt-beg-3",
    english: "Customer feedback helps us improve our brand messaging and visuals.",
    japanese: "顧客のフィードバックはブランドメッセージとビジュアルの改善に役立ちます。",
    industry: "marketing",
    level: "beginner",
    mode: "sentence",
  },
  {
    id: "starter-mkt-int-1",
    english: "Analyzing user behavior data allows us to optimize the conversion funnel.",
    japanese: "ユーザーの行動データを分析することでコンバージョンファネルを最適化できます。",
    industry: "marketing",
    level: "intermediate",
    mode: "sentence",
  },
  {
    id: "starter-mkt-int-2",
    english: "The influencer partnership significantly boosted our organic referral traffic.",
    japanese: "インフルエンサーとの提携により、オーガニックな紹介トラフィックが大幅に増加しました。",
    industry: "marketing",
    level: "intermediate",
    mode: "sentence",
  },
  {
    id: "starter-mkt-int-3",
    english: "We should tailor our promotional content to resonate with younger demographics.",
    japanese: "より若い年齢層の共感を呼ぶようにプロモーションコンテンツを調整すべきです。",
    industry: "marketing",
    level: "intermediate",
    mode: "sentence",
  },
  {
    id: "starter-mkt-adv-1",
    english: "Omnichannel attribution modeling provides granular insights into cross-device customer journeys.",
    japanese: "オムニチャネルのアトリビューションモデリングにより、クロスデバイスのカスタマージャーニーに関する詳細な洞察が得られます。",
    industry: "marketing",
    level: "advanced",
    mode: "sentence",
  },
  {
    id: "starter-mkt-adv-2",
    english: "Leveraging algorithmic personalization elevated customer lifetime value by twenty-five percent.",
    japanese: "アルゴリズムによるパーソナライゼーションを活用したことで、顧客生涯価値が25%向上しました。",
    industry: "marketing",
    level: "advanced",
    mode: "sentence",
  },

  // ── Daily ──
  {
    id: "starter-daily-beg-1",
    english: "Let's review the agenda before our afternoon conference call.",
    japanese: "午後の電話会議の前に議題を確認しましょう。",
    industry: "daily",
    level: "beginner",
    mode: "sentence",
  },
  {
    id: "starter-daily-beg-2",
    english: "I will grab a quick coffee before the team meeting starts.",
    japanese: "チームミーティングが始まる前に手早くコーヒーを飲んできます。",
    industry: "daily",
    level: "beginner",
    mode: "sentence",
  },
  {
    id: "starter-daily-beg-3",
    english: "Could you please remind me to follow up with John tomorrow?",
    japanese: "明日ジョンにフォローアップの連絡をするよう思い出させていただけますか？",
    industry: "daily",
    level: "beginner",
    mode: "sentence",
  },
  {
    id: "starter-daily-int-1",
    english: "I appreciate your prompt response regarding the schedule adjustment.",
    japanese: "スケジュール調整に関する迅速なご返信に感謝いたします。",
    industry: "daily",
    level: "intermediate",
    mode: "sentence",
  },
  {
    id: "starter-daily-int-2",
    english: "We should wrap up the discussion and summarize the key action items.",
    japanese: "議論を締めくくり、主要なアクションアイテムをまとめましょう。",
    industry: "daily",
    level: "intermediate",
    mode: "sentence",
  },
  {
    id: "starter-daily-int-3",
    english: "Balancing remote work flexibility with team communication remains an ongoing priority.",
    japanese: "リモートワークの柔軟性とチームのコミュニケーションのバランスを取ることは、引き続き重要な課題です。",
    industry: "daily",
    level: "intermediate",
    mode: "sentence",
  },
  {
    id: "starter-daily-adv-1",
    english: "Cultivating constructive feedback loops within our team substantially reduces communication friction.",
    japanese: "チーム内で建設的なフィードバックの循環を醸成することで、コミュニケーションの摩擦が大幅に軽減されます。",
    industry: "daily",
    level: "advanced",
    mode: "sentence",
  },
  {
    id: "starter-daily-adv-2",
    english: "Navigating ambiguous situations with emotional intelligence is a critical leadership skill.",
    japanese: "不確実な状況を高いEQをもって乗り切ることは、極めて重要なリーダーシップスキルです。",
    industry: "daily",
    level: "advanced",
    mode: "sentence",
  },
];

/**
 * Returns an already generated, untried sentence from the curated pool matching the user's settings.
 * If all starter sentences for that slot have been tried, selects the least recently tried one.
 */
export function getUntriedStarterSentence(
  industry: Industry,
  level: DifficultyLevel,
  mode: PracticeMode = "sentence"
): SentenceResponse {
  const normInd = normalizeIndustry(industry);

  // If passage mode, return curated speech passage
  if (mode === "passage") {
    const passage = getFallbackPassage(normInd, level);
    return {
      id: `starter-passage-${normInd}-${level}-${Date.now()}`,
      english: passage.english,
      japanese: passage.japanese,
      wordCount: countWords(passage.english),
      industry: normInd,
      level,
      mode: "passage",
    };
  }

  // 1. Filter candidates for the requested industry & level
  const exactCandidates = STARTER_SENTENCES.filter(
    (s) => s.industry === normInd && s.level === level && s.mode === mode
  );

  // Fallback to same industry any level if exact level empty
  const candidates =
    exactCandidates.length > 0
      ? exactCandidates
      : STARTER_SENTENCES.filter((s) => s.industry === normInd && s.mode === mode);

  // 2. Load user's past sessions to find untried sentences
  const triedSentenceTexts = new Set<string>();
  try {
    const sessions = loadAllSessions();
    sessions.forEach((sess) => {
      if (sess.sentence) {
        triedSentenceTexts.add(sess.sentence.trim().toLowerCase());
      }
    });
  } catch {
    // If running server-side or localStorage unavailable, tried set is empty
  }

  // 3. Find first candidate that user hasn't tried yet
  const untried = candidates.find(
    (c) => !triedSentenceTexts.has(c.english.trim().toLowerCase())
  );

  const selected = untried || candidates[0] || STARTER_SENTENCES[0]!;

  return {
    id: selected.id,
    english: selected.english,
    japanese: selected.japanese,
    wordCount: countWords(selected.english),
    industry: selected.industry,
    level: selected.level,
    mode: selected.mode,
  };
}
