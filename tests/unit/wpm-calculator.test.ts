import { describe, it, expect } from "vitest";
import { calculateWPM } from "@/lib/diff/wpm-calculator";

describe("WPM Calculator", () => {
  it("calculates WPM correctly for typical presentation pace", () => {
    // 70 words in 30 seconds = 140 WPM
    const result = calculateWPM(70, 30);
    expect(result.wpm).toBe(140);
    expect(result.rating).toBe("natural");
    expect(result.label).toContain("自然な会話ペース");
  });

  it("rates speech under 110 WPM as slow", () => {
    // 40 words in 30 seconds = 80 WPM
    const result = calculateWPM(40, 30);
    expect(result.wpm).toBe(80);
    expect(result.rating).toBe("slow");
  });

  it("rates speech between 141 and 170 as fluent native pace", () => {
    // 75 words in 30 seconds = 150 WPM
    const result = calculateWPM(75, 30);
    expect(result.wpm).toBe(150);
    expect(result.rating).toBe("fluent");
    expect(result.label).toContain("ネイティブ級");
  });

  it("rates speech over 170 as fast", () => {
    // 100 words in 30 seconds = 200 WPM
    const result = calculateWPM(100, 30);
    expect(result.wpm).toBe(200);
    expect(result.rating).toBe("fast");
  });

  it("guards against zero or negative duration safely", () => {
    const result = calculateWPM(10, 0);
    expect(result.wpm).toBe(600); // 10 words in 1 safe second
    expect(result.durationSeconds).toBe(1);
  });
});

describe("calculatePlaybackWpmMap (Dynamic Audio WPM)", () => {
  it("returns fallback values (75 / 125 / 150) when audio duration is null or 0", async () => {
    const { calculatePlaybackWpmMap, DEFAULT_PLAYBACK_WPM_MAP } = await import("@/lib/diff/wpm-calculator");
    expect(calculatePlaybackWpmMap(10, null)).toEqual(DEFAULT_PLAYBACK_WPM_MAP);
    expect(calculatePlaybackWpmMap(10, undefined)).toEqual({ 0.6: 75, 1.0: 125, 1.2: 150 });
    expect(calculatePlaybackWpmMap(10, 0)).toEqual({ 0.6: 75, 1.0: 125, 1.2: 150 });
    expect(calculatePlaybackWpmMap(0, 5.0)).toEqual({ 0.6: 75, 1.0: 125, 1.2: 150 });
  });

  it("calculates real effective WPM accurately based on word count and duration", async () => {
    const { calculatePlaybackWpmMap } = await import("@/lib/diff/wpm-calculator");
    // Example: 13 words in 6.0 seconds => baseWpm = (13 / 6) * 60 = 130 WPM
    // 0.6x: 130 * 0.6 = 78 WPM
    // 1.0x: 130 WPM
    // 1.2x: 130 * 1.2 = 156 WPM
    const wpm = calculatePlaybackWpmMap(13, 6.0);
    expect(wpm[1.0]).toBe(130);
    expect(wpm[0.6]).toBe(78);
    expect(wpm[1.2]).toBe(156);
  });

  it("calculates fast phrase speed properly", async () => {
    const { calculatePlaybackWpmMap } = await import("@/lib/diff/wpm-calculator");
    // 25 words in 10.0 seconds => baseWpm = 150 WPM
    // 0.6x: 90 WPM
    // 1.0x: 150 WPM
    // 1.2x: 180 WPM
    const wpm = calculatePlaybackWpmMap(25, 10.0);
    expect(wpm[1.0]).toBe(150);
    expect(wpm[0.6]).toBe(90);
    expect(wpm[1.2]).toBe(180);
  });
});

