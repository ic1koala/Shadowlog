import { describe, it, expect } from "vitest";
import {
  calculateWpmStats,
  getWpmRating,
} from "@/lib/storage/wpm-stats-calculator";
import { StoredSession } from "@/types";

describe("wpm-stats-calculator", () => {
  it("returns correct ratings", () => {
    expect(getWpmRating(0)).toBe("測定中");
    expect(getWpmRating(85)).toBe("じっくり (〜99 WPM)");
    expect(getWpmRating(115)).toBe("ナチュラル (100〜129 WPM)");
    expect(getWpmRating(145)).toBe("流暢 (130〜159 WPM)");
    expect(getWpmRating(170)).toBe("ネイティブ級 (160+ WPM)");
  });

  it("handles empty sessions gracefully", () => {
    const stats = calculateWpmStats([]);
    expect(stats.hasData).toBe(false);
    expect(stats.recent3DaysAverageWpm).toBe(0);
    expect(stats.dailyTrend).toHaveLength(7);
  });

  it("calculates 3-day average correctly from today's sessions", () => {
    const now = new Date();
    const todayStr = now.toISOString();

    const mockSessions: Partial<StoredSession>[] = [
      {
        id: "1",
        sentence: "Hello world",
        transcription: "Hello world",
        wordCount: 2,
        matchedWordCount: 2,
        accuracyScore: 100,
        wpm: 120,
        createdAt: todayStr,
      },
      {
        id: "2",
        sentence: "Good morning",
        transcription: "Good morning",
        wordCount: 2,
        matchedWordCount: 2,
        accuracyScore: 100,
        wpm: 140,
        createdAt: todayStr,
      },
    ];

    const stats = calculateWpmStats(mockSessions as StoredSession[]);
    expect(stats.hasData).toBe(true);
    expect(stats.recent3DaysAverageWpm).toBe(130); // (120+140)/2
    expect(stats.ratingLabel).toBe("流暢 (130〜159 WPM)");
  });
});
