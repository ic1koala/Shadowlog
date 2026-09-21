import { describe, it, expect } from "vitest";
import { generateFallbackCoachFeedback, getCoachReviewPrompt } from "@/lib/ai/prompts";
import { DiffResult } from "@/types";

describe("AI Coach Feedback Generator", () => {
  it("creates high praise and advanced cadence tips for 90%+ scores", () => {
    const mockDiff: DiffResult = {
      tokens: [
        { word: "we", status: "match" },
        { word: "need", status: "match" },
      ],
      originalText: "we need",
      spokenText: "we need",
      originalWordCount: 2,
      spokenWordCount: 2,
      matchedWordCount: 2,
      accuracyScore: 100,
    };

    const feedback = generateFallbackCoachFeedback(mockDiff);
    expect(feedback.overallComment).toContain("素晴らしいリズム");
    expect(feedback.pronunciationAdvice).toBeTruthy();
    expect(feedback.retryFocusPoint).toBeTruthy();
  });

  it("identifies missing words and provides linking advice for 70-89% scores", () => {
    const mockDiff: DiffResult = {
      tokens: [
        { word: "to", status: "missing" },
        { word: "optimize", status: "match" },
        { word: "the", status: "missing" },
      ],
      originalText: "to optimize the",
      spokenText: "optimize",
      originalWordCount: 3,
      spokenWordCount: 1,
      matchedWordCount: 1,
      accuracyScore: 75,
    };

    const feedback = generateFallbackCoachFeedback(mockDiff);
    expect(feedback.overallComment).toContain("惜しいところまで");
    expect(feedback.pronunciationAdvice).toContain("to");
    expect(feedback.retryFocusPoint).toContain("to");
  });

  it("handles mismatch tokens with vowel advice for lower scores", () => {
    const mockDiff: DiffResult = {
      tokens: [
        { word: "query", spokenWord: "quarry", status: "mismatch" },
      ],
      originalText: "query",
      spokenText: "quarry",
      originalWordCount: 1,
      spokenWordCount: 1,
      matchedWordCount: 0,
      accuracyScore: 50,
    };

    const feedback = generateFallbackCoachFeedback(mockDiff);
    expect(feedback.pronunciationAdvice).toContain("query");
    expect(feedback.retryFocusPoint).toContain("0.8x");
  });

  it("generates correct system and user prompt templates", () => {
    const mockDiff: DiffResult = {
      tokens: [{ word: "hello", status: "match" }],
      originalText: "hello",
      spokenText: "hello",
      originalWordCount: 1,
      spokenWordCount: 1,
      matchedWordCount: 1,
      accuracyScore: 100,
    };

    const { systemPrompt, userPrompt } = getCoachReviewPrompt(
      "hello",
      "hello",
      mockDiff
    );

    expect(systemPrompt).toContain("英語発音・スピーキング専任コーチ");
    expect(systemPrompt).toContain("overallComment");
    expect(systemPrompt).toContain("pronunciationAdvice");
    expect(systemPrompt).toContain("retryFocusPoint");
    expect(userPrompt).toContain("hello");
  });
});
