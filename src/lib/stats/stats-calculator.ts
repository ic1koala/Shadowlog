import { PracticeSession, UserStats } from "@/types";

/**
 * Returns a date string formatted as YYYY-MM-DD in local time.
 */
export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Normalizes a word for deduplication (lowercase, strip surrounding punctuation).
 */
export function normalizeWord(raw: string): string {
  return raw.toLowerCase().replace(/^[^\w]+|[^\w]+$/g, "");
}

/**
 * Calculates current streak, best streak, total unique words, and daily word counts from a list of sessions.
 */
export function calculateUserStats(
  sessions: PracticeSession[],
  referenceDate: Date = new Date()
): UserStats {
  if (!sessions || sessions.length === 0) {
    return {
      totalWords: 0,
      totalSessions: 0,
      currentStreak: 0,
      bestStreak: 0,
      dailyCounts: {},
    };
  }

  const uniqueWordsSet = new Set<string>();
  const dailyCounts: Record<string, number> = {};

  for (const session of sessions) {
    // 1. Accumulate daily word counts (activity volume)
    const sessionDate = new Date(session.createdAt);
    if (!isNaN(sessionDate.getTime())) {
      const key = formatDateKey(sessionDate);
      dailyCounts[key] = (dailyCounts[key] || 0) + session.matchedWordCount;
    }

    // 2. Extract unique matched/spoken words for deduplicated total words
    const stored = session as { diff?: { tokens?: Array<{ status: string; word: string }> } };
    if (stored.diff?.tokens && Array.isArray(stored.diff.tokens)) {
      for (const token of stored.diff.tokens) {
        if (token.status === "correct" && token.word) {
          const clean = normalizeWord(token.word);
          if (clean) uniqueWordsSet.add(clean);
        }
      }
    } else {
      // Fallback: match words between target sentence and actual transcription
      const targetWords = new Set(
        (session.sentence || "")
          .split(/\s+/)
          .map(normalizeWord)
          .filter((w) => w.length > 0)
      );
      const spokenWords = (session.transcription || "")
        .split(/\s+/)
        .map(normalizeWord)
        .filter((w) => w.length > 0);

      let matchedCount = 0;
      for (const word of spokenWords) {
        if (targetWords.has(word)) {
          uniqueWordsSet.add(word);
          matchedCount++;
        }
      }

      // If transcription was identical or empty fallback
      if (matchedCount === 0 && session.matchedWordCount > 0) {
        Array.from(targetWords)
          .slice(0, session.matchedWordCount)
          .forEach((w) => uniqueWordsSet.add(w));
      }
    }
  }

  const totalWords = uniqueWordsSet.size;

  // Sort unique dates in ascending order
  const uniqueDates = Object.keys(dailyCounts).sort();

  // Streak calculations
  const { currentStreak, bestStreak } = calculateStreaks(uniqueDates, referenceDate);

  const lastSession = [...sessions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )[0];

  return {
    totalWords,
    totalSessions: sessions.length,
    currentStreak,
    bestStreak,
    lastPracticedDate: lastSession ? lastSession.createdAt : undefined,
    dailyCounts,
  };
}

/**
 * Calculates streaks from an array of sorted unique date strings ('YYYY-MM-DD').
 */
export function calculateStreaks(
  sortedDates: string[],
  referenceDate: Date = new Date()
): { currentStreak: number; bestStreak: number } {
  if (sortedDates.length === 0) {
    return { currentStreak: 0, bestStreak: 0 };
  }

  const dateSet = new Set(sortedDates);
  const todayKey = formatDateKey(referenceDate);

  const yesterday = new Date(referenceDate);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = formatDateKey(yesterday);

  // 1. Current streak calculation
  let currentStreak = 0;
  let checkDate: Date;

  if (dateSet.has(todayKey)) {
    // Practiced today
    currentStreak = 1;
    checkDate = new Date(referenceDate);
    checkDate.setDate(checkDate.getDate() - 1);
  } else if (dateSet.has(yesterdayKey)) {
    // Practiced yesterday (streak still active today)
    currentStreak = 1;
    checkDate = new Date(yesterday);
    checkDate.setDate(checkDate.getDate() - 1);
  } else {
    // Streak broken
    currentStreak = 0;
    checkDate = new Date(referenceDate);
  }

  if (currentStreak > 0) {
    while (dateSet.has(formatDateKey(checkDate))) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }
  }

  // 2. Best streak calculation (max consecutive days in history)
  let bestStreak = 0;
  let runningStreak = 0;
  let prevDate: Date | null = null;

  for (const dateStr of sortedDates) {
    const [y, m, d] = dateStr.split("-").map(Number);
    const currentDate = new Date(y!, m! - 1, d!);

    if (!prevDate) {
      runningStreak = 1;
    } else {
      const diffDays = Math.round(
        (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (diffDays === 1) {
        runningStreak++;
      } else if (diffDays > 1) {
        runningStreak = 1;
      }
    }

    if (runningStreak > bestStreak) {
      bestStreak = runningStreak;
    }
    prevDate = currentDate;
  }

  return {
    currentStreak,
    bestStreak: Math.max(bestStreak, currentStreak),
  };
}
