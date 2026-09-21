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
