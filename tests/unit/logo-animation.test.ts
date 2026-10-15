import { describe, it, expect } from "vitest";
import {
  LOGO_ANIMATION_PATTERNS,
  LogoAnimationPattern,
} from "@/components/features/onboarding/LogoAnimationPlayer";

describe("LogoAnimationPlayer Specifications", () => {
  it("should have exactly 5 distinct animation patterns", () => {
    expect(LOGO_ANIMATION_PATTERNS).toHaveLength(5);
    const ids = LOGO_ANIMATION_PATTERNS.map((p) => p.id);
    const expectedIds: LogoAnimationPattern[] = [
      "prism",
      "waveform",
      "eclipse",
      "sonic",
      "minimal",
    ];
    expect(ids).toEqual(expectedIds);
  });

  it("should have animation duration between 2.0 and 3.5 seconds", () => {
    LOGO_ANIMATION_PATTERNS.forEach((pattern) => {
      expect(pattern.durationSec).toBeGreaterThanOrEqual(2.0);
      expect(pattern.durationSec).toBeLessThanOrEqual(3.5);
    });
  });

  it("should contain complete metadata for every pattern", () => {
    LOGO_ANIMATION_PATTERNS.forEach((pattern) => {
      expect(pattern.name.length).toBeGreaterThan(0);
      expect(pattern.nameJa.length).toBeGreaterThan(0);
      expect(pattern.tagline.length).toBeGreaterThan(0);
      expect(pattern.description.length).toBeGreaterThan(0);
      expect(pattern.recommendedFor.length).toBeGreaterThan(0);
      expect(pattern.themeColor.length).toBeGreaterThan(0);
    });
  });
});
