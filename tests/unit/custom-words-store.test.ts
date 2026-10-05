import { describe, it, expect, beforeEach } from "vitest";
import {
  getCustomWords,
  getCustomWordSlots,
  saveCustomWords,
  getCustomGenerationQuota,
  consumeCustomGenerationQuota,
  getSuggestedWordChips,
  getJstDateKey,
} from "@/lib/storage/custom-words-store";
import { getSentenceGenerationPrompt } from "@/lib/ai/prompts";

describe("custom-words-store (FB-035)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("saves and retrieves up to 3 custom words while preserving slot positions", () => {
    expect(getCustomWords()).toEqual([]);
    expect(getCustomWordSlots()).toEqual(["", "", ""]);

    const saved = saveCustomWords([" scalability ", "", "予算調整"]);
    expect(saved).toEqual(["scalability", "予算調整"]);
    expect(getCustomWords()).toEqual(["scalability", "予算調整"]);
    expect(getCustomWordSlots()).toEqual(["scalability", "", "予算調整"]);
  });

  it("enforces cumulative 2-generation limit for free/guest users across days", () => {
    const day1 = new Date("2026-10-05T10:00:00+09:00");
    const day2 = new Date("2026-10-06T10:00:00+09:00");

    const q0 = getCustomGenerationQuota("guest", day1);
    expect(q0.maxLimit).toBe(2);
    expect(q0.remainingCount).toBe(2);
    expect(q0.isDaily).toBe(false);
    expect(q0.canGenerate).toBe(true);

    const c1 = consumeCustomGenerationQuota("guest", day1);
    expect(c1.success).toBe(true);
    expect(c1.quota.remainingCount).toBe(1);

    const c2 = consumeCustomGenerationQuota("guest", day1);
    expect(c2.success).toBe(true);
    expect(c2.quota.remainingCount).toBe(0);
    expect(c2.quota.canGenerate).toBe(false);

    // Next day: cumulative limit for guest should still be exhausted
    const qNextDay = getCustomGenerationQuota("guest", day2);
    expect(qNextDay.remainingCount).toBe(0);
    expect(qNextDay.canGenerate).toBe(false);

    const c3 = consumeCustomGenerationQuota("guest", day2);
    expect(c3.success).toBe(false);
  });

  it("enforces 3/day limit for base plan and resets at midnight JST", () => {
    const day1Late = new Date("2026-10-05T23:50:00+09:00");
    const day2Early = new Date("2026-10-06T00:05:00+09:00");

    expect(getJstDateKey(day1Late)).toBe("2026-10-05");
    expect(getJstDateKey(day2Early)).toBe("2026-10-06");

    expect(consumeCustomGenerationQuota("base", day1Late).quota.remainingCount).toBe(2);
    expect(consumeCustomGenerationQuota("base", day1Late).quota.remainingCount).toBe(1);
    const third = consumeCustomGenerationQuota("base", day1Late);
    expect(third.success).toBe(true);
    expect(third.quota.remainingCount).toBe(0);
    expect(third.quota.canGenerate).toBe(false);

    // 4th attempt on same JST day is blocked
    const fourth = consumeCustomGenerationQuota("base", day1Late);
    expect(fourth.success).toBe(false);

    // After 00:00 JST on next day, quota resets to 3/3
    const nextDayQuota = getCustomGenerationQuota("base", day2Early);
    expect(nextDayQuota.remainingCount).toBe(3);
    expect(nextDayQuota.canGenerate).toBe(true);
  });

  it("enforces 10/day limit for pro plan", () => {
    const now = new Date("2026-10-05T12:00:00+09:00");
    const initial = getCustomGenerationQuota("pro", now);
    expect(initial.maxLimit).toBe(10);
    expect(initial.remainingCount).toBe(10);
    expect(initial.isDaily).toBe(true);

    for (let i = 0; i < 10; i++) {
      const res = consumeCustomGenerationQuota("pro", now);
      expect(res.success).toBe(true);
    }

    const after10 = getCustomGenerationQuota("pro", now);
    expect(after10.remainingCount).toBe(0);
    expect(after10.canGenerate).toBe(false);
    expect(consumeCustomGenerationQuota("pro", now).success).toBe(false);
  });

  it("returns industry-specific and weak-word candidate chips", () => {
    const chips = getSuggestedWordChips("marketing", ["conversion", "attribution", "conversion"]);
    expect(chips.industryChips.length).toBeGreaterThan(0);
    expect(chips.industryChips[0]?.word).toBe("conversion");
    expect(chips.weakWordChips).toEqual(["conversion", "attribution"]);
  });

  it("injects customWords and level-appropriate word count rules into getSentenceGenerationPrompt", () => {
    const beginnerPrompt = getSentenceGenerationPrompt(
      "tech",
      "beginner",
      undefined,
      [],
      new Date("2026-10-05T12:00:00Z"),
      ["scalability", "latency", "ボトルネック"]
    );
    expect(beginnerPrompt.systemPrompt).toContain("scalability, latency, ボトルネック");
    expect(beginnerPrompt.userPrompt).toContain("10 to 14 words");

    const advancedPrompt = getSentenceGenerationPrompt(
      "business",
      "advanced",
      undefined,
      [],
      new Date("2026-10-05T12:00:00Z"),
      ["stakeholder", "feasibility"]
    );
    expect(advancedPrompt.systemPrompt).toContain("stakeholder, feasibility");
    expect(advancedPrompt.userPrompt).toContain("21 to 28 words");
  });
});
