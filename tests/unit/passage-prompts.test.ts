import { describe, it, expect } from "vitest";
import {
  getPassageGenerationPrompt,
  getPassageCoachReviewPrompt,
  getFallbackPassage,
} from "@/lib/ai/prompts";
import { DiffResult } from "@/types";

describe("Passage Prompts & Fallbacks", () => {
  it("generates passage creation prompt with word range instructions", () => {
    const prompt = getPassageGenerationPrompt("finance", "advanced");
    expect(prompt.systemPrompt).toContain("60 to 90 words");
    expect(prompt.userPrompt).toContain("finance");
    expect(prompt.userPrompt).toContain("advanced");
  });

  it("provides fallback passage for every supported industry", () => {
    const industries = ["tech", "business", "finance", "medical", "marketing", "daily"] as const;
    for (const ind of industries) {
      const fallback = getFallbackPassage(ind, "intermediate");
      expect(fallback.english.length).toBeGreaterThan(50);
      expect(fallback.japanese.length).toBeGreaterThan(10);
      const words = fallback.english.trim().split(/\s+/).length;
      expect(words).toBeGreaterThanOrEqual(40);
    }
  });

  it("generates executive speech coach review prompt with WPM info", () => {
    const mockDiff: DiffResult = {
      tokens: [
        { word: "Good", status: "match", spokenWord: "Good" },
        { word: "morning", status: "missing" },
        { word: "everyone", status: "mismatch", spokenWord: "everybody" },
      ],
      accuracyScore: 75,
      matchedWordCount: 1,
      spokenWordCount: 2,
      originalWordCount: 3,
      originalText: "Good morning everyone",
      spokenText: "Good everybody",
    };

    const prompt = getPassageCoachReviewPrompt(
      "Good morning everyone",
      "Good everybody",
      mockDiff,
      {
        wpm: 145,
        rating: "fluent",
        label: "流暢なスピーチペース（141-170 WPM）",
        durationSeconds: 28,
      }
    );

    expect(prompt.systemPrompt).toContain("エグゼクティブ・スピーチコーチ");
    expect(prompt.systemPrompt).toContain("pacingAdvice");
    expect(prompt.userPrompt).toContain("145 WPM");
    expect(prompt.userPrompt).toContain("流暢なスピーチペース");
  });
});
