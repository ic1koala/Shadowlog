import { describe, it, expect } from "vitest";
import {
  cleanWord,
  getCandidateStems,
  getWordTranslation,
} from "@/lib/practice/word-dictionary";

describe("word-dictionary", () => {
  describe("cleanWord", () => {
    it("strips punctuation from start and end", () => {
      expect(cleanWord("loops,")).toBe("loops");
      expect(cleanWord('"optimize"')).toBe("optimize");
      expect(cleanWord("latency.")).toBe("latency");
      expect(cleanWord("...database!?")).toBe("database");
    });

    it("lowercases the word", () => {
      expect(cleanWord("Loops")).toBe("loops");
      expect(cleanWord("DATABASE")).toBe("database");
    });
  });

  describe("getCandidateStems", () => {
    it("generates regular plural stems (-s)", () => {
      const stems = getCandidateStems("loops");
      expect(stems).toContain("loop");
    });

    it("generates -ies -> -y stems", () => {
      const stems = getCandidateStems("queries");
      expect(stems).toContain("query");
    });

    it("generates past tense stems (-ed)", () => {
      const stems = getCandidateStems("optimized");
      expect(stems).toContain("optimize");
    });

    it("generates gerund stems (-ing)", () => {
      const stems = getCandidateStems("optimizing");
      expect(stems).toContain("optimize");
    });

    it("generates adverb stems (-ly)", () => {
      const stems = getCandidateStems("quickly");
      expect(stems).toContain("quick");
    });
  });

  describe("getWordTranslation", () => {
    it("translates loops to 循環 (user's explicit requirement)", () => {
      expect(getWordTranslation("loops")).toBe("循環");
      expect(getWordTranslation("loop")).toBe("循環");
      expect(getWordTranslation("Loops,")).toBe("循環");
    });

    it("translates tech vocabulary accurately", () => {
      expect(getWordTranslation("query")).toBe("照会(クエリ)");
      expect(getWordTranslation("queries")).toBe("照会群");
      expect(getWordTranslation("database")).toBe("データベース");
      expect(getWordTranslation("databases")).toBe("データベース群");
      expect(getWordTranslation("latency")).toBe("遅延時間");
      expect(getWordTranslation("optimize")).toBe("最適化する");
      expect(getWordTranslation("optimized")).toBe("最適化された");
      expect(getWordTranslation("optimizing")).toBe("最適化中");
    });

    it("translates business vocabulary accurately", () => {
      expect(getWordTranslation("revenue")).toBe("売上高");
      expect(getWordTranslation("profit")).toBe("利益");
      expect(getWordTranslation("quarterly")).toBe("四半期の");
      expect(getWordTranslation("stakeholder")).toBe("利害関係者");
    });

    it("translates marketing vocabulary accurately", () => {
      expect(getWordTranslation("campaign")).toBe("広告施策(キャンペーン)");
      expect(getWordTranslation("conversion")).toBe("成約(コンバージョン)");
      expect(getWordTranslation("retention")).toBe("顧客継続率");
    });

    it("translates daily conversation vocabulary accurately", () => {
      expect(getWordTranslation("weather")).toBe("天気");
      expect(getWordTranslation("commute")).toBe("通勤・通学");
      expect(getWordTranslation("coffee")).toBe("コーヒー");
    });

    it("handles number and clean fallback for unknown terms", () => {
      expect(getWordTranslation("123")).toBe("123");
      expect(getWordTranslation("xyzunlistedword")).toBe("訳: xyzunlistedword");
    });
  });
});
