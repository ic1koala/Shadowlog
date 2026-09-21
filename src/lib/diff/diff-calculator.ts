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

/**
 * Compares the expected original sentence and the user's spoken transcription,
 * producing word-level diff tokens, count metrics, and an accuracy score.
 */
export function calculateDiff(originalText: string, spokenText: string): DiffResult {
  const origTokens = tokenizeSentence(originalText);
  const spokenTokens = tokenizeSentence(spokenText);

  const origNormalized = origTokens.map(normalizeWord);
  const spokenNormalized = spokenTokens.map(normalizeWord);

  const n = origTokens.length;
  const m = spokenTokens.length;

  // Edge cases
  if (n === 0 && m === 0) {
    return {
      tokens: [],
      originalText,
      spokenText,
      originalWordCount: 0,
      spokenWordCount: 0,
      matchedWordCount: 0,
      accuracyScore: 100,
    };
  }

  if (n === 0) {
    const tokens: DiffToken[] = spokenTokens.map((w) => ({
      word: w,
      spokenWord: w,
      status: "extra",
      similarity: 0,
    }));
    return {
      tokens,
      originalText,
      spokenText,
      originalWordCount: 0,
      spokenWordCount: countWords(spokenText),
      matchedWordCount: 0,
      accuracyScore: 0,
    };
  }

  if (m === 0) {
    const tokens: DiffToken[] = origTokens.map((w) => ({
      word: w,
      expectedWord: w,
      status: "missing",
      similarity: 0,
    }));
    return {
      tokens,
      originalText,
      spokenText,
      originalWordCount: countWords(originalText),
      spokenWordCount: 0,
      matchedWordCount: 0,
      accuracyScore: 0,
    };
  }

  // Needleman-Wunsch sequence alignment on word tokens
  const MATCH_SCORE = 3;
  const GAP_PENALTY = -2;

  // DP table for alignment scores
  const score: number[][] = Array.from({ length: n + 1 }, () =>
    Array(m + 1).fill(0)
  );

  for (let i = 0; i <= n; i++) {
    score[i]![0] = i * GAP_PENALTY;
  }
  for (let j = 0; j <= m; j++) {
    score[0]![j] = j * GAP_PENALTY;
  }

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const origWord = origNormalized[i - 1]!;
      const spokenWord = spokenNormalized[j - 1]!;
      const sim = wordSimilarity(origWord, spokenWord);

      let alignScore: number;
      if (sim === 1.0) {
        alignScore = MATCH_SCORE;
      } else if (sim >= 0.7) {
        // High similarity (slight pronunciation or typo mismatch)
        alignScore = 1.0;
      } else {
        // Total mismatch
        alignScore = -2.5;
      }

      const matchOption = score[i - 1]![j - 1]! + alignScore;
      const deleteOption = score[i - 1]![j]! + GAP_PENALTY; // missing in spoken
      const insertOption = score[i]![j - 1]! + GAP_PENALTY; // extra in spoken

      score[i]![j] = Math.max(matchOption, deleteOption, insertOption);
    }
  }

  // Backtrack to find aligned tokens
  let i = n;
  let j = m;
  const alignedPairs: Array<{
    origIndex: number | null;
    spokenIndex: number | null;
  }> = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0) {
      const origWord = origNormalized[i - 1]!;
      const spokenWord = spokenNormalized[j - 1]!;
      const sim = wordSimilarity(origWord, spokenWord);

      let alignScore: number;
      if (sim === 1.0) {
        alignScore = MATCH_SCORE;
      } else if (sim >= 0.7) {
        alignScore = 1.0;
      } else {
        alignScore = -2.5;
      }

      const current = score[i]![j];
      if (current === score[i - 1]![j - 1]! + alignScore) {
        alignedPairs.unshift({ origIndex: i - 1, spokenIndex: j - 1 });
        i--;
        j--;
        continue;
      }
    }

    if (i > 0 && (j === 0 || score[i]![j] === score[i - 1]![j]! + GAP_PENALTY)) {
      alignedPairs.unshift({ origIndex: i - 1, spokenIndex: null });
      i--;
    } else {
      alignedPairs.unshift({ origIndex: null, spokenIndex: j - 1 });
      j--;
    }
  }

  // Build DiffToken array
  const tokens: DiffToken[] = [];
  let matchedWordCount = 0;
  let partialMatchCount = 0;

  for (const pair of alignedPairs) {
    if (pair.origIndex !== null && pair.spokenIndex !== null) {
      const origRaw = origTokens[pair.origIndex]!;
      const spokenRaw = spokenTokens[pair.spokenIndex]!;
      const sim = wordSimilarity(origRaw, spokenRaw);

      if (sim === 1.0) {
        tokens.push({
          word: origRaw,
          expectedWord: origRaw,
          spokenWord: spokenRaw,
          status: "match",
          similarity: 1.0,
        });
        matchedWordCount++;
      } else if (sim >= 0.7) {
        tokens.push({
          word: origRaw,
          expectedWord: origRaw,
          spokenWord: spokenRaw,
          status: "mismatch",
          similarity: sim,
        });
        partialMatchCount++;
      } else {
        // Break non-similar alignment into missing and extra
        tokens.push({
          word: origRaw,
          expectedWord: origRaw,
          status: "missing",
          similarity: 0,
        });
        tokens.push({
          word: spokenRaw,
          spokenWord: spokenRaw,
          status: "extra",
          similarity: 0,
        });
      }
    } else if (pair.origIndex !== null) {
      const origRaw = origTokens[pair.origIndex]!;
      tokens.push({
        word: origRaw,
        expectedWord: origRaw,
        status: "missing",
        similarity: 0,
      });
    } else if (pair.spokenIndex !== null) {
      const spokenRaw = spokenTokens[pair.spokenIndex]!;
      tokens.push({
        word: spokenRaw,
        spokenWord: spokenRaw,
        status: "extra",
        similarity: 0,
      });
    }
  }

  const originalWordCount = countWords(originalText);
  const spokenWordCount = countWords(spokenText);

  // Calculate accuracy score (0-100)
  let rawScore = 0;
  if (originalWordCount > 0) {
    rawScore = ((matchedWordCount + partialMatchCount * 0.5) / originalWordCount) * 100;
  }
  const accuracyScore = Math.max(0, Math.min(100, Math.round(rawScore)));

  return {
    tokens,
    originalText,
    spokenText,
    originalWordCount,
    spokenWordCount,
    matchedWordCount,
    accuracyScore,
  };
}
