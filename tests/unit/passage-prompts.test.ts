import { describe, it, expect } from "vitest";
import {
  getPassageGenerationPrompt,
  getPassageCoachReviewPrompt,
  getFallbackPassage,
} from "@/lib/ai/prompts";
import { DiffResult, Industry, normalizeIndustry } from "@/types";

describe("Passage Prompts & Fallbacks", () => {
  it("generates passage creation prompt with word range instructions", () => {
    const prompt = getPassageGenerationPrompt("business", "advanced");
    expect(prompt.systemPrompt).toContain("60 to 90 words");
    expect(prompt.userPrompt).toContain("business");
    expect(prompt.userPrompt).toContain("advanced");
  });

  it("normalizes legacy finance and medical industries to business and daily", () => {
    expect(normalizeIndustry("finance")).toBe("business");
    expect(normalizeIndustry("medical")).toBe("daily");
    const legacyPrompt = getPassageGenerationPrompt("finance" as Industry, "advanced");
    expect(legacyPrompt.userPrompt).toContain("business");
  });

  it("provides fallback passage for every supported industry", () => {
    const industries = ["tech", "business", "marketing", "daily"] as const;
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

describe("Seasonal & Trend Awareness Prompt Injection", () => {
  it("determines correct seasons and quarters based on date", async () => {
    const { getSeasonalTrendContext } = await import("@/lib/ai/prompts");
    
    // Spring (e.g. April)
    const spring = getSeasonalTrendContext("tech", new Date("2026-04-15T00:00:00Z"));
    expect(spring.season).toBe("spring");
    expect(spring.quarter).toBe("Q2");
    expect(spring.seasonLabel).toContain("Spring");

    // Summer (e.g. July)
    const summer = getSeasonalTrendContext("business", new Date("2026-07-20T00:00:00Z"));
    expect(summer.season).toBe("summer");
    expect(summer.quarter).toBe("Q3");
    expect(summer.seasonLabel).toContain("Summer");

    // Autumn (e.g. October)
    const autumn = getSeasonalTrendContext("marketing", new Date("2026-10-10T00:00:00Z"));
    expect(autumn.season).toBe("autumn");
    expect(autumn.quarter).toBe("Q4");
    expect(autumn.seasonLabel).toContain("Autumn");

    // Winter (e.g. January)
    const winter = getSeasonalTrendContext("daily", new Date("2026-01-15T00:00:00Z"));
    expect(winter.season).toBe("winter");
    expect(winter.quarter).toBe("Q1");
    expect(winter.seasonLabel).toContain("Winter");
  });

  it("injects seasonal timing and modern trend angles into sentence generation prompts", async () => {
    const { getSentenceGenerationPrompt } = await import("@/lib/ai/prompts");
    const autumnDate = new Date("2026-10-01T00:00:00Z");
    const prompt = getSentenceGenerationPrompt("tech", "intermediate", undefined, undefined, autumnDate);

    expect(prompt.systemPrompt).toContain("Season & Trend Awareness");
    expect(prompt.userPrompt).toContain("Seasonal Timing & Cycle");
    expect(prompt.userPrompt).toContain("Autumn (秋)");
    expect(prompt.userPrompt).toContain("Q4");
    expect(prompt.userPrompt).toContain("Modern Trend Angle");
  });

  it("injects seasonal timing and modern trend angles into passage generation prompts", async () => {
    const { getPassageGenerationPrompt } = await import("@/lib/ai/prompts");
    const springDate = new Date("2026-03-20T00:00:00Z");
    const prompt = getPassageGenerationPrompt("business", "advanced", undefined, springDate);

    expect(prompt.systemPrompt).toContain("Season & Trend Awareness");
    expect(prompt.userPrompt).toContain("Seasonal Timing & Cycle");
    expect(prompt.userPrompt).toContain("Spring (春)");
    expect(prompt.userPrompt).toContain("Q1");
    expect(prompt.userPrompt).toContain("Modern Trend Angle");
  });

  it("separates daily casual persona from business presentation persona and bans buzzwords/cliches (FB-038)", async () => {
    const {
      getPassageGenerationPrompt,
      getSentenceGenerationPrompt,
      getSeasonalTrendContext,
    } = await import("@/lib/ai/prompts");

    // 1. Daily passage prompt uses casual storytelling persona, not executive speechwriter
    const dailyPassage = getPassageGenerationPrompt("daily", "intermediate");
    expect(dailyPassage.systemPrompt).toContain(
      "sharing a natural, engaging, and authentic story or recommendation with a friend or colleague"
    );
    expect(dailyPassage.systemPrompt).not.toContain("elite executive speechwriter");
    expect(dailyPassage.userPrompt).toContain(
      "Do NOT turn everyday topics into a keynote speech"
    );

    // 2. Business passage prompt retains professional presentation style
    const businessPassage = getPassageGenerationPrompt("business", "intermediate");
    expect(businessPassage.systemPrompt).toContain("professional communicator");
    expect(businessPassage.userPrompt).toContain("workplace presentation");

    // 3. Both passage and sentence prompts explicitly ban poetic seasonal cliches & buzzwords
    const dailySentence = getSentenceGenerationPrompt("daily", "intermediate");
    for (const p of [dailyPassage, businessPassage, dailySentence]) {
      expect(p.systemPrompt).toContain("As we embrace the vibrant colors of autumn");
      expect(p.systemPrompt).toContain("work-life harmony");
      expect(p.systemPrompt).toContain("digital wellness");
      expect(p.systemPrompt).toContain("OMIT it completely");
      expect(p.systemPrompt).toContain("Sanity Check");
    }

    // 4. Daily trend pool never returns abstract LinkedIn buzzwords
    for (let i = 0; i < 20; i++) {
      const ctx = getSeasonalTrendContext("daily", new Date("2026-10-15T00:00:00Z"));
      expect(ctx.trendingTopic.toLowerCase()).not.toContain("work-life harmony");
      expect(ctx.trendingTopic.toLowerCase()).not.toContain("digital wellness");
    }
  });
});
