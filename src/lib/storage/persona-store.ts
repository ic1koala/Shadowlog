import { UserPlanType } from "@/types";
import { getPlanType } from "@/lib/storage/user-learning-store";
import { isInvitedVip } from "@/lib/auth/vip-checker";

export interface UserPersonaProfile {
  enabled: boolean;
  jobRole: string;
  industryField: string;
  targetScenario: string;
  interestedTopics?: string;
  customTone?: "casual" | "polite" | "executive";
  updatedAt?: string;
}

const KEY_PERSONA = "shadowlog_user_persona";

/**
 * Checks whether a given plan is eligible for the Persona feature.
 * - Free / Guest: False (Persona setting NOT needed / locked)
 * - Base / Pro / VIP: True (Persona customization enabled)
 */
export function isPersonaEligible(plan?: UserPlanType | null): boolean {
  if (typeof window !== "undefined" && isInvitedVip()) {
    return true;
  }
  const effectivePlan = plan || getPlanType();
  return effectivePlan === "base" || effectivePlan === "pro";
}

/**
 * Loads the stored Persona profile from localStorage.
 */
export function getPersonaProfile(): UserPersonaProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY_PERSONA);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UserPersonaProfile;
    if (typeof parsed !== "object" || parsed === null) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Saves or updates the Persona profile in localStorage.
 */
export function savePersonaProfile(profile: UserPersonaProfile): void {
  if (typeof window === "undefined") return;
  try {
    const dataToSave: UserPersonaProfile = {
      ...profile,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(KEY_PERSONA, JSON.stringify(dataToSave));
    window.dispatchEvent(new Event("shadowlog:persona-update"));
  } catch {
    // ignore
  }
}

/**
 * Clears the Persona profile.
 */
export function clearPersonaProfile(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(KEY_PERSONA);
    window.dispatchEvent(new Event("shadowlog:persona-update"));
  } catch {
    // ignore
  }
}

/**
 * Preset examples for quick selection in the Persona settings UI
 */
export const PERSONA_ROLE_PRESETS = [
  "海外営業・アカウントエグゼクティブ",
  "ソフトウェアエンジニア / テックリード",
  "プロダクトマネージャー (PdM)",
  "マーケティング・グロース担当",
  "事業開発 (BizDev)・アライアンス",
  "経営企画・財務・アナリスト",
  "人事・グローバル採用担当",
  "カスタマーサクセス (CS)",
  "コンサルタント / PMO",
  "研究開発・設計エンジニア",
];

export const PERSONA_FIELD_PRESETS = [
  "製造業・半導体・エレクトロニクス",
  "IT・クラウド・SaaS",
  "生成AI・データサイエンス",
  "医療・ヘルスケア・製薬",
  "金融・Fintech・投資",
  "EC・小売・D2C",
  "自動車・モビリティ",
  "通信・インフラ",
  "広告・メディア・エンタメ",
  "教育・HR・人材",
];

export const PERSONA_SCENARIO_PRESETS = [
  "海外顧客・パートナーとの商談・契約交渉",
  "毎朝のデイリースタンドアップ・進捗共有",
  "英語でのプレゼンテーション・登壇・質疑応答",
  "海外チームとの1on1・人事面談",
  "不具合・トラブル発生時の緊急対応・原因説明",
  "グローバル会議でのファシリテーション・議論",
  "英語メール・チャットでの仕様すり合わせ",
  "カジュアルな雑談・同僚とのスモールトーク",
];
