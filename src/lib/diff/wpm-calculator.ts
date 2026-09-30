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

export type PlaybackSpeed = 0.6 | 1.0 | 1.2;

export interface PlaybackWpmMap {
  0.6: number;
  1.0: number;
  1.2: number;
}

export const DEFAULT_PLAYBACK_WPM_MAP: PlaybackWpmMap = {
  0.6: 75,
  1.0: 125,
  1.2: 150,
};

/**
 * Calculates dynamic effective WPM for model audio playback speeds (0.6x, 1.0x, 1.2x)
 * based on word count and audio duration in seconds.
 * If audio duration is not yet available, returns the default benchmark map (75 / 125 / 150 WPM).
 */
export function calculatePlaybackWpmMap(
  wordCount: number,
  durationSeconds?: number | null
): PlaybackWpmMap {
  if (
    durationSeconds &&
    isFinite(durationSeconds) &&
    durationSeconds > 0 &&
    wordCount > 0
  ) {
    const baseWpm = Math.round((wordCount / durationSeconds) * 60);
    return {
      0.6: Math.max(30, Math.min(300, Math.round(baseWpm * 0.6))),
      1.0: Math.max(40, Math.min(350, baseWpm)),
      1.2: Math.max(50, Math.min(400, Math.round(baseWpm * 1.2))),
    };
  }

  return DEFAULT_PLAYBACK_WPM_MAP;
}

