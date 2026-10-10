export type DiffStatus = "match" | "missing" | "extra" | "mismatch";

export interface DiffToken {
  word: string;
  expectedWord?: string;
  spokenWord?: string;
  status: DiffStatus;
  similarity?: number; // 0.0 to 1.0
}

export interface DiffResult {
  tokens: DiffToken[];
  originalText: string;
  spokenText: string;
  originalWordCount: number;
  spokenWordCount: number;
  matchedWordCount: number;
  accuracyScore: number; // 0 to 100
}

export type DifficultyLevel = "beginner" | "intermediate" | "advanced";

export type Industry =
  | "tech"
  | "business"
  | "marketing"
  | "daily";

export const VALID_INDUSTRIES: Industry[] = [
  "tech",
  "business",
  "marketing",
  "daily",
];

/**
 * Normalizes raw or legacy industry strings ("finance", "medical") into the 4 active genres.
 */
export function normalizeIndustry(input?: string | null): Industry {
  if (!input) return "tech";
  if (input === "finance") return "business";
  if (input === "medical") return "daily";
  if ((VALID_INDUSTRIES as string[]).includes(input)) {
    return input as Industry;
  }
  return "tech";
}

export type PracticeMode = "sentence" | "passage";

export interface WPMInfo {
  wpm: number;
  durationSeconds: number;
  rating: "slow" | "natural" | "fluent" | "fast";
  label: string;
}

export interface SentenceRequest {
  industry: Industry;
  level: DifficultyLevel;
  topic?: string;
  mode?: PracticeMode;
}

export interface SentenceResponse {
  id: string;
  english: string;
  japanese: string;
  audioBase64?: string;
  wordCount: number;
  industry: Industry;
  level: DifficultyLevel;
  mode?: PracticeMode;
}

export interface TranscribeDiffRequest {
  audioBase64?: string;
  originalText: string;
  durationSeconds?: number;
  mode?: PracticeMode;
}

export interface CoachFeedback {
  overallComment: string; // コーチからの全体講評（称賛・総括）
  pronunciationAdvice: string; // 音声変化・リンキング・脱落に関する的確な指導
  retryFocusPoint: string; // 次回復習・リトライ時に意識すべきワンポイント
  pacingAdvice?: string; // 長文時の話速・息継ぎ（チャンキング）に関する指導
}

export interface TranscribeDiffResponse {
  transcription: string;
  diff: DiffResult;
  coachFeedback?: CoachFeedback;
  wpmInfo?: WPMInfo;
}

export interface PracticeSession {
  id: string;
  userId?: string;
  sentenceId?: string;
  sentence: string;
  transcription: string;
  wordCount: number;
  matchedWordCount: number;
  accuracyScore: number;
  wpm?: number;
  createdAt: string;
}

export type UserPlanType = "guest" | "free" | "base" | "pro";

export interface WeakWord {
  id: string;
  word: string;
  type: "missing" | "mismatch" | "looked_up";
  spokenWord?: string; // 誤読時に認識された音
  sentence: string; // 出現した例文
  japanese?: string; // 日本語訳
  wordMeaning?: string; // 単語固有の日本語訳（調べた単語帳用）
  industry: Industry;
  level: DifficultyLevel;
  errorCount: number; // つまずいた回数
  mastered: boolean; // 克服済みフラグ
  lastPracticedAt: string;
}

export interface StoredSession extends PracticeSession {
  japanese?: string;
  industry: Industry;
  level: DifficultyLevel;
  mode?: PracticeMode;
  wpm?: number;
  isCleared: boolean; // スコア80%以上でtrue
  retryCount: number;
  diff?: DiffResult;
  coachFeedback?: CoachFeedback;
}

export interface UserStats {
  totalWords: number;
  totalSessions: number;
  currentStreak: number;
  bestStreak: number;
  lastPracticedDate?: string;
  dailyCounts: Record<string, number>; // YYYY-MM-DD: count
}

export type AnnouncementCategory = "update" | "important" | "campaign" | "notice";

export interface Announcement {
  id: string;
  title: string;
  category: AnnouncementCategory;
  tagText: string;
  publishedAt: string;
  coverImages?: string[];
  summary: string;
  content: string;
  actionUrl?: string;
  actionText?: string;
}

