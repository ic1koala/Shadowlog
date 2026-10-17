import { DiffResult, DiffToken } from "@/types";
import {
  tokenizeSentence,
  normalizeWord,
  wordSimilarity,
  countWords,
} from "./diff-calculator";

export interface SpokenWordTiming {
  word: string;
  start: number;
  end: number;
}

export interface TemporalAlignmentOptions {
  spokenWordsWithTime?: SpokenWordTiming[];
  audioDuration?: number;
  strictThreshold?: boolean;
}

/**
 * Minimum realistic duration for an articulated English word in spoken speech.
 * Even quick functional monosyllables ("to", "a", "the") require ~75ms-100ms.
 * Words under 70ms are almost always hallucinated phantom tokens or swallowed sounds.
 */
const MIN_ARTICULATION_DURATION_SEC = 0.075;

/**
 * Performs temporal alignment between expected original text and spoken audio words,
 * checking monotonic progression, word duration sanity, and speech span coverage.
 */
export function calculateTemporalDiff(
  originalText: string,
  spokenText: string,
  options?: TemporalAlignmentOptions
): DiffResult {
  const origTokens = tokenizeSentence(originalText);
  const spokenTokens = tokenizeSentence(spokenText);

  const origNormalized = origTokens.map(normalizeWord);
  const spokenNormalized = spokenTokens.map(normalizeWord);

  const n = origTokens.length;
  const m = spokenTokens.length;

  const timings = options?.spokenWordsWithTime;
  const totalDuration = Math.max(
    options?.audioDuration || 0,
    timings && timings.length > 0 ? timings[timings.length - 1]?.end || 0 : 0
  );

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
    const tokens: DiffToken[] = spokenTokens.map((w, idx) => {
      const timing = timings?.[idx];
      return {
        word: w,
        spokenWord: w,
        status: "extra",
        similarity: 0,
        start: timing?.start,
        end: timing?.end,
        duration: timing ? Math.max(0, timing.end - timing.start) : undefined,
      };
    });
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

  // Pre-calculate timing features for spoken tokens if available
  const spokenDurations = spokenTokens.map((_, idx) => {
    const t = timings?.[idx];
    return t ? Math.max(0, t.end - t.start) : undefined;
  });

  const spokenMidpoints = spokenTokens.map((_, idx) => {
    const t = timings?.[idx];
    return t ? (t.start + t.end) / 2 : undefined;
  });

  // Dynamic Programming Table for Needleman-Wunsch Alignment with Temporal Penalties
  const MATCH_SCORE = 3.0;
  const GAP_PENALTY = -2.0;

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
      } else if (sim >= 0.82) {
        // High similarity: minor inflection, typo, or close phonetic variation
        alignScore = 1.8;
      } else if (sim >= 0.70) {
        // Partial phonetic match (stricter penalty than old 1.0)
        alignScore = 0.2;
      } else {
        // Total mismatch
        alignScore = -3.0;
      }

      // Temporal penalty if timings are provided
      if (totalDuration > 0 && spokenMidpoints[j - 1] !== undefined) {
        const expectedRelPos = (i - 0.5) / n;
        const actualRelPos = Math.min(
          1.0,
          Math.max(0.0, spokenMidpoints[j - 1]! / totalDuration)
        );
        const timeDiff = Math.abs(expectedRelPos - actualRelPos);

        // If word is spoken severely out of order (> 35% time offset)
        if (timeDiff > 0.35) {
          alignScore -= (timeDiff - 0.35) * 4.0;
        }

        // Duration sanity check: swallowed or phantom word
        const dur = spokenDurations[j - 1];
        if (dur !== undefined && dur < MIN_ARTICULATION_DURATION_SEC) {
          alignScore -= 1.5;
        }
      }

      const matchOption = score[i - 1]![j - 1]! + alignScore;
      const deleteOption = score[i - 1]![j]! + GAP_PENALTY;
      const insertOption = score[i]![j - 1]! + GAP_PENALTY;

      score[i]![j] = Math.max(matchOption, deleteOption, insertOption);
    }
  }

  // Backtrack to find aligned pairs
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
      if (sim === 1.0) alignScore = MATCH_SCORE;
      else if (sim >= 0.82) alignScore = 1.8;
      else if (sim >= 0.70) alignScore = 0.2;
      else alignScore = -3.0;

      if (totalDuration > 0 && spokenMidpoints[j - 1] !== undefined) {
        const expectedRelPos = (i - 0.5) / n;
        const actualRelPos = Math.min(
          1.0,
          Math.max(0.0, spokenMidpoints[j - 1]! / totalDuration)
        );
        const timeDiff = Math.abs(expectedRelPos - actualRelPos);
        if (timeDiff > 0.35) alignScore -= (timeDiff - 0.35) * 4.0;
        const dur = spokenDurations[j - 1];
        if (dur !== undefined && dur < MIN_ARTICULATION_DURATION_SEC) {
          alignScore -= 1.5;
        }
      }

      const current = score[i]![j]!;
      if (Math.abs(current - (score[i - 1]![j - 1]! + alignScore)) < 1e-9) {
        alignedPairs.unshift({ origIndex: i - 1, spokenIndex: j - 1 });
        i--;
        j--;
        continue;
      }
    }

    if (
      i > 0 &&
      (j === 0 || Math.abs(score[i]![j]! - (score[i - 1]![j]! + GAP_PENALTY)) < 1e-9)
    ) {
      alignedPairs.unshift({ origIndex: i - 1, spokenIndex: null });
      i--;
    } else {
      alignedPairs.unshift({ origIndex: null, spokenIndex: j - 1 });
      j--;
    }
  }

  // Build DiffToken array & calculate credits
  const tokens: DiffToken[] = [];
  let matchedWordCount = 0;
  let totalMatchCredit = 0;

  for (const pair of alignedPairs) {
    if (pair.origIndex !== null && pair.spokenIndex !== null) {
      const origRaw = origTokens[pair.origIndex]!;
      const spokenRaw = spokenTokens[pair.spokenIndex]!;
      const sim = wordSimilarity(origRaw, spokenRaw);

      const timing = timings?.[pair.spokenIndex];
      const dur = spokenDurations[pair.spokenIndex];
      const isSwallowed =
        dur !== undefined && dur < MIN_ARTICULATION_DURATION_SEC;

      // Threshold: 0.82 for close match
      if (sim === 1.0 && !isSwallowed) {
        tokens.push({
          word: origRaw,
          expectedWord: origRaw,
          spokenWord: spokenRaw,
          status: "match",
          similarity: 1.0,
          start: timing?.start,
          end: timing?.end,
          duration: dur,
        });
        matchedWordCount++;
        totalMatchCredit += 1.0;
      } else if (sim >= 0.82 && !isSwallowed) {
        tokens.push({
          word: origRaw,
          expectedWord: origRaw,
          spokenWord: spokenRaw,
          status: "mismatch",
          similarity: sim,
          start: timing?.start,
          end: timing?.end,
          duration: dur,
        });
        // High similarity receives partial credit (0.4)
        totalMatchCredit += 0.4;
      } else if (sim >= 0.82 && isSwallowed) {
        // Swallowed word (hallucination / unarticulated)
        tokens.push({
          word: origRaw,
          expectedWord: origRaw,
          spokenWord: spokenRaw,
          status: "mismatch",
          similarity: 0.3,
          start: timing?.start,
          end: timing?.end,
          duration: dur,
          isTimingAnomaly: true,
        });
        totalMatchCredit += 0.1;
      } else {
        // Break mismatch into missing and extra
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
          start: timing?.start,
          end: timing?.end,
          duration: dur,
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
      const timing = timings?.[pair.spokenIndex];
      const dur = spokenDurations[pair.spokenIndex];
      tokens.push({
        word: spokenRaw,
        spokenWord: spokenRaw,
        status: "extra",
        similarity: 0,
        start: timing?.start,
        end: timing?.end,
        duration: dur,
      });
    }
  }

  const originalWordCount = countWords(originalText);
  const spokenWordCount = countWords(spokenText);

  // Active Speech Span Coverage Check
  let coverageRate = 1.0;
  if (timings && timings.length >= 2 && totalDuration > 0) {
    const firstWordStart = timings[0]?.start ?? 0;
    const lastWordEnd = timings[timings.length - 1]?.end ?? totalDuration;
    const activeSpan = Math.max(0.5, lastWordEnd - firstWordStart);

    // Expected minimum span for N words at 180 WPM (3 words/sec) with 35% margin
    const minExpectedSpan = (originalWordCount / 3.0) * 0.65;
    if (minExpectedSpan > 1.5 && activeSpan < minExpectedSpan) {
      coverageRate = Math.max(0.3, Math.min(1.0, activeSpan / minExpectedSpan));
    }
  }

  // Extra words penalty (prevents rambling / hallucination gaming)
  const extraWordCount = tokens.filter((t) => t.status === "extra").length;
  const extraPenalty = Math.min(15, extraWordCount * 1.5);

  let rawScore = 0;
  if (originalWordCount > 0) {
    const baseAccuracy = (totalMatchCredit / originalWordCount) * 100;
    rawScore = Math.max(0, (baseAccuracy - extraPenalty) * coverageRate);
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
    speechCoverageRate: coverageRate,
    temporalScore: Math.round(coverageRate * 100),
  };
}
