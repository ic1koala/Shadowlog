import { describe, it, expect } from "vitest";
import {
  evaluatePronunciationWithAzure,
  generateMockAzureAssessment,
} from "@/lib/ai/azure-speech";

describe("Azure Speech Pronunciation Assessment", () => {
  describe("generateMockAzureAssessment", () => {
    it("generates a realistic baseline assessment for reference text", () => {
      const text = "We need to optimize our cloud database.";
      const result = generateMockAzureAssessment(text);

      expect(result).toBeDefined();
      expect(result.overallScore).toBeGreaterThanOrEqual(80);
      expect(result.accuracyScore).toBeGreaterThanOrEqual(80);
      expect(result.fluencyScore).toBeGreaterThan(0);
      expect(result.completenessScore).toBeGreaterThan(0);
      expect(result.prosodyScore).toBeGreaterThan(0);
      expect(result.words.length).toBe(7);
      expect(result.words[0].word).toBe("We");
      expect(result.words[0].errorType).toBe("None");
      expect(result.recognitionStatus).toBe("Success");
      expect(result.environmentMention).toBeUndefined();
    });

    it("creates warning environment mention on InitialSilenceTimeout", () => {
      const text = "Hello world";
      const result = generateMockAzureAssessment(text, {
        recognitionStatus: "InitialSilenceTimeout",
      });

      expect(result.recognitionStatus).toBe("InitialSilenceTimeout");
      expect(result.environmentMention).toBeDefined();
      expect(result.environmentMention?.type).toBe("warning");
      expect(result.environmentMention?.message).toContain("音声が検出されませんでした");
    });

    it("creates warning environment mention on BabbleTimeout", () => {
      const text = "Hello world";
      const result = generateMockAzureAssessment(text, {
        recognitionStatus: "BabbleTimeout",
      });

      expect(result.recognitionStatus).toBe("BabbleTimeout");
      expect(result.environmentMention).toBeDefined();
      expect(result.environmentMention?.type).toBe("warning");
      expect(result.environmentMention?.message).toContain("周囲の話し声");
    });

    it("creates warning environment mention on noisy environment (low SNR < 15.0)", () => {
      const text = "Good morning";
      const result = generateMockAzureAssessment(text, {
        snr: 11.2,
      });

      expect(result.environmentMention).toBeDefined();
      expect(result.environmentMention?.type).toBe("warning");
      expect(result.environmentMention?.message).toContain("周辺の雑音・ノイズが多いようです");
    });

    it("creates info environment mention when microphone volume is very low (< 0.05)", () => {
      const text = "Good morning";
      const result = generateMockAzureAssessment(text, {
        averageVolume: 0.02,
      });

      expect(result.environmentMention).toBeDefined();
      expect(result.environmentMention?.type).toBe("info");
      expect(result.environmentMention?.message).toContain("マイクの声が少し遠いようです");
    });

    it("flags mispronunciation when forceLowAccuracy is enabled", () => {
      const text = "The strategic initiative was executed properly.";
      const result = generateMockAzureAssessment(text, {
        forceLowAccuracy: true,
      });

      expect(result.overallScore).toBeLessThan(80);
      expect(result.words.some((w) => w.errorType === "Mispronunciation")).toBe(true);
    });
  });

  describe("evaluatePronunciationWithAzure", () => {
    it("returns mock assessment in test environment", async () => {
      const dummyWavHeader = Buffer.from([
        0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00,
        0x57, 0x41, 0x56, 0x45, 0x66, 0x6d, 0x74, 0x20,
      ]);

      const result = await evaluatePronunciationWithAzure({
        audioBuffer: dummyWavHeader,
        mimeType: "audio/wav",
        referenceText: "Thank you for joining today's meeting.",
      });

      expect(result).toBeDefined();
      expect(result.overallScore).toBeGreaterThan(0);
      expect(result.words.length).toBeGreaterThan(0);
      expect(result.displayText).toBe("Thank you for joining today's meeting.");
    });
  });
});
