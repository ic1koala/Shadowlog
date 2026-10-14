import { describe, it, expect } from "vitest";
import { calculateTemporalDiff } from "@/lib/diff/temporal-alignment";
import {
  calculateAssessmentResult,
  getNextQuestion,
  AssessmentAnswer,
} from "@/lib/assessment/assessment-engine";

describe("Temporal Alignment & Anti-Lenience Tests", () => {
  const sentence =
    "We need to review the quarterly sales report before the client meeting starts at two.";
  // 15 words

  it("penalizes swallowed or unarticulated words (< 75ms) as timing anomalies", () => {
    // Simulate Whisper returning phantom words squeezed into 30ms of silence
    const spokenText =
      "We need to review the quarterly sales report before the client meeting starts at two.";
    const words = spokenText.split(" ");
    const timings = words.map((w, idx) => {
      // Intentionally make "quarterly" and "client" phantom (30ms)
      if (w === "quarterly" || w === "client") {
        return { word: w, start: idx * 0.4, end: idx * 0.4 + 0.03 };
      }
      return { word: w, start: idx * 0.4, end: idx * 0.4 + 0.35 };
    });

    const result = calculateTemporalDiff(sentence, spokenText, {
      spokenWordsWithTime: timings,
      audioDuration: 6.5,
    });

    // Swallowed words should be marked with isTimingAnomaly: true
    const anomalies = result.tokens.filter((t) => t.isTimingAnomaly);
    expect(anomalies.length).toBeGreaterThanOrEqual(1);
    // Accuracy should be lower than 100% due to swallowed words
    expect(result.accuracyScore).toBeLessThan(95);
  });

  it("penalizes audio that covers only a fraction of expected sentence duration", () => {
    // 15 words, but user only recorded 1.2 seconds of speech and quit
    const spokenText = "We need to review";
    const timings = [
      { word: "We", start: 0.1, end: 0.3 },
      { word: "need", start: 0.35, end: 0.6 },
      { word: "to", start: 0.65, end: 0.8 },
      { word: "review", start: 0.85, end: 1.15 },
    ];

    const result = calculateTemporalDiff(sentence, spokenText, {
      spokenWordsWithTime: timings,
      audioDuration: 1.5,
    });

    expect(result.speechCoverageRate).toBeLessThan(0.7);
    // 4 out of 15 words spoken with short coverage -> score should be very low (~15-25%)
    expect(result.accuracyScore).toBeLessThan(30);
  });

  it("penalizes rambling or excess hallucinated words", () => {
    const spokenText =
      "Um uh well we need to review actually yeah the quarterly sales report before um the client meeting starts at two you know right";
    const result = calculateTemporalDiff(sentence, spokenText);

    // Extra words detected and deducted
    const extras = result.tokens.filter((t) => t.status === "extra");
    expect(extras.length).toBeGreaterThanOrEqual(5);
    expect(result.accuracyScore).toBeLessThan(90);
  });

  it("strictly discounts phonetic mismatches and mumbling (sim < 0.82)", () => {
    // Sloppy katakana / mumbled English
    const spokenText =
      "We neat to revew de quater sal repot befor de clien meetin star at to";
    const result = calculateTemporalDiff(sentence, spokenText);

    // Should severely drop accuracy (below 50%) rather than awarding 80%+
    expect(result.accuracyScore).toBeLessThan(50);
  });
});

describe("Realistic TOEIC Diagnosis Calibration", () => {
  it("diagnoses a 400-level speaker in the realistic 350-450 range (never 870!)", () => {
    // Simulation of an actual 400-point user:
    // Q1 (B1): struggles, accuracy 38%, WPM 65 (follow rate 54%) -> composite 46% -> DEMOTED to A2
    // Q2 (A2): struggles, accuracy 45%, WPM 60 (follow rate 75%) -> composite 60% -> stays A2
    // Q3 (A2): struggles, accuracy 42%, WPM 62 (follow rate 78%) -> composite 60% -> final A2 or A1
    const answers: AssessmentAnswer[] = [
      {
        questionNumber: 1,
        assessmentLevel: "B1",
        accuracyScore: 38,
        wpmFollowRate: 54,
        compositeScore: 46,
        userWPM: 65,
        durationSeconds: 12,
        wordCount: 15,
        contentWordAccuracy: 35,
        linkingAccuracy: 40,
        recordingMode: "shadowing",
      },
      {
        questionNumber: 2,
        assessmentLevel: "A2",
        accuracyScore: 45,
        wpmFollowRate: 75,
        compositeScore: 60,
        userWPM: 60,
        durationSeconds: 14,
        wordCount: 14,
        contentWordAccuracy: 42,
        linkingAccuracy: 48,
        recordingMode: "shadowing",
      },
      {
        questionNumber: 3,
        assessmentLevel: "A2",
        accuracyScore: 40,
        wpmFollowRate: 72,
        compositeScore: 56,
        userWPM: 58,
        durationSeconds: 14,
        wordCount: 13,
        contentWordAccuracy: 38,
        linkingAccuracy: 44,
        recordingMode: "shadowing",
      },
    ];

    const result = calculateAssessmentResult(answers);

    // The user should be placed in A1 or A2
    expect(["A1", "A2"]).toContain(result.recommendedLevel);

    // CRITICAL: Estimated TOEIC must be realistic (300-530 range, never 870!)
    expect(result.estimatedToeicScore).toBeGreaterThanOrEqual(300);
    expect(result.estimatedToeicScore).toBeLessThanOrEqual(530);
    expect(result.estimatedToeicScore).not.toBe(870);

    // Listening score must also be calibrated
    expect(result.estimatedListeningScore).toBeLessThanOrEqual(300);

    // Percentile for 400-500 level is realistic (Top 70-95%)
    expect(result.percentileTop).toBeGreaterThanOrEqual(65);
  });

  it("does NOT promote a user to higher level if accuracy is poor, even if WPM is fast", () => {
    // Fast mumble: WPM 160 (follow rate 100%), but accuracy only 45% -> composite 73%
    const answers: AssessmentAnswer[] = [
      {
        questionNumber: 1,
        assessmentLevel: "B1",
        accuracyScore: 45,
        wpmFollowRate: 100,
        compositeScore: 73,
        userWPM: 160,
        durationSeconds: 5,
        wordCount: 15,
      },
    ];

    const nextQ = getNextQuestion(answers);
    // Because accuracy was 45% (< 50%), user should be DEMOTED to A2, NOT promoted!
    expect(nextQ?.assessmentLevel).toBe("A2");
  });

  it("awards high scores (850-990) only to speakers who succeed on C1 advanced material", () => {
    const highPerformerAnswers: AssessmentAnswer[] = [
      {
        questionNumber: 1,
        assessmentLevel: "B1",
        accuracyScore: 92,
        wpmFollowRate: 100,
        compositeScore: 96,
        userWPM: 140,
        durationSeconds: 6,
        wordCount: 15,
        contentWordAccuracy: 95,
        linkingAccuracy: 90,
        recordingMode: "shadowing",
      },
      {
        questionNumber: 2,
        assessmentLevel: "B2",
        accuracyScore: 88,
        wpmFollowRate: 100,
        compositeScore: 94,
        userWPM: 145,
        durationSeconds: 6,
        wordCount: 16,
        contentWordAccuracy: 90,
        linkingAccuracy: 86,
        recordingMode: "shadowing",
      },
      {
        questionNumber: 3,
        assessmentLevel: "C1",
        accuracyScore: 88,
        wpmFollowRate: 95,
        compositeScore: 92,
        userWPM: 152,
        durationSeconds: 7,
        wordCount: 19,
        contentWordAccuracy: 90,
        linkingAccuracy: 86,
        recordingMode: "shadowing",
      },
    ];

    const result = calculateAssessmentResult(highPerformerAnswers);
    expect(result.recommendedLevel).toBe("C1");
    expect(result.estimatedToeicScore).toBeGreaterThanOrEqual(850);
    expect(result.estimatedToeicScore).toBeLessThanOrEqual(990);
    expect(result.percentileTop).toBeLessThanOrEqual(15);
  });
});
