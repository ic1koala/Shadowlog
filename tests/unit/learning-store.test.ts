import { describe, it, expect, beforeEach } from "vitest";
import {
  recordPracticeSession,
  getWeakWords,
  getStoredSessions,
  toggleMasteredWeakWord,
  deleteWeakWord,
  setPlanType,
  clearAllLearningData,
  GUEST_MAX_WEAK_WORDS,
  GUEST_MAX_SESSIONS,
  normalizeWord,
} from "@/lib/storage/user-learning-store";
import { DiffResult } from "@/types";

describe("User Learning Store (Weak Words & Sessions)", () => {
  beforeEach(() => {
    localStorage.clear();
    setPlanType("guest");
  });

  it("normalizes words correctly by stripping punctuation and casing", () => {
    expect(normalizeWord("Hello,")).toBe("hello");
    expect(normalizeWord("...optimization!")).toBe("optimization");
    expect(normalizeWord("World?")).toBe("world");
  });

  it("extracts missing and mismatch words and records session", () => {
    const mockDiff: DiffResult = {
      tokens: [
        { word: "We", status: "match" },
        { word: "need", status: "match" },
        { word: "to", status: "missing" },
        { word: "optimize", spokenWord: "optimise", status: "mismatch" },
      ],
      originalText: "We need to optimize",
      spokenText: "We need optimise",
      originalWordCount: 4,
      spokenWordCount: 3,
      matchedWordCount: 2,
      accuracyScore: 50,
    };

    const { session, newWeakWords } = recordPracticeSession({
      sentence: "We need to optimize",
      japanese: "最適化する必要があります",
      transcription: "We need optimise",
      industry: "tech",
      level: "intermediate",
      wordCount: 4,
      matchedWordCount: 2,
      accuracyScore: 50,
      retryCount: 0,
      diff: mockDiff,
    });

    expect(session.isCleared).toBe(false);
    expect(session.accuracyScore).toBe(50);
    expect(newWeakWords).toHaveLength(2); // "to" and "optimize"

    const weakData = getWeakWords();
    expect(weakData.totalCount).toBe(2);
    expect(weakData.words[0]!.word).toBe("optimize");
    expect(weakData.words[0]!.type).toBe("mismatch");
    expect(weakData.words[0]!.spokenWord).toBe("optimise");
  });

  it("increments error count when the same word is missed again", () => {
    const diff1: DiffResult = {
      tokens: [{ word: "infrastructure", status: "missing" }],
      originalText: "infrastructure",
      spokenText: "",
      originalWordCount: 1,
      spokenWordCount: 0,
      matchedWordCount: 0,
      accuracyScore: 0,
    };

    recordPracticeSession({
      sentence: "infrastructure test 1",
      transcription: "",
      industry: "tech",
      level: "advanced",
      wordCount: 1,
      matchedWordCount: 0,
      accuracyScore: 0,
      retryCount: 0,
      diff: diff1,
    });

    const diff2: DiffResult = {
      tokens: [{ word: "infrastructure,", status: "missing" }],
      originalText: "infrastructure,",
      spokenText: "",
      originalWordCount: 1,
      spokenWordCount: 0,
      matchedWordCount: 0,
      accuracyScore: 0,
    };

    recordPracticeSession({
      sentence: "infrastructure test 2",
      transcription: "",
      industry: "tech",
      level: "advanced",
      wordCount: 1,
      matchedWordCount: 0,
      accuracyScore: 0,
      retryCount: 1,
      diff: diff2,
    });

    const weakData = getWeakWords();
    expect(weakData.totalCount).toBe(1);
    expect(weakData.words[0]!.errorCount).toBe(2);
  });

  it("enforces guest freemium limits and unlocks on pro plan", () => {
    // Generate 7 sessions
    for (let i = 1; i <= 7; i++) {
      const diff: DiffResult = {
        tokens: [{ word: `word${i}`, status: "missing" }],
        originalText: `word${i}`,
        spokenText: "",
        originalWordCount: 1,
        spokenWordCount: 0,
        matchedWordCount: 0,
        accuracyScore: 70,
      };
      recordPracticeSession({
        sentence: `test sentence ${i}`,
        transcription: "",
        industry: "tech",
        level: "intermediate",
        wordCount: 1,
        matchedWordCount: 0,
        accuracyScore: 70,
        retryCount: 0,
        diff,
      });
    }

    // Guest mode: limits applied
    const guestWords = getWeakWords();
    expect(guestWords.totalCount).toBe(7);
    expect(guestWords.words).toHaveLength(GUEST_MAX_WEAK_WORDS);
    expect(guestWords.isLimited).toBe(true);

    const guestSessions = getStoredSessions();
    expect(guestSessions.totalCount).toBe(7);
    expect(guestSessions.sessions).toHaveLength(GUEST_MAX_SESSIONS);
    expect(guestSessions.isLimited).toBe(true);

    // Upgrade to Pro mode: all unlocked
    setPlanType("pro");

    const proWords = getWeakWords();
    expect(proWords.words).toHaveLength(7);
    expect(proWords.isLimited).toBe(false);

    const proSessions = getStoredSessions();
    expect(proSessions.sessions).toHaveLength(7);
    expect(proSessions.isLimited).toBe(false);
  });

  it("toggles mastered status and deletes weak words", () => {
    const diff: DiffResult = {
      tokens: [{ word: "database", status: "missing" }],
      originalText: "database",
      spokenText: "",
      originalWordCount: 1,
      spokenWordCount: 0,
      matchedWordCount: 0,
      accuracyScore: 0,
    };
    recordPracticeSession({
      sentence: "database",
      transcription: "",
      industry: "tech",
      level: "beginner",
      wordCount: 1,
      matchedWordCount: 0,
      accuracyScore: 0,
      retryCount: 0,
      diff,
    });

    const initial = getWeakWords().words[0]!;
    expect(initial.mastered).toBe(false);

    const toggled = toggleMasteredWeakWord(initial.id);
    expect(toggled).toBe(true);
    expect(getWeakWords().words[0]!.mastered).toBe(true);

    deleteWeakWord(initial.id);
    expect(getWeakWords().totalCount).toBe(0);
  });
});
