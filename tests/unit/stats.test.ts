import { describe, it, expect } from "vitest";
import {
  calculateStreaks,
  calculateUserStats,
  formatDateKey,
} from "@/lib/stats/stats-calculator";
import { PracticeSession } from "@/types";

describe("Stats and Streak Calculation Unit Tests", () => {
  const refDate = new Date("2026-09-21T12:00:00Z"); // Monday Sept 21, 2026

  describe("formatDateKey", () => {
    it("formats local dates properly as YYYY-MM-DD", () => {
      const d = new Date(2026, 8, 21); // Sept 21
      expect(formatDateKey(d)).toBe("2026-09-21");
    });
  });

  describe("calculateStreaks", () => {
    it("returns 0 streaks for empty dates", () => {
      const result = calculateStreaks([], refDate);
      expect(result.currentStreak).toBe(0);
      expect(result.bestStreak).toBe(0);
    });

    it("calculates active streak when practiced today", () => {
      const dates = ["2026-09-19", "2026-09-20", "2026-09-21"];
      const result = calculateStreaks(dates, refDate);
      expect(result.currentStreak).toBe(3);
      expect(result.bestStreak).toBe(3);
    });

    it("maintains streak when practiced yesterday but not yet today", () => {
      const dates = ["2026-09-19", "2026-09-20"];
      const result = calculateStreaks(dates, refDate);
      expect(result.currentStreak).toBe(2);
      expect(result.bestStreak).toBe(2);
    });

    it("resets current streak to 0 if last practice was 2 days ago", () => {
      const dates = ["2026-09-17", "2026-09-18", "2026-09-19"];
      const result = calculateStreaks(dates, refDate);
      expect(result.currentStreak).toBe(0);
      expect(result.bestStreak).toBe(3);
    });

    it("preserves historical best streak greater than current streak", () => {
      // 5-day streak in August, 2-day streak now
      const dates = [
        "2026-08-01",
        "2026-08-02",
        "2026-08-03",
        "2026-08-04",
        "2026-08-05",
        "2026-09-20",
        "2026-09-21",
      ];
      const result = calculateStreaks(dates, refDate);
      expect(result.currentStreak).toBe(2);
      expect(result.bestStreak).toBe(5);
    });
  });

  describe("calculateUserStats", () => {
    it("aggregates total words and daily counts across sessions", () => {
      const sessions: PracticeSession[] = [
        {
          id: "s1",
          sentence: "First test sentence.",
          transcription: "First test sentence.",
          wordCount: 3,
          matchedWordCount: 3,
          accuracyScore: 100,
          createdAt: "2026-09-20T10:00:00Z",
        },
        {
          id: "s2",
          sentence: "Second sentence practiced on same day.",
          transcription: "Second sentence practiced on same day.",
          wordCount: 6,
          matchedWordCount: 5,
          accuracyScore: 83,
          createdAt: "2026-09-20T14:00:00Z",
        },
        {
          id: "s3",
          sentence: "Third sentence practiced today.",
          transcription: "Third sentence practiced today.",
          wordCount: 4,
          matchedWordCount: 4,
          accuracyScore: 100,
          createdAt: "2026-09-21T09:00:00Z",
        },
      ];

      const stats = calculateUserStats(sessions, refDate);
      expect(stats.totalSessions).toBe(3);
      expect(stats.totalWords).toBe(10); // Deduplicated unique words (sentence and practiced counted once)
      expect(stats.currentStreak).toBe(2);
      expect(stats.bestStreak).toBe(2);
      expect(stats.dailyCounts["2026-09-20"]).toBe(8);
      expect(stats.dailyCounts["2026-09-21"]).toBe(4);
    });

    it("handles empty sessions gracefully", () => {
      const stats = calculateUserStats([], refDate);
      expect(stats.totalWords).toBe(0);
      expect(stats.totalSessions).toBe(0);
      expect(stats.currentStreak).toBe(0);
      expect(stats.bestStreak).toBe(0);
      expect(stats.dailyCounts).toEqual({});
    });
  });
});
