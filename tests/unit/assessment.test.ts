import { describe, it, expect } from "vitest";
import {
  calculateAssessmentResult,
  AssessmentAnswer,
  ASSESSMENT_PLAN,
} from "@/lib/assessment/assessment-engine";

describe("Assessment Engine", () => {
  describe("ASSESSMENT_PLAN", () => {
    it("has exactly 10 questions", () => {
      expect(ASSESSMENT_PLAN).toHaveLength(10);
    });

    it("has 3 beginner, 4 intermediate, 3 advanced questions", () => {
      const beginner = ASSESSMENT_PLAN.filter((q) => q.level === "beginner");
      const intermediate = ASSESSMENT_PLAN.filter((q) => q.level === "intermediate");
      const advanced = ASSESSMENT_PLAN.filter((q) => q.level === "advanced");
      expect(beginner).toHaveLength(3);
      expect(intermediate).toHaveLength(4);
      expect(advanced).toHaveLength(3);
    });

    it("questions are numbered 1-10 in order", () => {
      ASSESSMENT_PLAN.forEach((q, i) => {
        expect(q.questionNumber).toBe(i + 1);
      });
    });
  });

  describe("calculateAssessmentResult", () => {
    function makeAnswers(scores: number[]): AssessmentAnswer[] {
      return scores.map((score, i) => ({
        questionNumber: i + 1,
        level: ASSESSMENT_PLAN[i]!.level,
        accuracyScore: score,
        matchedWordCount: Math.round((score / 100) * 10),
        wordCount: 10,
      }));
    }

    it("recommends beginner when beginner accuracy is low", () => {
      // All scores low
      const answers = makeAnswers([30, 40, 50, 20, 30, 25, 35, 10, 15, 20]);
      const result = calculateAssessmentResult(answers);
      expect(result.recommendedLevel).toBe("beginner");
      expect(result.beginnerAvg).toBe(40); // (30+40+50)/3
    });

    it("recommends beginner when intermediate accuracy is low", () => {
      // Good beginner, bad intermediate
      const answers = makeAnswers([80, 90, 70, 30, 40, 35, 45, 20, 15, 25]);
      const result = calculateAssessmentResult(answers);
      expect(result.recommendedLevel).toBe("beginner");
      expect(result.beginnerAvg).toBe(80);
      expect(result.intermediateAvg).toBe(38); // (30+40+35+45)/4
    });

    it("recommends intermediate when intermediate is ok but advanced is low", () => {
      // Good beginner and intermediate, bad advanced
      const answers = makeAnswers([90, 85, 80, 70, 65, 75, 60, 30, 25, 40]);
      const result = calculateAssessmentResult(answers);
      expect(result.recommendedLevel).toBe("intermediate");
    });

    it("recommends advanced when all levels are high", () => {
      const answers = makeAnswers([95, 90, 85, 80, 75, 85, 70, 65, 55, 60]);
      const result = calculateAssessmentResult(answers);
      expect(result.recommendedLevel).toBe("advanced");
      expect(result.advancedAvg).toBe(60); // (65+55+60)/3
    });

    it("calculates correct overall average", () => {
      const answers = makeAnswers([100, 100, 100, 100, 100, 100, 100, 100, 100, 100]);
      const result = calculateAssessmentResult(answers);
      expect(result.overallAvg).toBe(100);
      expect(result.recommendedLevel).toBe("advanced");
    });

    it("handles perfect beginner with borderline intermediate", () => {
      const answers = makeAnswers([100, 95, 90, 55, 56, 57, 55, 30, 20, 40]);
      const result = calculateAssessmentResult(answers);
      expect(result.recommendedLevel).toBe("intermediate");
      expect(result.intermediateAvg).toBe(56); // (55+56+57+55)/4 = 55.75 → 56
    });

    it("returns all tier averages and answers array", () => {
      const answers = makeAnswers([70, 80, 90, 60, 70, 50, 55, 40, 30, 35]);
      const result = calculateAssessmentResult(answers);
      expect(result.beginnerAvg).toBe(80);
      expect(result.intermediateAvg).toBe(59);
      expect(result.advancedAvg).toBe(35);
      expect(result.answers).toHaveLength(10);
    });

    it("handles empty answers gracefully", () => {
      const result = calculateAssessmentResult([]);
      expect(result.recommendedLevel).toBe("beginner");
      expect(result.overallAvg).toBe(0);
    });
  });
});
