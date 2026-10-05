import { Industry, UserPlanType, normalizeIndustry } from "@/types";
import { getWeakWords } from "@/lib/storage/user-learning-store";
import { getTicketStatus } from "@/lib/storage/ticket-store";

export const KEY_CUSTOM_WORDS = "shadowlog_custom_words";
export const KEY_CUSTOM_GENERATE_DAILY_COUNT = "shadowlog_custom_generate_daily_count";

export const MAX_CUSTOM_WORDS = 3;
export const FREE_CUMULATIVE_LIMIT = 2;
export const BASE_DAILY_LIMIT = 3;
export const PRO_DAILY_LIMIT = 10;

export interface CustomGenerateCounterRecord {
  date: string; // YYYY-MM-DD in JST
  count: number;
  totalCount?: number;
}

export interface CustomGenerateQuotaStatus {
  plan: UserPlanType;
  date: string;
  dateKey: string;
  usedToday: number;
  usedTotal: number;
  used: number;
  usedCount: number;
  limit: number;
  maxLimit: number;
  remaining: number;
  remainingCount: number;
  canGenerate: boolean;
  isCumulative: boolean;
  isDaily: boolean;
}

export type CustomGenerationQuota = CustomGenerateQuotaStatus;

export interface SuggestedWordChip {
  word: string;
  label: string;
  source: "industry" | "weak";
}

export const INDUSTRY_SUGGESTED_WORDS: Record<
  Industry,
  Array<{ word: string; meaning: string }>
> = {
  tech: [
    { word: "scalability", meaning: "拡張性" },
    { word: "latency", meaning: "応答遅延" },
    { word: "bottleneck", meaning: "ボトルネック" },
    { word: "architecture", meaning: "システム構成" },
    { word: "deploy", meaning: "本番反映する" },
    { word: "automate", meaning: "自動化する" },
  ],
  business: [
    { word: "align with", meaning: "〜と足並みを揃える" },
    { word: "stakeholder", meaning: "利害関係者" },
    { word: "milestone", meaning: "中間目標・節目" },
    { word: "streamline", meaning: "効率化する" },
    { word: "revenue", meaning: "売上・収益" },
    { word: "feasible", meaning: "実現可能な" },
  ],
  marketing: [
    { word: "conversion", meaning: "成約・転換" },
    { word: "engagement", meaning: "顧客反応・愛着" },
    { word: "retention", meaning: "継続・定着" },
    { word: "omnichannel", meaning: "オムニチャネル" },
    { word: "campaign", meaning: "施策・キャンペーン" },
    { word: "audience", meaning: "ターゲット層" },
  ],
  daily: [
    { word: "recommend", meaning: "おすすめする" },
    { word: "reservation", meaning: "予約" },
    { word: "catch up", meaning: "近況を話す" },
    { word: "itinerary", meaning: "旅程・スケジュール" },
    { word: "neighborhood", meaning: "近所・周辺エリア" },
    { word: "convenient", meaning: "都合が良い・便利な" },
  ],
};

/**
 * Returns "YYYY-MM-DD" formatted date string in JST (Asia/Tokyo, UTC+9).
 */
export function getJstDateString(now: Date = new Date()): string {
  const jstTime = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return jstTime.toISOString().slice(0, 10);
}

export const getJstDateKey = getJstDateString;

/**
 * Retrieves the 3-slot array of custom words (preserving empty strings for UI inputs).
 */
export function getCustomWordSlots(): [string, string, string] {
  if (typeof window === "undefined") {
    return ["", "", ""];
  }
  try {
    const raw = localStorage.getItem(KEY_CUSTOM_WORDS);
    if (!raw) return ["", "", ""];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return ["", "", ""];
    return [
      typeof parsed[0] === "string" ? parsed[0].trim() : "",
      typeof parsed[1] === "string" ? parsed[1].trim() : "",
      typeof parsed[2] === "string" ? parsed[2].trim() : "",
    ];
  } catch {
    return ["", "", ""];
  }
}

/**
 * Retrieves non-empty registered custom words (maximum 3 words).
 */
export function getCustomWords(): string[] {
  const slots = getCustomWordSlots();
  return slots.filter((w) => w.length > 0).slice(0, MAX_CUSTOM_WORDS);
}

/**
 * Saves up to 3 custom words to localStorage and returns the active non-empty words.
 */
export function saveCustomWords(words: string[]): string[] {
  const normalizedSlots: [string, string, string] = [
    typeof words[0] === "string" ? words[0].trim().slice(0, 40) : "",
    typeof words[1] === "string" ? words[1].trim().slice(0, 40) : "",
    typeof words[2] === "string" ? words[2].trim().slice(0, 40) : "",
  ];

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(KEY_CUSTOM_WORDS, JSON.stringify(normalizedSlots));
      window.dispatchEvent(new Event("shadowlog:custom-words-update"));
    } catch {
      // ignore storage errors
    }
  }

  return normalizedSlots.filter((w) => w.length > 0);
}

/**
 * Resolves the effective user plan when not explicitly provided.
 */
function resolveEffectivePlan(planOverride?: UserPlanType, now?: Date): UserPlanType {
  if (planOverride) return planOverride;
  const status = getTicketStatus(undefined, undefined, now);
  if (status.isVip) return "pro";
  return status.plan;
}

/**
 * Returns the maximum allowed custom generations and whether the limit is cumulative or daily.
 */
export function getPlanCustomLimit(plan: UserPlanType): {
  limit: number;
  isCumulative: boolean;
} {
  if (plan === "pro") {
    return { limit: PRO_DAILY_LIMIT, isCumulative: false };
  }
  if (plan === "base") {
    return { limit: BASE_DAILY_LIMIT, isCumulative: false };
  }
  return { limit: FREE_CUMULATIVE_LIMIT, isCumulative: true };
}

/**
 * Reads the raw daily/cumulative counter record from localStorage, resetting daily count on JST date change.
 */
export function getCustomGenerateCounter(
  now: Date = new Date()
): { date: string; count: number; totalCount: number } {
  const todayJst = getJstDateString(now);
  if (typeof window === "undefined") {
    return { date: todayJst, count: 0, totalCount: 0 };
  }

  try {
    const raw = localStorage.getItem(KEY_CUSTOM_GENERATE_DAILY_COUNT);
    if (!raw) {
      return { date: todayJst, count: 0, totalCount: 0 };
    }
    const parsed = JSON.parse(raw) as Partial<CustomGenerateCounterRecord>;
    const rawCount =
      typeof parsed.count === "number" && parsed.count >= 0 ? parsed.count : 0;
    const rawTotal =
      typeof parsed.totalCount === "number" && parsed.totalCount >= 0
        ? parsed.totalCount
        : rawCount;

    if (parsed.date === todayJst) {
      return {
        date: todayJst,
        count: rawCount,
        totalCount: Math.max(rawTotal, rawCount),
      };
    }

    // JST day has rolled over: daily count resets to 0, cumulative totalCount is preserved
    return {
      date: todayJst,
      count: 0,
      totalCount: rawTotal,
    };
  } catch {
    return { date: todayJst, count: 0, totalCount: 0 };
  }
}

/**
 * Computes the current quota status for custom 3-word sentence generation.
 */
export function getCustomGenerateQuota(
  planOverride?: UserPlanType,
  now: Date = new Date()
): CustomGenerateQuotaStatus {
  const plan = resolveEffectivePlan(planOverride, now);
  const counter = getCustomGenerateCounter(now);
  const { limit, isCumulative } = getPlanCustomLimit(plan);
  const used = isCumulative ? counter.totalCount : counter.count;
  const remaining = Math.max(0, limit - used);

  return {
    plan,
    date: counter.date,
    dateKey: counter.date,
    usedToday: counter.count,
    usedTotal: counter.totalCount,
    used,
    usedCount: used,
    limit,
    maxLimit: limit,
    remaining,
    remainingCount: remaining,
    canGenerate: remaining > 0,
    isCumulative,
    isDaily: !isCumulative,
  };
}

export const getCustomGenerationQuota = getCustomGenerateQuota;

/**
 * Increments the custom generation counter by 1 (if quota allows) and persists it in localStorage.
 */
export function consumeCustomGenerateQuota(
  planOverride?: UserPlanType,
  now: Date = new Date()
): CustomGenerateQuotaStatus & { success: boolean; quota: CustomGenerateQuotaStatus } {
  const currentQuota = getCustomGenerateQuota(planOverride, now);
  if (!currentQuota.canGenerate) {
    return {
      ...currentQuota,
      success: false,
      quota: currentQuota,
    };
  }

  const current = getCustomGenerateCounter(now);
  const nextCount = current.count + 1;
  const nextTotal = current.totalCount + 1;

  if (typeof window !== "undefined") {
    try {
      const record: CustomGenerateCounterRecord = {
        date: current.date,
        count: nextCount,
        totalCount: nextTotal,
      };
      localStorage.setItem(KEY_CUSTOM_GENERATE_DAILY_COUNT, JSON.stringify(record));
      window.dispatchEvent(new Event("shadowlog:custom-words-update"));
    } catch {
      // ignore storage errors
    }
  }

  const updated = getCustomGenerateQuota(planOverride, now);
  return {
    ...updated,
    success: true,
    quota: updated,
  };
}

export const consumeCustomGenerationQuota = consumeCustomGenerateQuota;

/**
 * Generates candidate word chips from the selected industry and the user's weak word list.
 */
export function getSuggestedCustomWordChips(
  industry: Industry,
  weakWordsOverride?: string[],
  maxTotal: number = 6
): {
  industryChips: SuggestedWordChip[];
  weakChips: SuggestedWordChip[];
  weakWordChips: string[];
  recommendedChips: SuggestedWordChip[];
} {
  const normInd = normalizeIndustry(industry);
  const indList = INDUSTRY_SUGGESTED_WORDS[normInd] || INDUSTRY_SUGGESTED_WORDS.tech;

  const industryChips: SuggestedWordChip[] = indList.map((item) => ({
    word: item.word,
    label: `${item.word} (${item.meaning})`,
    source: "industry" as const,
  }));

  let weakWords: string[] = [];
  if (Array.isArray(weakWordsOverride)) {
    weakWords = weakWordsOverride;
  } else if (typeof window !== "undefined") {
    try {
      const storedWeak = getWeakWords();
      weakWords = storedWeak.words
        .filter((w) => !w.mastered)
        .sort((a, b) => b.errorCount - a.errorCount)
        .slice(0, 6)
        .map((w) => w.word);
    } catch {
      weakWords = [];
    }
  }

  const uniqueWeakWords = Array.from(
    new Set(weakWords.map((w) => w.trim()).filter((w) => w.length > 0))
  ).slice(0, 6);

  const weakChips: SuggestedWordChip[] = uniqueWeakWords.map((w) => ({
    word: w,
    label: w,
    source: "weak" as const,
  }));

  // Combine up to maxTotal (prioritizing up to 3 weak words + remaining from industry)
  const seen = new Set<string>();
  const recommendedChips: SuggestedWordChip[] = [];

  for (const chip of weakChips.slice(0, 3)) {
    const lower = chip.word.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      recommendedChips.push(chip);
    }
  }

  for (const chip of industryChips) {
    if (recommendedChips.length >= maxTotal) break;
    const lower = chip.word.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      recommendedChips.push(chip);
    }
  }

  return {
    industryChips,
    weakChips,
    weakWordChips: uniqueWeakWords,
    recommendedChips,
  };
}

export const getSuggestedWordChips = getSuggestedCustomWordChips;
