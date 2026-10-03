import { describe, it, expect } from "vitest";
import {
  getInitialQuestion,
  getNextQuestion,
  calculateWPMFollowRate,
  calculateCompositeScore,
  calculateAssessmentResult,
  assessmentLevelToDifficulty,
  ASSESSMENT_LEVELS,
  AssessmentAnswer,
} from "@/lib/assessment/assessment-engine";

describe("Adaptive Assessment Engine", () => {
  describe("getInitialQuestion", () => {
    it("starts at B1 (intermediate)", () => {
      const q = getInitialQuestion();
      expect(q.questionNumber).toBe(1);
      expect(q.assessmentLevel).toBe("B1");
      expect(q.difficultyLevel).toBe("intermediate");
    });
  });

  describe("getNextQuestion (Adaptive routing)", () => {
    function makeAnswer(
      qNum: number,
      level: "A1" | "A2" | "B1" | "B2" | "C1",
      compositeScore: number
    ): AssessmentAnswer {
      return {
        questionNumber: qNum,
        assessmentLevel: level,
        accuracyScore: compositeScore,
        wpmFollowRate: compositeScore,
        compositeScore,
        userWPM: 100,
        durationSeconds: 5,
        wordCount: 10,
      };
    }

    it("moves up one level when score >= 75%", () => {
      const answers = [makeAnswer(1, "B1", 80)];
      const nextQ = getNextQuestion(answers);
      expect(nextQ).not.toBeNull();
      expect(nextQ?.questionNumber).toBe(2);
      expect(nextQ?.assessmentLevel).toBe("B2");
      expect(nextQ?.difficultyLevel).toBe("intermediate");
    });

    it("moves down one level when score < 50%", () => {
      const answers = [makeAnswer(1, "B1", 40)];
      const nextQ = getNextQuestion(answers);
      expect(nextQ).not.toBeNull();
      expect(nextQ?.questionNumber).toBe(2);
      expect(nextQ?.assessmentLevel).toBe("A2");
      expect(nextQ?.difficultyLevel).toBe("beginner");
    });

    it("stays at current level when score is between 50% and 74%", () => {
      const answers = [makeAnswer(1, "B1", 65)];
      const nextQ = getNextQuestion(answers);
      expect(nextQ).not.toBeNull();
      expect(nextQ?.questionNumber).toBe(2);
      expect(nextQ?.assessmentLevel).toBe("B1");
    });

    it("caps at C1 and does not exceed it", () => {
      const answers = [
        makeAnswer(1, "B1", 85),
        makeAnswer(2, "B2", 90),
      ];
      const nextQ = getNextQuestion(answers);
      expect(nextQ?.assessmentLevel).toBe("C1");
      expect(nextQ?.difficultyLevel).toBe("advanced");

      const answersAtC1 = [...answers, makeAnswer(3, "C1", 95)];
      const q4 = getNextQuestion(answersAtC1);
      // Since C1 + 95% stays at C1, and previous was B2 (not consecutive C1 yet), next is C1
      expect(q4?.assessmentLevel).toBe("C1");
    });

    it("floors at A1 and does not go below it", () => {
      const answers = [
        makeAnswer(1, "B1", 30),
        makeAnswer(2, "A2", 30),
      ];
      const nextQ = getNextQuestion(answers);
      expect(nextQ?.assessmentLevel).toBe("A1");
      expect(nextQ?.difficultyLevel).toBe("beginner");
    });

    it("stops early after 3 questions if level stabilizes for 2 consecutive questions", () => {
      // Q1: B1 (60% -> stays B1)
      // Q2: B1 (60% -> stays B1)
      // Q3: B1 (60% -> stays B1) -> stabilized!
      const answers = [
        makeAnswer(1, "B1", 60),
        makeAnswer(2, "B1", 60),
        makeAnswer(3, "B1", 60),
      ];
      const nextQ = getNextQuestion(answers);
      expect(nextQ).toBeNull(); // Test complete
    });

    it("stops at hard cap of 5 questions", () => {
      // Alternating scores so it doesn't stabilize early
      const answers = [
        makeAnswer(1, "B1", 80), // -> B2
        makeAnswer(2, "B2", 40), // -> B1
        makeAnswer(3, "B1", 80), // -> B2
        makeAnswer(4, "B2", 40), // -> B1
        makeAnswer(5, "B1", 80), // -> 5 questions reached
      ];
      const nextQ = getNextQuestion(answers);
      expect(nextQ).toBeNull(); // Complete at max 5
    });
  });

  describe("calculateWPMFollowRate", () => {
    it("calculates correct percentage against target WPM", () => {
      // B1 target is 120 WPM
      expect(calculateWPMFollowRate(60, "B1")).toBe(50);
      expect(calculateWPMFollowRate(120, "B1")).toBe(100);
    });

    it("caps at 100% even if user speaks faster", () => {
      // A1 target is 80 WPM, user at 120 WPM
      expect(calculateWPMFollowRate(120, "A1")).toBe(100);
    });
  });

  describe("calculateCompositeScore", () => {
    it("averages accuracy and WPM follow rate equally", () => {
      // accuracy 80, wpmFollowRate 60 -> average 70
      expect(calculateCompositeScore(80, 60)).toBe(70);
      expect(calculateCompositeScore(95, 85)).toBe(90);
    });
  });

  describe("assessmentLevelToDifficulty", () => {
    it("maps A1 and A2 to beginner", () => {
      expect(assessmentLevelToDifficulty("A1")).toBe("beginner");
      expect(assessmentLevelToDifficulty("A2")).toBe("beginner");
    });

    it("maps B1 and B2 to intermediate", () => {
      expect(assessmentLevelToDifficulty("B1")).toBe("intermediate");
      expect(assessmentLevelToDifficulty("B2")).toBe("intermediate");
    });

    it("maps C1 to advanced", () => {
      expect(assessmentLevelToDifficulty("C1")).toBe("advanced");
    });
  });

  describe("calculateAssessmentResult", () => {
    it("returns correct result for stabilized intermediate user", () => {
      const answers: AssessmentAnswer[] = [
        {
          questionNumber: 1,
          assessmentLevel: "B1",
          accuracyScore: 80,
          wpmFollowRate: 70,
          compositeScore: 75,
          userWPM: 90,
          durationSeconds: 6,
          wordCount: 12,
        },
        {
          questionNumber: 2,
          assessmentLevel: "B2",
          accuracyScore: 60,
          wpmFollowRate: 60,
          compositeScore: 60,
          userWPM: 100,
          durationSeconds: 7,
          wordCount: 14,
        },
        {
          questionNumber: 3,
          assessmentLevel: "B2",
          accuracyScore: 65,
          wpmFollowRate: 65,
          compositeScore: 65,
          userWPM: 105,
          durationSeconds: 7,
          wordCount: 14,
        },
      ];

      const result = calculateAssessmentResult(answers);
      expect(result.recommendedLevel).toBe("B2");
      expect(result.levelInfo.label).toBe("中上級 (B2)");
      expect(result.levelInfo.difficultyLevel).toBe("intermediate");
      expect(result.overallAccuracy).toBe(68); // (80+60+65)/3 = 68.33 -> 68
      expect(result.overallWPMFollowRate).toBe(65); // (70+60+65)/3 = 65
      expect(result.overallComposite).toBe(67); // (75+60+65)/3 = 66.67 -> 67
      expect(result.answers).toHaveLength(3);
      expect(result.estimatedToeicScore).toBeGreaterThanOrEqual(300);
      expect(result.estimatedToeicScore).toBeLessThanOrEqual(990);
      expect(result.estimatedToeicScore % 5).toBe(0);
    });

    it("handles empty answers gracefully with B1 fallback", () => {
      const result = calculateAssessmentResult([]);
      expect(result.recommendedLevel).toBe("B1");
      expect(result.overallComposite).toBe(0);
      expect(result.answers).toHaveLength(0);
    });

    it("stops after 3 questions when maxQuestions=3 is specified", () => {
      const answers: AssessmentAnswer[] = [
        {
          questionNumber: 1,
          assessmentLevel: "B1",
          accuracyScore: 90,
          wpmFollowRate: 90,
          compositeScore: 90,
          userWPM: 140,
          durationSeconds: 5,
          wordCount: 12,
        },
        {
          questionNumber: 2,
          assessmentLevel: "B2",
          accuracyScore: 85,
          wpmFollowRate: 85,
          compositeScore: 85,
          userWPM: 145,
          durationSeconds: 5,
          wordCount: 12,
        },
        {
          questionNumber: 3,
          assessmentLevel: "C1",
          accuracyScore: 88,
          wpmFollowRate: 88,
          compositeScore: 88,
          userWPM: 155,
          durationSeconds: 5,
          wordCount: 14,
        },
      ];
      expect(getNextQuestion(answers, 3)).toBeNull();
      const res = calculateAssessmentResult(answers);
      expect(res.estimatedToeicScore).toBeGreaterThanOrEqual(750);
      expect(res.effectiveWPM).toBeGreaterThan(120);
    });
  });
});
