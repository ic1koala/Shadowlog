import { describe, it, expect, beforeEach } from "vitest";
import {
  getSilentDrillUnlockProgress,
  getSilentDrillDailyQuota,
  recordSilentDrillCompletion,
  splitSentenceInto3To4Chunks,
  generateSilentDrillQuestions,
  FREE_USER_DAILY_LIMIT,
} from "@/lib/storage/silent-drill-store";

describe("Silent Drill Store & Logic (Silent Mode)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("splitSentenceInto3To4Chunks", () => {
    it("should split standard comma-separated sentences into around 5 chunks without losing words", () => {
      const sentence = "Although the revenue increased sharply, we decided not to expand the team until next quarter.";
      const chunks = splitSentenceInto3To4Chunks(sentence);
      expect(chunks.length).toBe(5);
      expect(chunks.join(" ").replace(/\s+/g, " ").trim()).toEqual(sentence.replace(/\s+/g, " ").trim());
    });

    it("should split two-sentence passages into 5 to 6 chunks and respect sentence boundary", () => {
      const sentence = "We need to finalize the quarterly budget by Friday. Please send your department's estimates as soon as possible.";
      const chunks = splitSentenceInto3To4Chunks(sentence);
      expect(chunks.length).toBeGreaterThanOrEqual(5);
      expect(chunks.length).toBeLessThanOrEqual(6);
      expect(chunks.some((c) => c.endsWith("Friday."))).toBe(true);
      expect(chunks.join(" ").replace(/\s+/g, " ").trim()).toEqual(sentence.replace(/\s+/g, " ").trim());
    });

    it("should split plain sentence into 4 to 5 chunks without losing words", () => {
      const sentence = "Our engineering team worked overnight to restore all user services.";
      const chunks = splitSentenceInto3To4Chunks(sentence);
      expect(chunks.length).toBeGreaterThanOrEqual(4);
      expect(chunks.length).toBeLessThanOrEqual(5);
      expect(chunks.join(" ").replace(/\s+/g, " ").trim()).toEqual(sentence.replace(/\s+/g, " ").trim());
    });
  });

  describe("Daily Quota and Plan Limits", () => {
    it("free user should start with 10 questions and decrease on record", () => {
      const quotaBefore = getSilentDrillDailyQuota("free");
      expect(quotaBefore.isUnlimited).toBe(false);
      expect(quotaBefore.remainingCount).toBe(FREE_USER_DAILY_LIMIT);
      expect(quotaBefore.canPlay).toBe(true);

      const quotaAfterOne = recordSilentDrillCompletion();
      expect(quotaAfterOne.todayCompletedCount).toBe(1);
      expect(quotaAfterOne.remainingCount).toBe(FREE_USER_DAILY_LIMIT - 1);
      expect(quotaAfterOne.canPlay).toBe(true);
    });

    it("free user should not be able to play when reaching daily limit", () => {
      for (let i = 0; i < FREE_USER_DAILY_LIMIT; i++) {
        recordSilentDrillCompletion();
      }

      const quota = getSilentDrillDailyQuota("free");
      expect(quota.todayCompletedCount).toBe(FREE_USER_DAILY_LIMIT);
      expect(quota.remainingCount).toBe(0);
      expect(quota.canPlay).toBe(false);
    });

    it("base and pro users should have unlimited questions", () => {
      for (let i = 0; i < FREE_USER_DAILY_LIMIT + 5; i++) {
        recordSilentDrillCompletion();
      }

      const baseQuota = getSilentDrillDailyQuota("base");
      expect(baseQuota.isUnlimited).toBe(true);
      expect(baseQuota.canPlay).toBe(true);
      expect(baseQuota.remainingCount).toBe(Infinity);

      const proQuota = getSilentDrillDailyQuota("pro");
      expect(proQuota.isUnlimited).toBe(true);
      expect(proQuota.canPlay).toBe(true);
    });
  });

  describe("generateSilentDrillQuestions", () => {
    it("should generate questions with chunks and shuffled options", () => {
      const questions = generateSilentDrillQuestions(5);
      expect(questions.length).toBeGreaterThan(0);
      expect(questions.length).toBeLessThanOrEqual(5);

      const firstQ = questions[0];
      expect(firstQ.chunks.length).toBeGreaterThanOrEqual(2);
      expect(firstQ.shuffledChunks.length).toBe(firstQ.chunks.length);
      expect(firstQ.japanese.length).toBeGreaterThan(0);

      // Verify correctIndex values exist
      const indices = firstQ.shuffledChunks.map((c) => c.correctIndex).sort();
      const expectedIndices = Array.from({ length: firstQ.chunks.length }, (_, i) => i);
      expect(indices).toEqual(expectedIndices);
    });
  });

  describe("Unlock Progress", () => {
    it("should report locked when session count is less than 3", () => {
      const progress = getSilentDrillUnlockProgress();
      expect(progress.targetCount).toBe(3);
      expect(progress.isUnlocked).toBe(false);
      expect(progress.remainingCount).toBe(3);
    });
  });
});
