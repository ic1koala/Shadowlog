import { UserPlanType } from "@/types";
import { getPlanType } from "@/lib/storage/user-learning-store";
import { isInvitedVip } from "@/lib/auth/vip-checker";
import {
  isPersonaEligible,
  getPersonaProfile,
  getPersonaDailyQuota,
} from "@/lib/storage/persona-store";
import {
  getCustomWords,
  getCustomGenerationQuota,
} from "@/lib/storage/custom-words-store";

export type ScrapSourceType = "youtube" | "web" | "text" | "pdf";

export type GenerationSourceType =
  | "industry"
  | "persona"
  | "custom_words"
  | "scrap";

export const VALID_GENERATION_SOURCES: GenerationSourceType[] = [
  "industry",
  "persona",
  "custom_words",
  "scrap",
];

export interface ScrapSource {
  id: string;
  type: ScrapSourceType;
  title: string;
  fileName?: string;
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

export interface ResolvedGenerationSource {
  configuredSource: GenerationSourceType;
  effectiveSource: GenerationSourceType;
  fallbackNotice?: string;
}

export const MAX_PRO_SCRAP_SOURCES = 5;
const KEY_DOC_SHADOW_STORE = "shadowlog_doc_shadow_store";
export const KEY_GENERATION_SOURCE = "shadowlog_generation_source";

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

/**
 * Retrieves the user's pinned phrase generation source.
 * Defaults to "industry" (① 学習する業種).
 */
export function getGenerationSource(): GenerationSourceType {
  if (typeof window === "undefined") {
    return "industry";
  }
  try {
    const raw = localStorage.getItem(KEY_GENERATION_SOURCE) as GenerationSourceType | null;
    if (raw && VALID_GENERATION_SOURCES.includes(raw)) {
      return raw;
    }
  } catch {
    // ignore storage errors
  }
  return "industry";
}

/**
 * Persists the user's pinned phrase generation source and notifies listeners.
 */
export function setGenerationSource(source: GenerationSourceType): void {
  if (typeof window === "undefined") return;
  if (!VALID_GENERATION_SOURCES.includes(source)) return;
  try {
    localStorage.setItem(KEY_GENERATION_SOURCE, source);
    window.dispatchEvent(new Event("shadowlog:generation-source-update"));
  } catch (e) {
    console.error("Failed to save generation source:", e);
  }
}

/**
 * Checks whether a given generation source is allowed for the user's plan.
 * - "industry": All plans (guest/free/base/pro)
 * - "custom_words": All plans (free gets 2 trial, base 3/day, pro 10/day)
 * - "persona": Base, Pro, VIP
 * - "scrap": Pro, VIP
 */
export function isGenerationSourcePlanEligible(
  source: GenerationSourceType,
  plan?: UserPlanType | null
): boolean {
  if (source === "industry" || source === "custom_words") {
    return true;
  }
  if (source === "persona") {
    return isPersonaEligible(plan);
  }
  if (source === "scrap") {
    return isScrapEligible(plan);
  }
  return false;
}

/**
 * Resolves the effective generation source at phrase generation time.
 * If the pinned source is ineligible for the plan, has no registered source data,
 * or has exhausted its daily/cumulative quota, automatically falls back to "industry"
 * with a clear user-facing notice.
 */
export function resolveEffectiveGenerationSource(
  planOverride?: UserPlanType,
  now: Date = new Date()
): ResolvedGenerationSource {
  const configuredSource = getGenerationSource();
  const effectivePlan = planOverride || getPlanType();

  if (configuredSource === "industry") {
    return {
      configuredSource: "industry",
      effectiveSource: "industry",
    };
  }

  if (configuredSource === "persona") {
    if (!isPersonaEligible(effectivePlan)) {
      return {
        configuredSource,
        effectiveSource: "industry",
        fallbackNotice:
          "ペルソナ生成はBaseプラン以上でご利用いただけます。現在は「学習する業種」からフレーズを生成しています。",
      };
    }
    const profile = getPersonaProfile();
    const hasPersonaData = Boolean(
      profile &&
        (profile.jobRole?.trim() ||
          profile.industryField?.trim() ||
          profile.targetScenario?.trim() ||
          profile.interestedTopics?.trim())
    );
    if (!hasPersonaData) {
      return {
        configuredSource,
        effectiveSource: "industry",
        fallbackNotice:
          "ペルソナ設定がまだ入力されていないため、「学習する業種」からフレーズを生成しました。",
      };
    }
    const quota = getPersonaDailyQuota(effectivePlan, now);
    if (quota.remainingToday <= 0) {
      return {
        configuredSource,
        effectiveSource: "industry",
        fallbackNotice:
          effectivePlan === "base"
            ? `本日のペルソナ生成枠（${quota.dailyLimit}回）を使い切ったため、「学習する業種」に自動切り替えしました（Proプランなら1日15回まで利用可能）。`
            : `本日のペルソナ生成枠（${quota.dailyLimit}回）を使い切ったため、「学習する業種」に自動切り替えしました（明日0:00リセット）。`,
      };
    }
    return {
      configuredSource: "persona",
      effectiveSource: "persona",
    };
  }

  if (configuredSource === "custom_words") {
    const words = getCustomWords();
    if (words.length === 0) {
      return {
        configuredSource,
        effectiveSource: "industry",
        fallbackNotice:
          "カスタムマイ単語が未登録のため、「学習する業種」からフレーズを生成しました。",
      };
    }
    const quota = getCustomGenerationQuota(effectivePlan, now);
    if (!quota.canGenerate) {
      const msg =
        quota.plan === "base"
          ? "本日のカスタムマイ単語生成枠（3回）を使い切ったため、「学習する業種」に自動切り替えしました（Proプランなら1日10回まで利用可能）。"
          : quota.plan === "pro"
          ? "本日のカスタムマイ単語生成枠（10回）を使い切ったため、「学習する業種」に自動切り替えしました（明日0:00リセット）。"
          : "お試しカスタムマイ単語生成枠（2回）を使い切ったため、「学習する業種」に自動切り替えしました（Baseプランで1日3回、Proプランで1日10回利用可能）。";
      return {
        configuredSource,
        effectiveSource: "industry",
        fallbackNotice: msg,
      };
    }
    return {
      configuredSource: "custom_words",
      effectiveSource: "custom_words",
    };
  }

  if (configuredSource === "scrap") {
    if (!isScrapEligible(effectivePlan)) {
      return {
        configuredSource,
        effectiveSource: "industry",
        fallbackNotice:
          "マイスクラップ生成はProプラン限定機能です。現在は「学習する業種」からフレーズを生成しています。",
      };
    }
    const activeScrap = getActiveScrapSource();
    if (!activeScrap || !(activeScrap.rawText || activeScrap.extractedPassage)) {
      return {
        configuredSource,
        effectiveSource: "industry",
        fallbackNotice:
          "マイスクラップ（PDF/記事/動画）が未登録のため、「学習する業種」からフレーズを生成しました。",
      };
    }
    return {
      configuredSource: "scrap",
      effectiveSource: "scrap",
    };
  }

  return {
    configuredSource: "industry",
    effectiveSource: "industry",
  };
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
    rawText: source.rawText || source.extractedPassage,
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
  if (!store.activeSourceId) {
    return store.sources[0] || null;
  }
  return (
    store.sources.find((s) => s.id === store.activeSourceId) ||
    store.sources[0] ||
    null
  );
}
