import { DifficultyLevel, DiffToken, SentenceResponse } from "@/types";

// ── Fine-grained assessment levels ──

export type AssessmentLevel = "A1" | "A2" | "B1" | "B2" | "C1";

export interface AssessmentLevelInfo {
  level: AssessmentLevel;
  label: string; // e.g., '初級 (A1)'
  labelShort: string; // e.g., 'A1'
  color: string; // tailwind text color class
  bg: string; // tailwind bg+border classes
  difficultyLevel: DifficultyLevel; // for sentence generation API
  targetWPM: number;
  toeicRangeLabel: string;
}

export const ASSESSMENT_LEVELS: Record<AssessmentLevel, AssessmentLevelInfo> = {
  A1: {
    level: "A1",
    label: "初級 (A1)",
    labelShort: "A1",
    color: "text-green-600",
    bg: "bg-green-500/15 border-green-500/30",
    difficultyLevel: "beginner",
    targetWPM: 80,
    toeicRangeLabel: "TOEIC 300〜445点相当",
  },
  A2: {
    level: "A2",
    label: "初中級 (A2)",
    labelShort: "A2",
    color: "text-emerald-600",
    bg: "bg-emerald-500/15 border-emerald-500/30",
    difficultyLevel: "beginner",
    targetWPM: 80,
    toeicRangeLabel: "TOEIC 450〜545点相当",
  },
  B1: {
    level: "B1",
    label: "中級 (B1)",
    labelShort: "B1",
    color: "text-blue-600",
    bg: "bg-blue-500/15 border-blue-500/30",
    difficultyLevel: "intermediate",
    targetWPM: 120,
    toeicRangeLabel: "TOEIC 550〜695点相当",
  },
  B2: {
    level: "B2",
    label: "中上級 (B2)",
    labelShort: "B2",
    color: "text-indigo-600",
    bg: "bg-indigo-500/15 border-indigo-500/30",
    difficultyLevel: "intermediate",
    targetWPM: 120,
    toeicRangeLabel: "TOEIC 700〜845点相当",
  },
  C1: {
    level: "C1",
    label: "上級 (C1)",
    labelShort: "C1",
    color: "text-purple-600",
    bg: "bg-purple-500/15 border-purple-500/30",
    difficultyLevel: "advanced",
    targetWPM: 160,
    toeicRangeLabel: "TOEIC 850〜990点相当",
  },
};

const LEVEL_ORDER: AssessmentLevel[] = ["A1", "A2", "B1", "B2", "C1"];

// ── Function words (Linking & Weak-form indicators for TOEIC Listening/Speaking) ──
export const FUNCTION_WORDS = new Set([
  "to",
  "for",
  "of",
  "the",
  "a",
  "an",
  "in",
  "on",
  "at",
  "with",
  "have",
  "has",
  "had",
  "been",
  "be",
  "is",
  "are",
  "was",
  "were",
  "going",
  "that",
  "from",
  "as",
  "by",
  "it",
  "we",
  "they",
  "you",
  "our",
  "their",
  "your",
  "can",
  "could",
  "would",
  "should",
  "will",
  "into",
  "out",
  "up",
  "about",
  "and",
  "or",
  "if",
]);

// ── Curated TOEIC Benchmark Sentences (Zero API Wait Time, High Diagnostic Calibration) ──
export const ASSESSMENT_BENCHMARK_SENTENCES: Record<
  AssessmentLevel,
  SentenceResponse[]
> = {
  A1: [
    {
      id: "bench-a1-1",
      english: "I would like to check in for my flight to Tokyo this morning.",
      japanese: "今朝の東京行きの便のチェックインをお願いします。",
      wordCount: 13,
      industry: "daily",
      level: "beginner",
    },
    {
      id: "bench-a1-2",
      english: "Could you tell me how to get to the nearest train station?",
      japanese: "最寄りの駅への行き方を教えていただけますか？",
      wordCount: 12,
      industry: "daily",
      level: "beginner",
    },
  ],
  A2: [
    {
      id: "bench-a2-1",
      english: "We are going to have a short meeting to talk about the new project.",
      japanese: "新しいプロジェクトについて話し合うため、短いミーティングを行う予定です。",
      wordCount: 14,
      industry: "business",
      level: "beginner",
    },
    {
      id: "bench-a2-2",
      english: "Please let me know if you need any help with the presentation tomorrow.",
      japanese: "明日のプレゼンテーションで何か手伝いが必要であればお知らせください。",
      wordCount: 13,
      industry: "business",
      level: "beginner",
    },
  ],
  B1: [
    {
      id: "bench-b1-1",
      english: "We need to review the quarterly sales report before the client meeting starts at two.",
      japanese: "2時にクライアントとの会議が始まる前に、四半期の売上レポートを確認する必要があります。",
      wordCount: 15,
      industry: "business",
      level: "intermediate",
    },
    {
      id: "bench-b1-2",
      english: "I have been working on the budget proposal since Monday, and it is almost ready.",
      japanese: "月曜日から予算案の作成に取り組んでおり、もうすぐ完成するところです。",
      wordCount: 15,
      industry: "business",
      level: "intermediate",
    },
  ],
  B2: [
    {
      id: "bench-b2-1",
      english: "The marketing team has come up with an effective strategy to expand our customer base overseas.",
      japanese: "マーケティングチームは、海外の顧客基盤を拡大するための効果的な戦略を考案しました。",
      wordCount: 16,
      industry: "marketing",
      level: "intermediate",
    },
    {
      id: "bench-b2-2",
      english: "Due to unexpected supply chain delays, we will have to reschedule the product launch for next month.",
      japanese: "予期せぬサプライチェーンの遅延により、製品発表を来月に再調整しなければなりません。",
      wordCount: 17,
      industry: "business",
      level: "intermediate",
    },
  ],
  C1: [
    {
      id: "bench-c1-1",
      english: "Had we anticipated the rapid shift in consumer behavior earlier, we could have allocated more resources to digital channels.",
      japanese: "消費者行動の急速な変化をもっと早く予測できていれば、デジタルチャネルにより多くのリソースを配分できていたでしょう。",
      wordCount: 19,
      industry: "marketing",
      level: "advanced",
    },
    {
      id: "bench-c1-2",
      english: "Integrating artificial intelligence into our core workflow has significantly improved operational efficiency across all departments.",
      japanese: "中核業務フローへの人工知能の統合により、全社的な業務効率が飛躍的に向上しました。",
      wordCount: 15,
      industry: "tech",
      level: "advanced",
    },
  ],
};

/**
 * Returns a curated benchmark sentence for the given level and question number.
 */
export function getBenchmarkSentence(
  level: AssessmentLevel,
  questionNumber: number
): SentenceResponse {
  const pool = ASSESSMENT_BENCHMARK_SENTENCES[level] || ASSESSMENT_BENCHMARK_SENTENCES.B1;
  const idx = (questionNumber - 1) % pool.length;
  return pool[idx];
}

// ── Types ──

export interface AssessmentQuestion {
  questionNumber: number;
  assessmentLevel: AssessmentLevel;
  difficultyLevel: DifficultyLevel; // for API call
}

export interface AssessmentAnswer {
  questionNumber: number;
  assessmentLevel: AssessmentLevel;
  accuracyScore: number; // 0-100
  wpmFollowRate: number; // 0-100 (WPM追従度)
  compositeScore: number; // average of accuracy and wpmFollowRate
  userWPM: number;
  durationSeconds: number;
  wordCount: number;
  // Extended TOEIC diagnostic fields (optional for backward compatibility)
  contentWordAccuracy?: number; // 0-100
  linkingAccuracy?: number; // 0-100
  recordingMode?: "repeating" | "shadowing";
  missedLinkingWords?: string[];
  missedContentWords?: string[];
}

export interface ToeicSkillBreakdown {
  vocabularyCatch: number; // 0-100 (重要語彙キャッチ力: 配点35%)
  linkingReproduction: number; // 0-100 (リンキング・機能語再現率: 配点30%)
  speedFollow: number; // 0-100 (有効WPMスピード追従度: 配点25%)
  modeBonus: number; // 0-100 (発声モード補正: 配点10%)
}

export interface AssessmentResult {
  recommendedLevel: AssessmentLevel;
  levelInfo: AssessmentLevelInfo;
  answers: AssessmentAnswer[];
  overallComposite: number; // average of all composite scores
  overallAccuracy: number;
  overallWPMFollowRate: number;
  // Enriched TOEIC Diagnostic Metrics
  estimatedToeicScore: number; // 300 - 990 (5点刻み)
  estimatedListeningScore: number; // 150 - 495 (5点刻み)
  effectiveWPM: number; // スピード × 正確性
  toeicNativeWpmGap: number; // TOEIC Part3標準 (150 WPM) までの差分
  percentileTop: number; // 上位何%か (1 - 99)
  skillBreakdown: ToeicSkillBreakdown;
  missedLinkingWords: string[];
  missedContentWords: string[];
}

// ── Helper: Analyze DiffTokens into Content Words vs Function (Linking) Words ──

export function analyzeDiffWordsForToeic(diffTokens: DiffToken[]): {
  contentWordAccuracy: number;
  linkingAccuracy: number;
  missedLinkingWords: string[];
  missedContentWords: string[];
} {
  const relevantWords = diffTokens.filter((w) => w.status !== "extra");
  if (relevantWords.length === 0) {
    return {
      contentWordAccuracy: 0,
      linkingAccuracy: 0,
      missedLinkingWords: [],
      missedContentWords: [],
    };
  }

  let contentTotal = 0;
  let contentMatched = 0;
  let linkingTotal = 0;
  let linkingMatched = 0;
  const missedLinkingWords: string[] = [];
  const missedContentWords: string[] = [];

  for (const w of relevantWords) {
    const raw = w.expectedWord || w.word;
    const clean = raw.replace(/[^a-zA-Z']/g, "").toLowerCase();
    if (!clean) continue;

    const isFunc = FUNCTION_WORDS.has(clean);
    const isCorrect = w.status === "match";

    if (isFunc) {
      linkingTotal++;
      if (isCorrect) {
        linkingMatched++;
      } else if (!missedLinkingWords.includes(clean)) {
        missedLinkingWords.push(clean);
      }
    } else {
      contentTotal++;
      if (isCorrect) {
        contentMatched++;
      } else if (!missedContentWords.includes(clean)) {
        missedContentWords.push(clean);
      }
    }
  }

  const contentWordAccuracy =
    contentTotal > 0 ? Math.round((contentMatched / contentTotal) * 100) : 100;
  const linkingAccuracy =
    linkingTotal > 0 ? Math.round((linkingMatched / linkingTotal) * 100) : contentWordAccuracy;

  return {
    contentWordAccuracy,
    linkingAccuracy,
    missedLinkingWords: missedLinkingWords.slice(0, 6),
    missedContentWords: missedContentWords.slice(0, 6),
  };
}

// ── Adaptive Routing Logic ──

/**
 * Determines the next assessment level based on the composite score.
 * - Score >= 75%: Go UP one level (cap at C1)
 * - Score < 50%: Go DOWN one level (floor at A1)
 * - 50-74%: Stay at current level
 */
function getNextLevel(
  currentLevel: AssessmentLevel,
  compositeScore: number
): AssessmentLevel {
  const idx = LEVEL_ORDER.indexOf(currentLevel);
  if (compositeScore >= 75) {
    return LEVEL_ORDER[Math.min(idx + 1, LEVEL_ORDER.length - 1)];
  } else if (compositeScore < 50) {
    return LEVEL_ORDER[Math.max(idx - 1, 0)];
  }
  return currentLevel;
}

/**
 * Returns the first question (always starts at B1/intermediate).
 */
export function getInitialQuestion(): AssessmentQuestion {
  return {
    questionNumber: 1,
    assessmentLevel: "B1",
    difficultyLevel: ASSESSMENT_LEVELS["B1"].difficultyLevel,
  };
}

/**
 * Returns the next question or null if the test is complete.
 *
 * Stop conditions:
 * 1. Level stabilized: same level for last 2 answers AND next would be same → done (min 3 questions)
 * 2. Maximum questions reached (default 5 for full adaptive, or 3 for 3-step TOEIC test)
 */
export function getNextQuestion(
  answers: AssessmentAnswer[],
  maxQuestions: number = 5
): AssessmentQuestion | null {
  const n = answers.length;

  if (n === 0) return getInitialQuestion();

  // Hard cap at maxQuestions (e.g. 3 for 3-step TOEIC test, 5 for standard)
  if (n >= maxQuestions) {
    return null;
  }

  const lastAnswer = answers[n - 1];
  const nextLevel = getNextLevel(
    lastAnswer.assessmentLevel,
    lastAnswer.compositeScore
  );

  // Early stop: level stabilized for 2 consecutive answers at the same level
  if (n >= 3) {
    const prevAnswer = answers[n - 2];
    if (
      lastAnswer.assessmentLevel === prevAnswer.assessmentLevel &&
      nextLevel === lastAnswer.assessmentLevel
    ) {
      return null; // Test complete — stable level found
    }
  }

  return {
    questionNumber: n + 1,
    assessmentLevel: nextLevel,
    difficultyLevel: ASSESSMENT_LEVELS[nextLevel].difficultyLevel,
  };
}

// ── Scoring Functions ──

/**
 * Calculates WPM追従度 (WPM follow rate).
 * Compares user's WPM to the target WPM for the given assessment level.
 * Capped at 100% — being slightly faster than target is fine.
 */
export function calculateWPMFollowRate(
  userWPM: number,
  assessmentLevel: AssessmentLevel
): number {
  const targetWPM = ASSESSMENT_LEVELS[assessmentLevel].targetWPM;
  if (targetWPM === 0) return 0;
  return Math.min(100, Math.round((userWPM / targetWPM) * 100));
}

/**
 * Calculates composite score: average of accuracy and WPM follow rate.
 */
export function calculateCompositeScore(
  accuracy: number,
  wpmFollowRate: number
): number {
  return Math.round((accuracy + wpmFollowRate) / 2);
}

/**
 * Converts an assessment level to a DifficultyLevel for the sentence generation API.
 */
export function assessmentLevelToDifficulty(
  level: AssessmentLevel
): DifficultyLevel {
  return ASSESSMENT_LEVELS[level].difficultyLevel;
}

/**
 * Determines the final recommended level and enriched TOEIC metrics from all answers.
 */
export function calculateAssessmentResult(
  answers: AssessmentAnswer[]
): AssessmentResult {
  if (answers.length === 0) {
    return {
      recommendedLevel: "B1",
      levelInfo: ASSESSMENT_LEVELS["B1"],
      answers: [],
      overallComposite: 0,
      overallAccuracy: 0,
      overallWPMFollowRate: 0,
      estimatedToeicScore: 450,
      estimatedListeningScore: 240,
      effectiveWPM: 0,
      toeicNativeWpmGap: 150,
      percentileTop: 65,
      skillBreakdown: {
        vocabularyCatch: 0,
        linkingReproduction: 0,
        speedFollow: 0,
        modeBonus: 70,
      },
      missedLinkingWords: [],
      missedContentWords: [],
    };
  }

  const overallAccuracy = Math.round(
    answers.reduce((sum, a) => sum + a.accuracyScore, 0) / answers.length
  );
  const overallWPMFollowRate = Math.round(
    answers.reduce((sum, a) => sum + a.wpmFollowRate, 0) / answers.length
  );
  const overallComposite = Math.round(
    answers.reduce((sum, a) => sum + a.compositeScore, 0) / answers.length
  );

  // Determine recommended level
  const lastAnswer = answers[answers.length - 1];
  let recommendedLevel: AssessmentLevel;

  if (answers.length >= 2) {
    const secondLast = answers[answers.length - 2];
    if (lastAnswer.assessmentLevel === secondLast.assessmentLevel) {
      const avgLast2 =
        (lastAnswer.compositeScore + secondLast.compositeScore) / 2;
      if (avgLast2 >= 75) {
        const idx = LEVEL_ORDER.indexOf(lastAnswer.assessmentLevel);
        recommendedLevel =
          LEVEL_ORDER[Math.min(idx + 1, LEVEL_ORDER.length - 1)];
      } else if (avgLast2 < 50) {
        const idx = LEVEL_ORDER.indexOf(lastAnswer.assessmentLevel);
        recommendedLevel = LEVEL_ORDER[Math.max(idx - 1, 0)];
      } else {
        recommendedLevel = lastAnswer.assessmentLevel;
      }
    } else {
      recommendedLevel = getNextLevel(
        lastAnswer.assessmentLevel,
        lastAnswer.compositeScore
      );
    }
  } else {
    recommendedLevel = getNextLevel(
      lastAnswer.assessmentLevel,
      lastAnswer.compositeScore
    );
  }

  // ── High-Precision 4-Factor TOEIC Score Calculation ──
  // 1. Vocabulary Catch (35% weight)
  const vocabularyCatch = Math.round(
    answers.reduce(
      (sum, a) => sum + (a.contentWordAccuracy ?? a.accuracyScore),
      0
    ) / answers.length
  );

  // 2. Linking / Function Word Reproduction (30% weight)
  const linkingReproduction = Math.round(
    answers.reduce(
      (sum, a) => sum + (a.linkingAccuracy ?? a.accuracyScore),
      0
    ) / answers.length
  );

  // 3. Effective WPM & Speed Follow (25% weight)
  const avgRawWpm =
    answers.reduce((sum, a) => sum + a.userWPM, 0) / answers.length;
  const effectiveWPM = Math.round(avgRawWpm * (overallAccuracy / 100));
  // Compare effectiveWPM against TOEIC Part 3 standard (150 WPM)
  const speedFollow = Math.min(
    100,
    Math.round(
      (effectiveWPM / 150) * 65 + overallWPMFollowRate * 0.35
    )
  );

  // 4. Mode Bonus (10% weight): Shadowing (simultaneous) = 100, Repeating = 75
  const modeBonus = Math.round(
    answers.reduce(
      (sum, a) => sum + (a.recordingMode === "shadowing" ? 100 : 75),
      0
    ) / answers.length
  );

  // Weighted 100-point index
  const weightedIndex =
    vocabularyCatch * 0.35 +
    linkingReproduction * 0.3 +
    speedFollow * 0.25 +
    modeBonus * 0.1;

  // Base anchor by recommended CEFR level
  const levelBaseMap: Record<AssessmentLevel, number> = {
    A1: 340,
    A2: 460,
    B1: 580,
    B2: 720,
    C1: 850,
  };
  const baseToeic = levelBaseMap[recommendedLevel];

  // Combine base anchor (55%) + continuous weighted index mapping (45%, scaled 300..990)
  const continuousToeic = 300 + (weightedIndex / 100) * 690;
  const rawToeic = baseToeic * 0.55 + continuousToeic * 0.45;

  // Round to nearest 5 points (standard TOEIC step), clamped to [300, 990]
  const estimatedToeicScore = Math.max(
    300,
    Math.min(990, Math.round(rawToeic / 5) * 5)
  );

  // Listening score (150 - 495, 5-point increments, slightly higher weight on linking & speed)
  const rawListening = estimatedToeicScore * 0.52;
  const estimatedListeningScore = Math.max(
    150,
    Math.min(495, Math.round(rawListening / 5) * 5)
  );

  const toeicNativeWpmGap = Math.max(0, 150 - effectiveWPM);

  // Percentile calculation (Top X%)
  const percentileTop = Math.max(
    3,
    Math.min(95, Math.round(100 - ((estimatedToeicScore - 300) / 690) * 92))
  );

  // Aggregate unique missed words across answers
  const missedLinkingSet = new Set<string>();
  const missedContentSet = new Set<string>();
  for (const a of answers) {
    a.missedLinkingWords?.forEach((w) => missedLinkingSet.add(w));
    a.missedContentWords?.forEach((w) => missedContentSet.add(w));
  }

  return {
    recommendedLevel,
    levelInfo: ASSESSMENT_LEVELS[recommendedLevel],
    answers,
    overallComposite,
    overallAccuracy,
    overallWPMFollowRate,
    estimatedToeicScore,
    estimatedListeningScore,
    effectiveWPM,
    toeicNativeWpmGap,
    percentileTop,
    skillBreakdown: {
      vocabularyCatch,
      linkingReproduction,
      speedFollow,
      modeBonus,
    },
    missedLinkingWords: Array.from(missedLinkingSet).slice(0, 8),
    missedContentWords: Array.from(missedContentSet).slice(0, 8),
  };
}
