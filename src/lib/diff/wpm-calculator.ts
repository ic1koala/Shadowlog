import { WPMInfo } from "@/types";

/**
 * Calculates Words Per Minute (WPM) and provides speech pacing evaluation.
 *
 * Typical benchmarks:
 * - < 110 WPM: Deliberate / Slow (Good for beginners practicing articulation)
 * - 110 - 140 WPM: Natural business conversation pace
 * - 141 - 170 WPM: Fluent native presentation / news broadcast pace
 * - > 170 WPM: Rapid speech
 */
export function calculateWPM(spokenWordCount: number, durationSeconds: number): WPMInfo {
  // Prevent division by zero or negative durations
  const safeDuration = Math.max(1, durationSeconds);
  const wpm = Math.round((spokenWordCount / safeDuration) * 60);

  let rating: "slow" | "natural" | "fluent" | "fast";
  let label: string;

  if (wpm < 110) {
    rating = "slow";
    label = "丁寧・ゆったりペース";
  } else if (wpm <= 140) {
    rating = "natural";
    label = "自然な会話ペース (標準)";
  } else if (wpm <= 170) {
    rating = "fluent";
    label = "流暢なスピーチペース (ネイティブ級)";
  } else {
    rating = "fast";
    label = "ハイテンポ・早口ペース";
  }

  return {
    wpm,
    durationSeconds: Math.round(safeDuration),
    rating,
    label,
  };
}
