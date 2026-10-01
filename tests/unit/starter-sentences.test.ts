import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  STARTER_SENTENCES,
  getUntriedStarterSentence,
} from "@/lib/practice/starter-sentences";
import * as userLearningStore from "@/lib/storage/user-learning-store";

describe("Starter Sentences Engine", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("contains curated sentences for all active industries and levels", () => {
    const industries = ["tech", "business", "marketing", "daily"] as const;
    const levels = ["beginner", "intermediate", "advanced"] as const;

    for (const ind of industries) {
      for (const lvl of levels) {
        const matching = STARTER_SENTENCES.filter(
          (s) => s.industry === ind && s.level === lvl && s.mode === "sentence"
        );
        expect(matching.length).toBeGreaterThanOrEqual(2);
        for (const item of matching) {
          expect(item.english).toBeTruthy();
          expect(item.japanese).toBeTruthy();
          expect(item.english.length).toBeGreaterThan(10);
        }
      }
    }
  });

  it("returns an untried sentence matching the requested industry and level", () => {
    const res = getUntriedStarterSentence("tech", "intermediate", "sentence");
    expect(res).toBeDefined();
    expect(res.industry).toBe("tech");
    expect(res.level).toBe("intermediate");
    expect(res.wordCount).toBeGreaterThan(3);
    expect(res.english).toBeTruthy();
    expect(res.japanese).toBeTruthy();
  });

  it("skips sentences already tried in previous sessions", () => {
    const techBegSentences = STARTER_SENTENCES.filter(
      (s) => s.industry === "tech" && s.level === "beginner"
    );
    expect(techBegSentences.length).toBeGreaterThanOrEqual(2);

    const firstItem = techBegSentences[0]!;
    const secondItem = techBegSentences[1]!;

    // Mock loadAllSessions to simulate user having tried the first sentence
    vi.spyOn(userLearningStore, "loadAllSessions").mockReturnValue([
      {
        id: "sess-1",
        createdAt: "2026-10-01T10:00:00Z",
        industry: "tech",
        level: "beginner",
        sentence: firstItem.english,
        transcription: firstItem.english,
        japanese: firstItem.japanese,
        accuracyScore: 95,
        wordCount: 10,
        matchedWordCount: 9,
        wpm: 120,
        isCleared: true,
        retryCount: 0,
      },
    ]);

    const result = getUntriedStarterSentence("tech", "beginner", "sentence");
    // Should skip the first tried item and return the untried second item
    expect(result.english.trim().toLowerCase()).toBe(secondItem.english.trim().toLowerCase());
  });

  it("returns fallback passage in passage mode", () => {
    const res = getUntriedStarterSentence("business", "intermediate", "passage");
    expect(res).toBeDefined();
    expect(res.mode).toBe("passage");
    expect(res.english).toBeTruthy();
    expect(res.japanese).toBeTruthy();
    expect(res.wordCount).toBeGreaterThan(20);
  });
});
