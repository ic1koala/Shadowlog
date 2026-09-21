import {
  DifficultyLevel,
  Industry,
  DiffResult,
  CoachFeedback,
  WeakWord,
  StoredSession,
  UserPlanType,
  PracticeMode,
} from "@/types";

// LocalStorage Keys
const KEY_PLAN = "shadowlog_user_plan";
const KEY_WEAK_WORDS = "shadowlog_weak_words";
const KEY_STORED_SESSIONS = "shadowlog_stored_sessions";

// Freemium limits for guest / trial users
export const GUEST_MAX_WEAK_WORDS = 5;
export const GUEST_MAX_SESSIONS = 3;

/**
 * Normalizes a word for indexing (lowercase, stripped of punctuation).
 */
export function normalizeWord(raw: string): string {
  return raw.toLowerCase().replace(/^[^\w]+|[^\w]+$/g, "");
}

/**
 * Gets the user's current plan type.
 * Defaults to "guest" (trial version).
 */
export function getPlanType(): UserPlanType {
  if (typeof window === "undefined") return "guest";
  try {
    const saved = localStorage.getItem(KEY_PLAN) as UserPlanType;
    if (saved === "pro" || saved === "free" || saved === "guest") return saved;
  } catch {
    // ignore
  }
  return "guest";
}

/**
 * Sets the user plan type (e.g. "pro" upon upgrade or "guest").
 */
export function setPlanType(plan: UserPlanType): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY_PLAN, plan);
  } catch {
    // ignore
  }
}

/**
 * Loads all raw stored sessions from localStorage.
 */
function loadAllSessions(): StoredSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY_STORED_SESSIONS);
    if (!raw) return [];
    return JSON.parse(raw) as StoredSession[];
  } catch {
    return [];
  }
}

/**
 * Saves all sessions to localStorage.
 */
function saveAllSessions(sessions: StoredSession[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY_STORED_SESSIONS, JSON.stringify(sessions));
  } catch {
    // ignore
  }
}

/**
 * Loads all raw weak words from localStorage.
 */
function loadAllWeakWords(): WeakWord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY_WEAK_WORDS);
    if (!raw) return [];
    return JSON.parse(raw) as WeakWord[];
  } catch {
    return [];
  }
}

/**
 * Saves all weak words to localStorage.
 */
function saveAllWeakWords(words: WeakWord[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY_WEAK_WORDS, JSON.stringify(words));
  } catch {
    // ignore
  }
}

export interface RecordPracticeParams {
  sentence: string;
  japanese?: string;
  transcription: string;
  industry: Industry;
  level: DifficultyLevel;
  wordCount: number;
  matchedWordCount: number;
  accuracyScore: number;
  retryCount: number;
  diff: DiffResult;
  coachFeedback?: CoachFeedback;
  mode?: PracticeMode;
  wpm?: number;
}

/**
 * Records a practice session and automatically extracts & updates weak words.
 */
export function recordPracticeSession(params: RecordPracticeParams): {
  session: StoredSession;
  newWeakWords: WeakWord[];
} {
  const isCleared = params.accuracyScore >= 80;
  const now = new Date().toISOString();

  const newSession: StoredSession = {
    id: `session-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    sentence: params.sentence,
    japanese: params.japanese,
    transcription: params.transcription,
    industry: params.industry,
    level: params.level,
    wordCount: params.wordCount,
    matchedWordCount: params.matchedWordCount,
    accuracyScore: params.accuracyScore,
    isCleared,
    retryCount: params.retryCount,
    diff: params.diff,
    coachFeedback: params.coachFeedback,
    mode: params.mode || "sentence",
    wpm: params.wpm,
    createdAt: now,
  };

  // 1. Save Session
  const allSessions = loadAllSessions();
  allSessions.unshift(newSession);
  saveAllSessions(allSessions);

  // 2. Extract and Update Weak Words
  const allWeakWords = loadAllWeakWords();
  const newlyAdded: WeakWord[] = [];

  // Extract mistakes from tokens
  for (const token of params.diff.tokens) {
    if (token.status === "missing" || token.status === "mismatch") {
      const cleanWord = normalizeWord(token.word);
      if (!cleanWord || cleanWord.length <= 1) continue; // skip single letters like 'a'

      const existingIndex = allWeakWords.findIndex(
        (w) => normalizeWord(w.word) === cleanWord
      );

      if (existingIndex !== -1) {
        // Update existing mistake
        const existing = allWeakWords[existingIndex]!;
        existing.errorCount += 1;
        existing.lastPracticedAt = now;
        existing.sentence = params.sentence;
        existing.japanese = params.japanese;
        existing.industry = params.industry;
        existing.level = params.level;
        existing.type = token.status;
        existing.mastered = false; // re-open if made mistake again
        if (token.status === "mismatch" && token.spokenWord) {
          existing.spokenWord = token.spokenWord;
        }
      } else {
        // Add new weak word
        const newWord: WeakWord = {
          id: `weak-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          word: token.word,
          type: token.status,
          spokenWord: token.spokenWord,
          sentence: params.sentence,
          japanese: params.japanese,
          industry: params.industry,
          level: params.level,
          errorCount: 1,
          mastered: false,
          lastPracticedAt: now,
        };
        allWeakWords.unshift(newWord);
        newlyAdded.push(newWord);
      }
    }
  }

  saveAllWeakWords(allWeakWords);

  return {
    session: newSession,
    newWeakWords: newlyAdded,
  };
}

/**
 * Retrieves stored weak words, respecting freemium trial limits.
 */
export function getWeakWords(): {
  words: WeakWord[];
  totalCount: number;
  isLimited: boolean;
  limit: number;
  plan: UserPlanType;
} {
  const plan = getPlanType();
  const all = loadAllWeakWords();
  const isPro = plan === "pro";

  const isLimited = !isPro && all.length > GUEST_MAX_WEAK_WORDS;
  const words = isPro ? all : all.slice(0, GUEST_MAX_WEAK_WORDS);

  return {
    words,
    totalCount: all.length,
    isLimited,
    limit: GUEST_MAX_WEAK_WORDS,
    plan,
  };
}

/**
 * Retrieves stored sessions, respecting freemium trial limits.
 */
export function getStoredSessions(): {
  sessions: StoredSession[];
  totalCount: number;
  clearedCount: number;
  needsReviewCount: number;
  isLimited: boolean;
  limit: number;
  plan: UserPlanType;
} {
  const plan = getPlanType();
  const all = loadAllSessions();
  const isPro = plan === "pro";

  const clearedCount = all.filter((s) => s.isCleared).length;
  const needsReviewCount = all.filter((s) => !s.isCleared).length;

  const isLimited = !isPro && all.length > GUEST_MAX_SESSIONS;
  const sessions = isPro ? all : all.slice(0, GUEST_MAX_SESSIONS);

  return {
    sessions,
    totalCount: all.length,
    clearedCount,
    needsReviewCount,
    isLimited,
    limit: GUEST_MAX_SESSIONS,
    plan,
  };
}

/**
 * Toggles the "mastered" status of a weak word.
 */
export function toggleMasteredWeakWord(id: string): boolean {
  const all = loadAllWeakWords();
  const target = all.find((w) => w.id === id);
  if (!target) return false;

  target.mastered = !target.mastered;
  saveAllWeakWords(all);
  return target.mastered;
}

/**
 * Deletes a weak word from the notebook.
 */
export function deleteWeakWord(id: string): void {
  const all = loadAllWeakWords().filter((w) => w.id !== id);
  saveAllWeakWords(all);
}

/**
 * Clears all local learning data (for testing or reset).
 */
export function clearAllLearningData(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(KEY_WEAK_WORDS);
    localStorage.removeItem(KEY_STORED_SESSIONS);
  } catch {
    // ignore
  }
}
