import { DiffResult, DiffToken } from "@/types";

/**
 * Normalizes a word for comparison: converts to lowercase and strips punctuation.
 */
export function normalizeWord(word: string): string {
  return word
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/^[^\w']+|[^\w']+$/g, "")
    .trim();
}

/**
 * Splits a sentence into words while preserving original tokens.
 */
export function tokenizeSentence(text: string): string[] {
  if (!text || text.trim() === "") {
    return [];
  }
  return text.trim().split(/\s+/);
}

/**
 * Calculates the Levenshtein distance between two strings.
 */
export function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const dp: number[][] = Array.from({ length: a.length + 1 }, () =>
    Array(b.length + 1).fill(0)
  );

  for (let i = 0; i <= a.length; i++) {
    dp[i]![0] = i;
  }
  for (let j = 0; j <= b.length; j++) {
    dp[0]![j] = j;
  }

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i]![j] = Math.min(
        dp[i - 1]![j]! + 1, // deletion
        dp[i]![j - 1]! + 1, // insertion
        dp[i - 1]![j - 1]! + cost // substitution
      );
    }
  }

  return dp[a.length]![b.length]!;
}

/**
 * Returns similarity ratio between 0.0 and 1.0.
 */
export function wordSimilarity(a: string, b: string): number {
  const normA = normalizeWord(a);
  const normB = normalizeWord(b);

  if (normA === normB) return 1.0;
  if (normA.length === 0 || normB.length === 0) return 0.0;

  const dist = levenshteinDistance(normA, normB);
  const maxLen = Math.max(normA.length, normB.length);
  return Math.max(0, 1 - dist / maxLen);
}

/**
 * Counts non-empty words in a given text.
 */
export function countWords(text: string): number {
  return tokenizeSentence(text).filter((w) => normalizeWord(w).length > 0).length;
}

import {
  calculateTemporalDiff,
  TemporalAlignmentOptions,
  SpokenWordTiming,
} from "./temporal-alignment";

export type { TemporalAlignmentOptions, SpokenWordTiming };
export { calculateTemporalDiff };

/**
 * Compares the expected original sentence and the user's spoken transcription,
 * producing word-level diff tokens, count metrics, and an accuracy score.
 * Supports optional word timestamps and audio duration for precise forced temporal alignment.
 */
export function calculateDiff(
  originalText: string,
  spokenText: string,
  options?: TemporalAlignmentOptions
): DiffResult {
  return calculateTemporalDiff(originalText, spokenText, options);
}
