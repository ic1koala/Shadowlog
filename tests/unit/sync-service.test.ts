import { describe, it, expect, beforeEach, vi } from "vitest";
import { syncLocalSessionsToSupabase, savePracticeSessionToSupabase } from "@/lib/storage/sync-service";
import { saveAllSessions, clearAllLearningData } from "@/lib/storage/user-learning-store";
import { StoredSession } from "@/types";

// Mock Supabase client
const mockGetUser = vi.fn();
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockEq = vi.fn();

let mockSelectResult: { data: unknown[] | null; error: unknown } = { data: [], error: null };
let mockInsertResult: { data: unknown; error: unknown } = { data: null, error: null };

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getUser: mockGetUser,
    },
    from: () => ({
      select: (...args: unknown[]) => {
        mockSelect(...args);
        return {
          eq: (...eqArgs: unknown[]) => {
            mockEq(...eqArgs);
            return Promise.resolve(mockSelectResult);
          },
        };
      },
      insert: (...args: unknown[]) => {
        mockInsert(...args);
        return Promise.resolve(mockInsertResult);
      },
    }),
  }),
}));

describe("sync-service unit tests", () => {
  beforeEach(() => {
    localStorage.clear();
    clearAllLearningData();
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: "test-user-123", email: "test@example.com" } },
      error: null,
    });
    mockSelectResult = { data: [], error: null };
    mockInsertResult = { data: null, error: null };
  });

  it("returns 0 if user is not authenticated", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });
    const count = await syncLocalSessionsToSupabase();
    expect(count).toBe(0);
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("returns 0 if local storage has no sessions", async () => {
    saveAllSessions([]);
    const count = await syncLocalSessionsToSupabase();
    expect(count).toBe(0);
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("syncs unsaved local sessions to Supabase with production schema", async () => {
    const localSessions: StoredSession[] = [
      {
        id: "session-local-1",
        sentence: "First test sentence.",
        japanese: "最初のテスト文章",
        transcription: "First test sentence.",
        industry: "tech",
        level: "intermediate",
        wordCount: 3,
        matchedWordCount: 3,
        accuracyScore: 100,
        createdAt: "2026-09-29T10:00:00.000Z",
        wpm: 120,
        isCleared: true,
        retryCount: 0,
        diff: {
          tokens: [],
          originalText: "First test sentence.",
          spokenText: "First test sentence.",
          originalWordCount: 3,
          spokenWordCount: 3,
          matchedWordCount: 3,
          accuracyScore: 100,
        },
        coachFeedback: {
          overallComment: "Great job!",
          pronunciationAdvice: "Clear pronunciation",
          retryFocusPoint: "Keep up the rhythm",
        },
      },
      {
        id: "session-local-2",
        sentence: "Already synced sentence.",
        japanese: "保存済みのテスト文章",
        transcription: "Already synced sentence.",
        industry: "tech",
        level: "intermediate",
        wordCount: 3,
        matchedWordCount: 3,
        accuracyScore: 100,
        createdAt: "2026-09-29T09:00:00.000Z",
        isCleared: true,
        retryCount: 0,
      },
    ];

    saveAllSessions(localSessions);

    // Supabase already has session-local-2
    mockSelectResult = {
      data: [{ id: "uuid-db-2", sentence_id: "session-local-2" }],
      error: null,
    };

    const count = await syncLocalSessionsToSupabase();
    expect(count).toBe(1); // Only session-local-1 should be synced

    expect(mockInsert).toHaveBeenCalledTimes(1);
    const insertPayload = mockInsert.mock.calls[0][0];
    expect(insertPayload).toHaveLength(1);
    expect(insertPayload[0]).toMatchObject({
      user_id: "test-user-123",
      sentence_id: "session-local-1",
      text_en: "First test sentence.",
      text_jp: "最初のテスト文章",
      transcribed_text: "First test sentence.",
      accuracy_score: 100,
      wpm: 120,
      diff_result: expect.any(Object),
      coach_feedback: expect.any(Object),
      created_at: "2026-09-29T10:00:00.000Z",
    });
  });

  it("returns 0 if all local sessions are already synced", async () => {
    const localSessions: StoredSession[] = [
      {
        id: "session-local-1",
        sentence: "First test sentence.",
        transcription: "First test sentence.",
        industry: "tech",
        level: "intermediate",
        wordCount: 3,
        matchedWordCount: 3,
        accuracyScore: 100,
        createdAt: "2026-09-29T10:00:00.000Z",
        isCleared: true,
        retryCount: 0,
      },
    ];

    saveAllSessions(localSessions);

    mockSelectResult = {
      data: [{ id: "session-local-1", sentence_id: "session-local-1" }],
      error: null,
    };

    const count = await syncLocalSessionsToSupabase();
    expect(count).toBe(0);
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("saves a single session to Supabase with production schema", async () => {
    const session: StoredSession = {
      id: "session-single-1",
      sentence: "Single session practice.",
      japanese: "単一セッション練習",
      transcription: "Single session practice.",
      industry: "tech",
      level: "intermediate",
      wordCount: 3,
      matchedWordCount: 3,
      accuracyScore: 100,
      createdAt: "2026-09-29T11:00:00.000Z",
      wpm: 110,
      isCleared: true,
      retryCount: 0,
    };

    const success = await savePracticeSessionToSupabase(session);
    expect(success).toBe(true);
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "test-user-123",
        sentence_id: "session-single-1",
        text_en: "Single session practice.",
        text_jp: "単一セッション練習",
        transcribed_text: "Single session practice.",
        accuracy_score: 100,
        wpm: 110,
        created_at: "2026-09-29T11:00:00.000Z",
      })
    );
  });
});
