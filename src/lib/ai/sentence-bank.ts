import { createClient } from "@supabase/supabase-js";
import {
  DifficultyLevel,
  Industry,
  PracticeMode,
  SentenceResponse,
  VALID_INDUSTRIES,
  normalizeIndustry,
} from "@/types";

export const MAX_SENTENCES_PER_SLOT = 300;
export const WEEKLY_REPLACE_RATIO = 0.1;

export interface SentenceBankRecord extends SentenceResponse {
  usageCount: number;
  createdAt: string;
}

export interface RotateSlotResult {
  industry: Industry;
  level: DifficultyLevel;
  mode: PracticeMode;
  beforeCount: number;
  removedCount: number;
  afterCount: number;
  removedIds: string[];
}

const VALID_LEVELS: DifficultyLevel[] = ["beginner", "intermediate", "advanced"];

// In-memory store keyed by `${industry}:${level}:${mode}`
const memoryBank = new Map<string, SentenceBankRecord[]>();

export function getSlotKey(
  industry: Industry,
  level: DifficultyLevel,
  mode: PracticeMode = "sentence"
): string {
  return `${normalizeIndustry(industry)}:${level}:${mode}`;
}

function isSupabaseConfigured(): boolean {
  if (process.env.VITEST || process.env.NODE_ENV === "test") {
    return false;
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(
    url &&
      key &&
      !url.includes("placeholder") &&
      !key.includes("placeholder") &&
      url.startsWith("http")
  );
}

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

/**
 * Clears the in-memory sentence bank (used for unit tests).
 */
export function clearMemorySentenceBank(): void {
  memoryBank.clear();
}

/**
 * Returns a shallow copy of the in-memory items for a given slot.
 */
export function getMemorySlotItems(
  industry: Industry,
  level: DifficultyLevel,
  mode: PracticeMode = "sentence"
): SentenceBankRecord[] {
  const key = getSlotKey(industry, level, mode);
  return [...(memoryBank.get(key) || [])];
}

/**
 * Returns the current count of sentences stored in a slot (industry × level × mode).
 */
export async function getSlotCount(
  industry: Industry,
  level: DifficultyLevel,
  mode: PracticeMode = "sentence"
): Promise<number> {
  const normInd = normalizeIndustry(industry);
  const key = getSlotKey(normInd, level, mode);
  const memItems = memoryBank.get(key) || [];

  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseClient();
      const { count, error } = await supabase
        .from("sentence_bank")
        .select("id", { count: "exact", head: true })
        .eq("industry", normInd)
        .eq("level", level)
        .eq("mode", mode);

      if (!error && typeof count === "number") {
        return Math.max(count, memItems.length);
      }
    } catch {
      // Fallback to in-memory count
    }
  }

  return memItems.length;
}

/**
 * Checks whether the slot has reached the maximum capacity (default: 300).
 */
export async function isSlotFull(
  industry: Industry,
  level: DifficultyLevel,
  mode: PracticeMode = "sentence",
  maxPerSlot: number = MAX_SENTENCES_PER_SLOT
): Promise<boolean> {
  const count = await getSlotCount(industry, level, mode);
  return count >= maxPerSlot;
}

/**
 * Saves a newly generated sentence into the sentence bank if the slot has not exceeded maxPerSlot.
 */
export async function saveToSentenceBank(
  item: SentenceResponse,
  maxPerSlot: number = MAX_SENTENCES_PER_SLOT
): Promise<SentenceBankRecord | null> {
  const normInd = normalizeIndustry(item.industry);
  const mode: PracticeMode = item.mode === "passage" ? "passage" : "sentence";
  const key = getSlotKey(normInd, item.level, mode);
  const currentList = memoryBank.get(key) || [];

  // Prevent duplicates by exact English text
  const existing = currentList.find(
    (s) => s.english.trim().toLowerCase() === item.english.trim().toLowerCase()
  );
  if (existing) {
    return existing;
  }

  if (currentList.length >= maxPerSlot) {
    return null;
  }

  const record: SentenceBankRecord = {
    ...item,
    id: item.id || `bank-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    industry: normInd,
    mode,
    usageCount: 0,
    createdAt: new Date().toISOString(),
  };

  currentList.push(record);
  memoryBank.set(key, currentList);

  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseClient();
      const { count } = await supabase
        .from("sentence_bank")
        .select("id", { count: "exact", head: true })
        .eq("industry", normInd)
        .eq("level", item.level)
        .eq("mode", mode);

      if (typeof count !== "number" || count < maxPerSlot) {
        const { data, error } = await supabase
          .from("sentence_bank")
          .insert({
            english: record.english,
            japanese: record.japanese,
            audio_base64: record.audioBase64 || null,
            word_count: record.wordCount,
            industry: normInd,
            level: record.level,
            mode,
            usage_count: 0,
          })
          .select("id, created_at")
          .single();

        if (!error && data) {
          record.id = String(data.id);
          record.createdAt = String(data.created_at);
        }
      }
    } catch {
      // Ignore DB error, in-memory bank already updated
    }
  }

  return record;
}

/**
 * Checks whether an English sentence contains any of the user's weak words.
 */
function matchesAnyWeakWord(english: string, weakWords?: string[]): boolean {
  if (!weakWords || weakWords.length === 0) return false;
  const lower = english.toLowerCase();
  return weakWords.some((w) => {
    const clean = w.trim().toLowerCase().replace(/[^a-z0-9']/g, "");
    if (!clean) return false;
    return new RegExp(`\\b${clean}\\b`, "i").test(lower);
  });
}

/**
 * Picks a sentence from the bank for the given slot, prioritizing unseen sentences
 * that contain the user's weakWords, and increments its usage_count.
 */
export async function pickFromSentenceBank(params: {
  industry: Industry;
  level: DifficultyLevel;
  mode?: PracticeMode;
  excludeIds?: string[];
  weakWords?: string[];
}): Promise<SentenceBankRecord | null> {
  const normInd = normalizeIndustry(params.industry);
  const mode: PracticeMode = params.mode === "passage" ? "passage" : "sentence";
  const excludeSet = new Set(params.excludeIds || []);
  const weakWords = params.weakWords || [];

  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from("sentence_bank")
        .select("*")
        .eq("industry", normInd)
        .eq("level", params.level)
        .eq("mode", mode)
        .order("usage_count", { ascending: true })
        .limit(100);

      if (!error && Array.isArray(data) && data.length > 0) {
        const unseen = data.filter((row) => !excludeSet.has(String(row.id)));
        const basePool = unseen.length > 0 ? unseen : data;
        const weakMatched = basePool.filter((row) =>
          matchesAnyWeakWord(String(row.english || ""), weakWords)
        );
        const pool = weakMatched.length > 0 ? weakMatched : basePool;

        const chosen = pool[Math.floor(Math.random() * pool.length)]!;
        const nextUsage = (Number(chosen.usage_count) || 0) + 1;

        await supabase
          .from("sentence_bank")
          .update({ usage_count: nextUsage })
          .eq("id", chosen.id);

        return {
          id: String(chosen.id),
          english: String(chosen.english),
          japanese: String(chosen.japanese),
          audioBase64: chosen.audio_base64 ? String(chosen.audio_base64) : undefined,
          wordCount: Number(chosen.word_count) || 0,
          industry: normInd,
          level: params.level,
          mode,
          usageCount: nextUsage,
          createdAt: String(chosen.created_at || new Date().toISOString()),
        };
      }
    } catch {
      // Fallback to in-memory bank
    }
  }

  const key = getSlotKey(normInd, params.level, mode);
  const items = memoryBank.get(key) || [];
  if (items.length === 0) {
    return null;
  }

  const unseen = items.filter((item) => !excludeSet.has(item.id));
  const basePool = unseen.length > 0 ? unseen : items;
  const weakMatched = basePool.filter((item) =>
    matchesAnyWeakWord(item.english, weakWords)
  );
  const pool = weakMatched.length > 0 ? weakMatched : basePool;

  const chosen = pool[Math.floor(Math.random() * pool.length)]!;
  chosen.usageCount += 1;

  return { ...chosen };
}

/**
 * Weekly rotation: removes the top `replaceRatio` (default 10% = up to 30 items per 300-item slot)
 * with the highest `usageCount` so fresh sentences can be generated on subsequent requests.
 */
export async function rotateMostUsedSentences(params?: {
  industry?: Industry;
  level?: DifficultyLevel;
  mode?: PracticeMode;
  maxPerSlot?: number;
  replaceRatio?: number;
}): Promise<RotateSlotResult[]> {
  const industries: Industry[] = params?.industry
    ? [normalizeIndustry(params.industry)]
    : VALID_INDUSTRIES;
  const levels: DifficultyLevel[] = params?.level ? [params.level] : VALID_LEVELS;
  const modes: PracticeMode[] = params?.mode ? [params.mode] : ["sentence"];
  const maxPerSlot = params?.maxPerSlot ?? MAX_SENTENCES_PER_SLOT;
  const replaceRatio = params?.replaceRatio ?? WEEKLY_REPLACE_RATIO;

  const results: RotateSlotResult[] = [];

  for (const ind of industries) {
    for (const lvl of levels) {
      for (const mode of modes) {
        const key = getSlotKey(ind, lvl, mode);
        const memItems = memoryBank.get(key) || [];

        if (isSupabaseConfigured()) {
          try {
            const supabase = getSupabaseClient();
            const { data: rows, error } = await supabase
              .from("sentence_bank")
              .select("id, usage_count, created_at")
              .eq("industry", ind)
              .eq("level", lvl)
              .eq("mode", mode)
              .order("usage_count", { ascending: false })
              .order("created_at", { ascending: true });

            if (!error && Array.isArray(rows) && rows.length > 0) {
              const beforeCount = rows.length;
              const maxRemove = Math.max(1, Math.floor(maxPerSlot * replaceRatio));
              const removeCount = Math.min(
                beforeCount,
                Math.min(maxRemove, Math.max(1, Math.floor(beforeCount * replaceRatio)))
              );
              const toRemoveIds = rows.slice(0, removeCount).map((r) => String(r.id));

              if (toRemoveIds.length > 0) {
                await supabase.from("sentence_bank").delete().in("id", toRemoveIds);
              }

              results.push({
                industry: ind,
                level: lvl,
                mode,
                beforeCount,
                removedCount: toRemoveIds.length,
                afterCount: beforeCount - toRemoveIds.length,
                removedIds: toRemoveIds,
              });
              continue;
            }
          } catch {
            // Fallback to in-memory rotation
          }
        }

        const beforeCount = memItems.length;
        if (beforeCount === 0) {
          results.push({
            industry: ind,
            level: lvl,
            mode,
            beforeCount: 0,
            removedCount: 0,
            afterCount: 0,
            removedIds: [],
          });
          continue;
        }

        const maxRemove = Math.max(1, Math.floor(maxPerSlot * replaceRatio));
        const removeCount = Math.min(
          beforeCount,
          Math.min(maxRemove, Math.max(1, Math.floor(beforeCount * replaceRatio)))
        );

        // Sort copy by highest usageCount first (tie-break by oldest createdAt)
        const sorted = [...memItems].sort((a, b) => {
          if (b.usageCount !== a.usageCount) {
            return b.usageCount - a.usageCount;
          }
          return a.createdAt.localeCompare(b.createdAt);
        });

        const removedIds = sorted.slice(0, removeCount).map((item) => item.id);
        const removedSet = new Set(removedIds);
        const remaining = memItems.filter((item) => !removedSet.has(item.id));
        memoryBank.set(key, remaining);

        results.push({
          industry: ind,
          level: lvl,
          mode,
          beforeCount,
          removedCount: removedIds.length,
          afterCount: remaining.length,
          removedIds,
        });
      }
    }
  }

  return results;
}
