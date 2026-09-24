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
  | "finance"
  | "medical"
  | "marketing"
  | "daily";

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
  createdAt: string;
}

export type UserPlanType = "guest" | "free" | "base" | "pro";

export interface WeakWord {
  id: string;
  word: string;
  type: "missing" | "mismatch";
  spokenWord?: string; // 誤読時に認識された音
  sentence: string; // 出現した例文
  japanese?: string; // 日本語訳
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
