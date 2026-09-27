import { DifficultyLevel } from "@/types";

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
  },
  A2: {
    level: "A2",
    label: "初中級 (A2)",
    labelShort: "A2",
    color: "text-emerald-600",
    bg: "bg-emerald-500/15 border-emerald-500/30",
    difficultyLevel: "beginner",
    targetWPM: 80,
  },
  B1: {
    level: "B1",
    label: "中級 (B1)",
    labelShort: "B1",
    color: "text-blue-600",
    bg: "bg-blue-500/15 border-blue-500/30",
    difficultyLevel: "intermediate",
    targetWPM: 120,
  },
  B2: {
    level: "B2",
    label: "中上級 (B2)",
    labelShort: "B2",
    color: "text-indigo-600",
    bg: "bg-indigo-500/15 border-indigo-500/30",
    difficultyLevel: "intermediate",
    targetWPM: 120,
  },
  C1: {
    level: "C1",
    label: "上級 (C1)",
    labelShort: "C1",
    color: "text-purple-600",
    bg: "bg-purple-500/15 border-purple-500/30",
    difficultyLevel: "advanced",
    targetWPM: 160,
  },
};

const LEVEL_ORDER: AssessmentLevel[] = ["A1", "A2", "B1", "B2", "C1"];

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
}

export interface AssessmentResult {
  recommendedLevel: AssessmentLevel;
  levelInfo: AssessmentLevelInfo;
  answers: AssessmentAnswer[];
  overallComposite: number; // average of all composite scores
  overallAccuracy: number;
  overallWPMFollowRate: number;
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
 * 2. Maximum 5 questions reached
 */
export function getNextQuestion(
  answers: AssessmentAnswer[]
): AssessmentQuestion | null {
  const n = answers.length;

  if (n === 0) return getInitialQuestion();

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

  // Hard cap at 5 questions
  if (n >= 5) {
    return null;
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
 * Determines the final recommended level from all answers.
 *
 * Strategy:
 * - The recommended level is the level at which the user last performed,
 *   adjusted by their final composite score.
 * - If the last two answers are at the same level, that's the stable level.
 * - Otherwise, use the level the algorithm would route to next.
 */
export function calculateAssessmentResult(
  answers: AssessmentAnswer[]
): AssessmentResult {
  if (answers.length === 0) {
    // Fallback for empty — shouldn't happen in practice
    return {
      recommendedLevel: "B1",
      levelInfo: ASSESSMENT_LEVELS["B1"],
      answers: [],
      overallComposite: 0,
      overallAccuracy: 0,
      overallWPMFollowRate: 0,
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
    // If last two answers are at the same level, that's stable
    if (lastAnswer.assessmentLevel === secondLast.assessmentLevel) {
      // Stay at this level, but check if score warrants going up within the "same difficulty"
      // e.g., solid B1 → might be B2 if composite is very high
      const avgLast2 =
        (lastAnswer.compositeScore + secondLast.compositeScore) / 2;
      if (avgLast2 >= 75) {
        // Strong at this level → recommend one above
        const idx = LEVEL_ORDER.indexOf(lastAnswer.assessmentLevel);
        recommendedLevel =
          LEVEL_ORDER[Math.min(idx + 1, LEVEL_ORDER.length - 1)];
      } else if (avgLast2 < 50) {
        // Struggling → recommend one below
        const idx = LEVEL_ORDER.indexOf(lastAnswer.assessmentLevel);
        recommendedLevel = LEVEL_ORDER[Math.max(idx - 1, 0)];
      } else {
        recommendedLevel = lastAnswer.assessmentLevel;
      }
    } else {
      // Not stable — use the level the algorithm would route to
      recommendedLevel = getNextLevel(
        lastAnswer.assessmentLevel,
        lastAnswer.compositeScore
      );
    }
  } else {
    // Only 1 answer (shouldn't happen with min 3 questions, but handle gracefully)
    recommendedLevel = getNextLevel(
      lastAnswer.assessmentLevel,
      lastAnswer.compositeScore
    );
  }

  return {
    recommendedLevel,
    levelInfo: ASSESSMENT_LEVELS[recommendedLevel],
    answers,
    overallComposite,
    overallAccuracy,
    overallWPMFollowRate,
  };
}
