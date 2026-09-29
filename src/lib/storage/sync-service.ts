"use client";

import { createClient } from "@/lib/supabase/client";
import { StoredSession, WeakWord } from "@/types";
import {
  loadAllSessions,
  saveAllSessions,
  loadAllWeakWords,
  saveAllWeakWords,
} from "./user-learning-store";

const STORAGE_MIGRATED_PREFIX = "shadowlog_guest_migrated_";

/**
 * Returns the currently authenticated Supabase user or null.
 */
export async function getAuthenticatedUser() {
  if (typeof window === "undefined") return null;
  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;
    return user;
  } catch {
    return null;
  }
}

/**
 * Migrates local guest sessions and weak words to Supabase DB upon user registration or login.
 */
export async function migrateGuestDataToSupabase(): Promise<boolean> {
  if (typeof window === "undefined" || !navigator.onLine) return false;

  try {
    const user = await getAuthenticatedUser();
    if (!user) return false;

    const migrationKey = `${STORAGE_MIGRATED_PREFIX}${user.id}`;
    if (localStorage.getItem(migrationKey) === "true") {
      return true; // Already migrated for this user
    }

    const supabase = createClient();
    const localSessions = loadAllSessions();
    const localWeakWords = loadAllWeakWords();

    // 1. Migrate Practice Sessions
    if (localSessions.length > 0) {
      const sessionPayloads = localSessions.map((s) => ({
        user_id: user.id,
        sentence_id: s.id,
        text_en: s.sentence,
        text_jp: s.japanese || null,
        transcribed_text: s.transcription || null,
        accuracy_score: s.accuracyScore,
        wpm: s.wpm || 0,
        diff_result: s.diff || null,
        coach_feedback: s.coachFeedback || null,
        created_at: s.createdAt,
      }));

      const { error: sessionError } = await supabase
        .from("practice_sessions")
        .insert(sessionPayloads);

      if (sessionError) {
        console.warn("Guest sessions migration failed:", sessionError);
      }
    }

    // 2. Migrate Weak Words (Upsert on user_id, word)
    if (localWeakWords.length > 0) {
      const wordPayloads = localWeakWords.map((w) => ({
        user_id: user.id,
        word: w.word,
        fail_count: w.errorCount,
        is_mastered: w.mastered,
        last_practiced_at: w.lastPracticedAt,
      }));

      const { error: wordError } = await supabase
        .from("weak_words")
        .upsert(wordPayloads, { onConflict: "user_id,word" });

      if (wordError) {
        console.warn("Guest weak words migration failed:", wordError);
      }
    }

    localStorage.setItem(migrationKey, "true");
    return true;
  } catch (err) {
    console.warn("Error during guest data migration:", err);
    return false;
  }
}

/**
 * Saves a single practice session to Supabase DB if logged in and online.
 */
export async function savePracticeSessionToSupabase(session: StoredSession): Promise<boolean> {
  if (typeof window === "undefined" || !navigator.onLine) return false;

  try {
    const user = await getAuthenticatedUser();
    if (!user) return false;

    const supabase = createClient();

    // 1. Insert session
    const { error: sessionError } = await supabase
      .from("practice_sessions")
      .insert({
        user_id: user.id,
        sentence_id: session.id,
        text_en: session.sentence,
        text_jp: session.japanese || null,
        transcribed_text: session.transcription || null,
        accuracy_score: session.accuracyScore,
        wpm: session.wpm || 0,
        diff_result: session.diff || null,
        coach_feedback: session.coachFeedback || null,
        created_at: session.createdAt,
      });

    if (sessionError) {
      console.warn("Failed to save session to Supabase:", sessionError);
      return false;
    }

    return true;
  } catch (err) {
    console.warn("Error in savePracticeSessionToSupabase:", err);
    return false;
  }
}

/**
 * Synchronizes unsaved local sessions to Supabase DB.
 * Inspects all local sessions (loadAllSessions()), checks existing sessions in Supabase,
 * and bulk inserts any missing sessions to recover and reconcile past practice data.
 */
export async function syncLocalSessionsToSupabase(): Promise<number> {
  if (typeof window === "undefined" || !navigator.onLine) return 0;

  try {
    const user = await getAuthenticatedUser();
    if (!user) return 0;

    const localSessions = loadAllSessions();
    if (!localSessions || localSessions.length === 0) return 0;

    const supabase = createClient();

    // Query existing session identifiers for this user from Supabase
    const { data: dbRecords, error: fetchError } = await supabase
      .from("practice_sessions")
      .select("id, sentence_id")
      .eq("user_id", user.id);

    if (fetchError) {
      console.warn("Failed to fetch existing sessions for diff sync:", fetchError);
      return 0;
    }

    const existingKeys = new Set<string>();
    if (dbRecords) {
      for (const row of dbRecords) {
        if (row.sentence_id) existingKeys.add(row.sentence_id);
        if (row.id) existingKeys.add(row.id);
      }
    }

    // Filter local sessions that do not exist on Supabase
    const unsyncedSessions = localSessions.filter(
      (s) => !existingKeys.has(s.id)
    );

    if (unsyncedSessions.length === 0) {
      return 0;
    }

    const sessionPayloads = unsyncedSessions.map((s) => ({
      user_id: user.id,
      sentence_id: s.id,
      text_en: s.sentence,
      text_jp: s.japanese || null,
      transcribed_text: s.transcription || null,
      accuracy_score: s.accuracyScore,
      wpm: s.wpm || 0,
      diff_result: s.diff || null,
      coach_feedback: s.coachFeedback || null,
      created_at: s.createdAt,
    }));

    const { error: insertError } = await supabase
      .from("practice_sessions")
      .insert(sessionPayloads);

    if (insertError) {
      console.warn("Failed to sync local sessions to Supabase:", insertError);
      return 0;
    }

    return unsyncedSessions.length;
  } catch (err) {
    console.warn("Error during local sessions sync to Supabase:", err);
    return 0;
  }
}

/**
 * Synchronizes practice sessions from Supabase into local storage.
 */
export async function syncSessionsFromSupabase(): Promise<StoredSession[]> {
  const local = loadAllSessions();
  if (typeof window === "undefined" || !navigator.onLine) return local;

  try {
    const user = await getAuthenticatedUser();
    if (!user) return local;

    const supabase = createClient();
    const { data, error } = await supabase
      .from("practice_sessions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error || !data) return local;

    // Convert Supabase records to StoredSession format
    const dbSessions: StoredSession[] = data.map((row) => ({
      id: row.sentence_id || row.id,
      sentence: row.text_en,
      japanese: row.text_jp || undefined,
      transcription: row.transcribed_text || "",
      industry: "tech", // fallback
      level: "intermediate", // fallback
      wordCount: row.text_en.split(/\s+/).filter(Boolean).length,
      matchedWordCount: Math.round((row.text_en.split(/\s+/).filter(Boolean).length * (row.accuracy_score || 0)) / 100),
      accuracyScore: Number(row.accuracy_score) || 0,
      createdAt: row.created_at,
      wpm: row.wpm ? Number(row.wpm) : undefined,
      isCleared: (Number(row.accuracy_score) || 0) >= 80,
      retryCount: 0,
      diff: row.diff_result || undefined,
      coachFeedback: row.coach_feedback || undefined,
    }));

    // Merge deduplicated by sentence_id/id
    const map = new Map<string, StoredSession>();
    for (const s of local) map.set(s.id, s);
    for (const s of dbSessions) map.set(s.id, s);

    const merged = Array.from(map.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    saveAllSessions(merged);
    return merged;
  } catch (err) {
    console.warn("Failed to sync sessions from Supabase:", err);
    return local;
  }
}

/**
 * Synchronizes weak words from Supabase into local storage.
 */
export async function syncWeakWordsFromSupabase(): Promise<WeakWord[]> {
  const local = loadAllWeakWords();
  if (typeof window === "undefined" || !navigator.onLine) return local;

  try {
    const user = await getAuthenticatedUser();
    if (!user) return local;

    const supabase = createClient();
    const { data, error } = await supabase
      .from("weak_words")
      .select("*")
      .eq("user_id", user.id);

    if (error || !data) return local;

    // Map DB records
    const map = new Map<string, WeakWord>();
    for (const w of local) map.set(w.word.toLowerCase(), w);

    for (const row of data) {
      const key = row.word.toLowerCase();
      const existing = map.get(key);
      map.set(key, {
        id: row.id || existing?.id || `weak-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        word: row.word,
        type: existing?.type || "mismatch",
        spokenWord: existing?.spokenWord,
        sentence: existing?.sentence || `Practice word: ${row.word}`,
        japanese: existing?.japanese,
        industry: existing?.industry || "tech",
        level: existing?.level || "intermediate",
        errorCount: row.fail_count || existing?.errorCount || 1,
        mastered: row.is_mastered ?? existing?.mastered ?? false,
        lastPracticedAt: row.last_practiced_at || new Date().toISOString(),
      });
    }

    const merged = Array.from(map.values());
    saveAllWeakWords(merged);
    return merged;
  } catch (err) {
    console.warn("Failed to sync weak words from Supabase:", err);
    return local;
  }
}

/**
 * Updates a weak word's mastered status in Supabase DB if logged in and online.
 */
export async function updateWeakWordMasteredInSupabase(
  word: string,
  isMastered: boolean
): Promise<boolean> {
  if (typeof window === "undefined" || !navigator.onLine) return false;

  try {
    const user = await getAuthenticatedUser();
    if (!user) return false;

    const supabase = createClient();
    const cleanWord = word.replace(/^[^\w]+|[^\w]+$/g, "").trim();

    const { error } = await supabase
      .from("weak_words")
      .update({
        is_mastered: isMastered,
        last_practiced_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .ilike("word", cleanWord);

    if (error) {
      console.warn("Failed to update weak word mastered in Supabase:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("Error updating weak word mastered in Supabase:", err);
    return false;
  }
}

// ── Nickname & Profile Management ──

const STORAGE_NICKNAME_KEY = "shadowlog_nickname";

/**
 * Returns cached nickname from LocalStorage.
 */
export function getStoredNickname(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(STORAGE_NICKNAME_KEY) || null;
  } catch {
    return null;
  }
}

/**
 * Saves nickname to LocalStorage and notifies active components.
 */
export function setStoredNickname(nickname: string): void {
  if (typeof window === "undefined") return;
  try {
    if (nickname.trim()) {
      localStorage.setItem(STORAGE_NICKNAME_KEY, nickname.trim());
    } else {
      localStorage.removeItem(STORAGE_NICKNAME_KEY);
    }
    window.dispatchEvent(new Event("shadowlog:nickname-update"));
  } catch (err) {
    console.warn("Failed to save nickname locally:", err);
  }
}

/**
 * Fetches user nickname from Supabase profiles (or Google user metadata fallback),
 * caching it to LocalStorage.
 */
export async function fetchUserNickname(): Promise<string | null> {
  if (typeof window === "undefined") return null;

  // Check local cache first
  const localName = getStoredNickname();

  try {
    const user = await getAuthenticatedUser();
    if (!user) return localName;

    const supabase = createClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle();

    if (!error && data?.display_name) {
      setStoredNickname(data.display_name);
      return data.display_name;
    }

    // Fallback: Google name from OAuth metadata if no profile display_name
    const googleName =
      (user.user_metadata?.full_name as string) ||
      (user.user_metadata?.name as string) ||
      null;

    if (googleName && !localName) {
      setStoredNickname(googleName);
      // Automatically save to Supabase profiles
      await supabase
        .from("profiles")
        .update({ display_name: googleName })
        .eq("id", user.id);
      return googleName;
    }

    return localName;
  } catch (err) {
    console.warn("Failed to fetch user nickname:", err);
    return localName;
  }
}

/**
 * Updates user nickname in both LocalStorage and Supabase DB.
 */
export async function updateUserNickname(nickname: string): Promise<boolean> {
  const trimmed = nickname.trim();
  setStoredNickname(trimmed);

  try {
    const user = await getAuthenticatedUser();
    if (!user) return true; // Local update is successful even if guest

    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: trimmed,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      console.warn("Failed to update nickname in Supabase profiles:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("Error updating nickname:", err);
    return false;
  }
}
