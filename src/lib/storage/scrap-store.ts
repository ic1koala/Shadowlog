import { UserPlanType } from "@/types";
import { getPlanType } from "@/lib/storage/user-learning-store";
import { isInvitedVip } from "@/lib/auth/vip-checker";

export type ScrapSourceType = "youtube" | "web" | "text";

export interface ScrapSource {
  id: string;
  type: ScrapSourceType;
  title: string;
  sourceUrl?: string;
  rawText?: string;
  targetWpm?: number;
  extractedPassage: string;
  japaneseTranslation?: string;
  createdAt: string;
  summary?: string;
}

export interface ScrapStoreData {
  sources: ScrapSource[];
  activeSourceId: string | null;
}

export const MAX_PRO_SCRAP_SOURCES = 5;
const KEY_DOC_SHADOW_STORE = "shadowlog_doc_shadow_store";

/**
 * Checks whether the current user is eligible to use Doc Shadow (マイスクラップ).
 * Eligible for: Pro plan or VIP users.
 */
export function isScrapEligible(plan?: UserPlanType | null): boolean {
  if (typeof window !== "undefined" && isInvitedVip()) {
    return true;
  }
  const effectivePlan = plan || getPlanType();
  return effectivePlan === "pro";
}

export function getScrapStore(): ScrapStoreData {
  if (typeof window === "undefined") {
    return { sources: [], activeSourceId: null };
  }
  try {
    const raw = localStorage.getItem(KEY_DOC_SHADOW_STORE);
    if (!raw) return { sources: [], activeSourceId: null };
    const parsed = JSON.parse(raw) as ScrapStoreData;
    if (!parsed || !Array.isArray(parsed.sources)) {
      return { sources: [], activeSourceId: null };
    }
    return parsed;
  } catch {
    return { sources: [], activeSourceId: null };
  }
}

export function saveScrapStore(data: ScrapStoreData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY_DOC_SHADOW_STORE, JSON.stringify(data));
    window.dispatchEvent(new Event("shadowlog:scrap-update"));
  } catch (e) {
    console.error("Failed to save scrap store:", e);
  }
}

export function addScrapSource(
  source: Omit<ScrapSource, "id" | "createdAt">
): { success: boolean; error?: string; source?: ScrapSource } {
  const store = getScrapStore();
  if (store.sources.length >= MAX_PRO_SCRAP_SOURCES) {
    return {
      success: false,
      error: `Proプランのマイスクラップ上限（最大${MAX_PRO_SCRAP_SOURCES}件）に達しています。不要なスクラップを削除してください。`,
    };
  }

  const newSource: ScrapSource = {
    ...source,
    id: `scrap-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
  };

  store.sources.unshift(newSource);
  store.activeSourceId = newSource.id;
  saveScrapStore(store);

  return { success: true, source: newSource };
}

export function deleteScrapSource(id: string): void {
  const store = getScrapStore();
  store.sources = store.sources.filter((s) => s.id !== id);
  if (store.activeSourceId === id) {
    store.activeSourceId = store.sources[0]?.id || null;
  }
  saveScrapStore(store);
}

export function setActiveScrapSource(id: string | null): void {
  const store = getScrapStore();
  store.activeSourceId = id;
  saveScrapStore(store);
}

export function getActiveScrapSource(): ScrapSource | null {
  const store = getScrapStore();
  if (!store.activeSourceId) return null;
  return store.sources.find((s) => s.id === store.activeSourceId) || null;
}
