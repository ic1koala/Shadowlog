import { DifficultyLevel } from "@/types";

export interface AssessmentQuestion {
  questionNumber: number;
  level: DifficultyLevel;
}

export interface AssessmentAnswer {
  questionNumber: number;
  level: DifficultyLevel;
  accuracyScore: number;
  matchedWordCount: number;
  wordCount: number;
}

export interface AssessmentResult {
  recommendedLevel: DifficultyLevel;
  beginnerAvg: number;
  intermediateAvg: number;
  advancedAvg: number;
  overallAvg: number;
  answers: AssessmentAnswer[];
}

/**
 * The 10-question assessment plan.
 * Q1-3: Beginner, Q4-7: Intermediate, Q8-10: Advanced
 */
export const ASSESSMENT_PLAN: AssessmentQuestion[] = [
  { questionNumber: 1, level: "beginner" },
  { questionNumber: 2, level: "beginner" },
  { questionNumber: 3, level: "beginner" },
  { questionNumber: 4, level: "intermediate" },
  { questionNumber: 5, level: "intermediate" },
  { questionNumber: 6, level: "intermediate" },
  { questionNumber: 7, level: "intermediate" },
  { questionNumber: 8, level: "advanced" },
  { questionNumber: 9, level: "advanced" },
  { questionNumber: 10, level: "advanced" },
];

/**
 * Calculates the average accuracy for a given difficulty level.
 */
function averageForLevel(answers: AssessmentAnswer[], level: DifficultyLevel): number {
  const filtered = answers.filter((a) => a.level === level);
  if (filtered.length === 0) return 0;
  return Math.round(filtered.reduce((sum, a) => sum + a.accuracyScore, 0) / filtered.length);
}

/**
 * Determines the recommended difficulty level based on assessment answers.
 *
 * Algorithm:
 * - If beginner accuracy < 65%: → beginner (basics need work)
 * - If intermediate accuracy < 55%: → beginner (not ready for intermediate)
 * - If intermediate accuracy >= 55% && advanced accuracy < 50%: → intermediate
 * - If advanced accuracy >= 50%: → advanced
 */
export function calculateAssessmentResult(answers: AssessmentAnswer[]): AssessmentResult {
  const beginnerAvg = averageForLevel(answers, "beginner");
  const intermediateAvg = averageForLevel(answers, "intermediate");
  const advancedAvg = averageForLevel(answers, "advanced");

  const totalScore = answers.reduce((sum, a) => sum + a.accuracyScore, 0);
  const overallAvg = answers.length > 0 ? Math.round(totalScore / answers.length) : 0;

  let recommendedLevel: DifficultyLevel;

  if (beginnerAvg < 65) {
    recommendedLevel = "beginner";
  } else if (intermediateAvg < 55) {
    recommendedLevel = "beginner";
  } else if (advancedAvg >= 50) {
    recommendedLevel = "advanced";
  } else {
    recommendedLevel = "intermediate";
  }

  return {
    recommendedLevel,
    beginnerAvg,
    intermediateAvg,
    advancedAvg,
    overallAvg,
    answers,
  };
}
