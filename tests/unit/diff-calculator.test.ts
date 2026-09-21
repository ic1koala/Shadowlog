import { describe, it, expect } from "vitest";
import {
  calculateDiff,
  normalizeWord,
  levenshteinDistance,
  wordSimilarity,
  countWords,
} from "@/lib/diff/diff-calculator";

describe("diff-calculator unit tests", () => {
  describe("normalizeWord", () => {
    it("converts to lowercase and strips outer punctuation", () => {
      expect(normalizeWord("Hello,")).toBe("hello");
      expect(normalizeWord('"World!"')).toBe("world");
      expect(normalizeWord("don't")).toBe("don't");
      expect(normalizeWord("user’s")).toBe("user's");
    });
  });

  describe("levenshteinDistance & wordSimilarity", () => {
    it("calculates exact distance", () => {
      expect(levenshteinDistance("kitten", "sitting")).toBe(3);
      expect(levenshteinDistance("test", "test")).toBe(0);
      expect(levenshteinDistance("", "abc")).toBe(3);
    });

    it("calculates similarity ratio correctly", () => {
      expect(wordSimilarity("hello", "hello")).toBe(1.0);
      expect(wordSimilarity("color", "colour")).toBeGreaterThan(0.7);
      expect(wordSimilarity("xyz", "abc")).toBe(0.0);
      expect(wordSimilarity("cat", "elephant")).toBeLessThan(0.3);
    });
  });

  describe("countWords", () => {
    it("accurately counts non-empty words in text", () => {
      expect(countWords("")).toBe(0);
      expect(countWords("   ")).toBe(0);
      expect(countWords("Hello world")).toBe(2);
      expect(countWords("The quick brown fox jumps over the lazy dog.")).toBe(9);
    });
  });

  describe("calculateDiff - Boundary & Edge cases", () => {
    it("handles both empty strings", () => {
      const result = calculateDiff("", "");
      expect(result.tokens).toEqual([]);
      expect(result.originalWordCount).toBe(0);
      expect(result.spokenWordCount).toBe(0);
      expect(result.matchedWordCount).toBe(0);
      expect(result.accuracyScore).toBe(100);
    });

    it("handles non-empty original with empty spoken (all missing)", () => {
      const result = calculateDiff("We need to optimize the database query.", "");
      expect(result.originalWordCount).toBe(7);
      expect(result.spokenWordCount).toBe(0);
      expect(result.matchedWordCount).toBe(0);
      expect(result.accuracyScore).toBe(0);
      expect(result.tokens.every((t) => t.status === "missing")).toBe(true);
    });

    it("handles empty original with non-empty spoken (all extra)", () => {
      const result = calculateDiff("", "Just speaking random words");
      expect(result.originalWordCount).toBe(0);
      expect(result.spokenWordCount).toBe(4);
      expect(result.matchedWordCount).toBe(0);
      expect(result.accuracyScore).toBe(0);
      expect(result.tokens.every((t) => t.status === "extra")).toBe(true);
    });
  });

  describe("calculateDiff - Accuracy & Alignment", () => {
    it("matches exact spoken sentences with 100% accuracy", () => {
      const original = "Our cloud infrastructure handles millions of requests daily.";
      const spoken = "Our cloud infrastructure handles millions of requests daily.";
      const result = calculateDiff(original, spoken);

      expect(result.matchedWordCount).toBe(8);
      expect(result.accuracyScore).toBe(100);
      expect(result.tokens.every((t) => t.status === "match")).toBe(true);
    });

    it("matches case-insensitively and ignores punctuation differences", () => {
      const original = "Artificial Intelligence, is transforming modern healthcare!";
      const spoken = "artificial intelligence is transforming modern healthcare";
      const result = calculateDiff(original, spoken);

      expect(result.matchedWordCount).toBe(6);
      expect(result.accuracyScore).toBe(100);
      expect(result.tokens.every((t) => t.status === "match")).toBe(true);
    });

    it("handles complete mismatch gracefully", () => {
      const original = "Deploying the Kubernetes cluster to production.";
      const spoken = "Banana pineapple orange strawberry watermelon";
      const result = calculateDiff(original, spoken);

      expect(result.matchedWordCount).toBe(0);
      expect(result.accuracyScore).toBe(0);
    });

    it("identifies missing words correctly", () => {
      const original = "Please submit the quarterly financial report by Friday.";
      const spoken = "Please submit quarterly report by Friday.";
      const result = calculateDiff(original, spoken);

      expect(result.originalWordCount).toBe(8);
      expect(result.spokenWordCount).toBe(6);
      expect(result.matchedWordCount).toBe(6);

      const missing = result.tokens.filter((t) => t.status === "missing");
      expect(missing.map((m) => m.word.toLowerCase())).toContain("the");
      expect(missing.map((m) => m.word.toLowerCase())).toContain("financial");
    });

    it("identifies extra words correctly", () => {
      const original = "The system is functioning normally.";
      const spoken = "Actually the system is functioning very normally today.";
      const result = calculateDiff(original, spoken);

      const extraTokens = result.tokens.filter((t) => t.status === "extra");
      expect(extraTokens.length).toBeGreaterThan(0);
      expect(result.matchedWordCount).toBe(5);
    });

    it("detects pronunciation / minor spelling mismatches", () => {
      const original = "We should analyze the customer feedback.";
      const spoken = "We should analyse the customer feedback.";
      const result = calculateDiff(original, spoken);

      // analyze vs analyse is high similarity (> 0.7)
      const mismatchToken = result.tokens.find((t) => t.word.toLowerCase() === "analyze");
      expect(mismatchToken?.status).toBe("mismatch");
      expect(result.accuracyScore).toBeGreaterThan(80);
    });

    it("accurately handles long complex sentences", () => {
      const original =
        "The architecture consists of decoupled microservices communicating through asynchronous message queues, ensuring high availability, fault tolerance, and seamless scalability under peak traffic loads.";
      const spoken =
        "The architecture consists of decoupled microservices communicating through message queues, ensuring high availability, fault tolerance, and scalability under peak loads.";
      const result = calculateDiff(original, spoken);

      expect(result.originalWordCount).toBe(23);
      expect(result.spokenWordCount).toBe(20);
      expect(result.matchedWordCount).toBe(20);
      expect(result.accuracyScore).toBeGreaterThan(80);
    });
  });
});
