import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  isPersonaEligible,
  getPersonaProfile,
  savePersonaProfile,
  clearPersonaProfile,
  UserPersonaProfile,
} from "@/lib/storage/persona-store";
import {
  getSentenceGenerationPrompt,
  getPassageGenerationPrompt,
} from "@/lib/ai/prompts";

describe("Persona Feature & Prompt Integration", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe("isPersonaEligible Plan Gatekeeper", () => {
    it("returns false for Free and Guest plans", () => {
      expect(isPersonaEligible("free")).toBe(false);
      expect(isPersonaEligible("guest")).toBe(false);
    });

    it("returns true for Base and Pro plans", () => {
      expect(isPersonaEligible("base")).toBe(true);
      expect(isPersonaEligible("pro")).toBe(true);
    });

    it("returns true for invited VIP users even if plan is free or empty", () => {
      localStorage.setItem("shadowlog_invited_vip", "true");
      expect(isPersonaEligible("free")).toBe(true);
      expect(isPersonaEligible(null)).toBe(true);
    });
  });

  describe("Storage Operations (save, get, clear)", () => {
    it("returns null when no persona is saved", () => {
      expect(getPersonaProfile()).toBeNull();
    });

    it("saves and retrieves a complete persona profile", () => {
      const profile: UserPersonaProfile = {
        enabled: true,
        jobRole: "海外営業・アカウントエグゼクティブ",
        industryField: "製造業・半導体",
        targetScenario: "海外顧客との価格交渉・契約条件すり合わせ",
        interestedTopics: "半導体不足, 納期短縮, ボリュームディスカウント",
        customTone: "polite",
      };

      savePersonaProfile(profile);
      const retrieved = getPersonaProfile();

      expect(retrieved).not.toBeNull();
      expect(retrieved?.jobRole).toBe(profile.jobRole);
      expect(retrieved?.industryField).toBe(profile.industryField);
      expect(retrieved?.targetScenario).toBe(profile.targetScenario);
      expect(retrieved?.interestedTopics).toBe(profile.interestedTopics);
      expect(retrieved?.customTone).toBe("polite");
      expect(retrieved?.updatedAt).toBeDefined();
    });

    it("clears the persona profile on clearPersonaProfile", () => {
      savePersonaProfile({
        enabled: true,
        jobRole: "プロダクトマネージャー",
        industryField: "IT・SaaS",
        targetScenario: "朝のデイリースタンドアップ",
      });

      expect(getPersonaProfile()).not.toBeNull();
      clearPersonaProfile();
      expect(getPersonaProfile()).toBeNull();
    });
  });

  describe("Sentence Prompt Injection (getSentenceGenerationPrompt)", () => {
    it("injects persona profile into system and user prompts when enabled", () => {
      const persona: UserPersonaProfile = {
        enabled: true,
        jobRole: "海外営業",
        industryField: "半導体",
        targetScenario: "海外パートナーとの契約交渉",
        interestedTopics: "納期交渉, 価格調整",
        customTone: "executive",
      };

      const { systemPrompt, userPrompt } = getSentenceGenerationPrompt(
        "tech",
        "intermediate",
        undefined,
        undefined,
        undefined,
        undefined,
        persona
      );

      // System Prompt checks
      expect(systemPrompt).toContain("USER PERSONA & REAL-WORLD WORKPLACE DIRECTIVE");
      expect(systemPrompt).toContain("Hyper-Realism & Distinctive Originality Mandate");
      expect(systemPrompt).toContain("海外営業");
      expect(systemPrompt).toContain("半導体");
      expect(systemPrompt).toContain("海外パートナーとの契約交渉");
      expect(systemPrompt).toContain("納期交渉, 価格調整");
      expect(systemPrompt).toContain("executive");
      expect(systemPrompt).toContain("Terminology Exception");

      // User Prompt checks
      expect(userPrompt).toContain("Target User Persona");
      expect(userPrompt).toContain("海外営業");
      expect(userPrompt).toContain("海外パートナーとの契約交渉");
      expect(userPrompt).toContain("Hyper-Realistic Persona Immersion");
      expect(userPrompt).toContain("Distinctive & Original");
      // Seasonal timing should be omitted when persona is active to prevent dilution
      expect(userPrompt).not.toContain("Seasonal Timing & Cycle");
    });

    it("does NOT inject persona when enabled is false", () => {
      const disabledPersona: UserPersonaProfile = {
        enabled: false,
        jobRole: "海外営業",
        industryField: "半導体",
        targetScenario: "商談",
      };

      const { systemPrompt, userPrompt } = getSentenceGenerationPrompt(
        "tech",
        "intermediate",
        undefined,
        undefined,
        undefined,
        undefined,
        disabledPersona
      );

      expect(systemPrompt).not.toContain("USER PERSONA & REAL-WORLD WORKPLACE DIRECTIVE");
      expect(userPrompt).not.toContain("Target User Persona");
    });
  });

  describe("Passage Prompt Injection (getPassageGenerationPrompt)", () => {
    it("injects persona profile into passage system and user prompts when active", () => {
      const persona: UserPersonaProfile = {
        enabled: true,
        jobRole: "プロダクトマネージャー (PdM)",
        industryField: "IT・SaaS",
        targetScenario: "ロードマップ説明とステークホルダー合意形成",
        customTone: "executive",
      };

      const { systemPrompt, userPrompt } = getPassageGenerationPrompt(
        "business",
        "advanced",
        undefined,
        undefined,
        persona
      );

      expect(systemPrompt).toContain("USER PERSONA & REAL-WORLD WORKPLACE DIRECTIVE");
      expect(systemPrompt).toContain("プロダクトマネージャー (PdM)");
      expect(systemPrompt).toContain("IT・SaaS");
      expect(userPrompt).toContain("Target User Persona");
      expect(userPrompt).toContain("プロダクトマネージャー (PdM)");
    });
  });
});
