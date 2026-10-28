import { describe, it, expect, beforeEach } from "vitest";
import {
  extractYouTubeVideoId,
  cleanHtmlText,
  extractTextFromPdfBuffer,
} from "@/lib/scrap/parser";
import {
  addScrapSource,
  getScrapStore,
  deleteScrapSource,
  setActiveScrapSource,
  getActiveScrapSource,
  isScrapEligible,
  MAX_PRO_SCRAP_SOURCES,
  getGenerationSource,
  setGenerationSource,
  resolveEffectiveGenerationSource,
} from "@/lib/storage/scrap-store";
import { saveCustomWords, consumeCustomGenerationQuota } from "@/lib/storage/custom-words-store";
import { savePersonaProfile, consumePersonaDailyQuota, BASE_PERSONA_DAILY_LIMIT } from "@/lib/storage/persona-store";

describe("Scrap / Doc Shadow Suite", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("extractYouTubeVideoId", () => {
    it("extracts 11-char ID from standard watch URL", () => {
      const url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
      expect(extractYouTubeVideoId(url)).toBe("dQw4w9WgXcQ");
    });

    it("extracts ID from youtu.be short URL", () => {
      const url = "https://youtu.be/dQw4w9WgXcQ?si=abcdef123";
      expect(extractYouTubeVideoId(url)).toBe("dQw4w9WgXcQ");
    });

    it("extracts ID from shorts URL", () => {
      const url = "https://www.youtube.com/shorts/dQw4w9WgXcQ";
      expect(extractYouTubeVideoId(url)).toBe("dQw4w9WgXcQ");
    });

    it("accepts direct 11-char video ID", () => {
      expect(extractYouTubeVideoId("dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    });

    it("returns null for invalid inputs", () => {
      expect(extractYouTubeVideoId("https://example.com/not-youtube")).toBeNull();
      expect(extractYouTubeVideoId("")).toBeNull();
    });
  });

  describe("cleanHtmlText", () => {
    it("removes script tags and html markup", () => {
      const html = "<div><p>Hello <b>World</b>!</p><script>alert('bad');</script></div>";
      const cleaned = cleanHtmlText(html);
      expect(cleaned).toBe("Hello World !");
    });
  });

  describe("extractTextFromPdfBuffer", () => {
    it("extracts readable text from PDF text operators", () => {
      const fakePdfContent =
        "%PDF-1.4\n1 0 obj\n<< /Length 120 >>\nstream\nBT\n(Our quarterly cloud architecture migration improved system reliability by forty percent.) Tj\n[(Furthermore, ) -10 (automated testing reduced deployment bottlenecks significantly.)] TJ\nET\nendstream\nendobj";
      const buffer = Buffer.from(fakePdfContent, "latin1");
      const text = extractTextFromPdfBuffer(buffer);
      expect(text).toContain("Our quarterly cloud architecture migration");
      expect(text).toContain("automated testing reduced deployment bottlenecks");
    });
  });

  describe("Scrap Store Management", () => {
    it("allows adding sources up to MAX_PRO_SCRAP_SOURCES (5) and persists rawText", () => {
      for (let i = 0; i < MAX_PRO_SCRAP_SOURCES; i++) {
        const res = addScrapSource({
          type: "pdf",
          title: `PDF Doc ${i + 1}`,
          rawText: `Full raw PDF text body for document ${i + 1} with multiple paragraphs.`,
          extractedPassage: `This is a test passage for item ${i + 1}.`,
        });
        expect(res.success).toBe(true);
        expect(res.source?.rawText).toContain(`Full raw PDF text body for document ${i + 1}`);
      }

      // 6th item must be rejected
      const overflow = addScrapSource({
        type: "web",
        title: "Overflow Article",
        extractedPassage: "Overflow text",
      });
      expect(overflow.success).toBe(false);
      expect(overflow.error).toContain("上限");

      const store = getScrapStore();
      expect(store.sources.length).toBe(MAX_PRO_SCRAP_SOURCES);
    });

    it("supports switching active source and deletion", () => {
      const item1 = addScrapSource({
        type: "youtube",
        title: "Item 1",
        extractedPassage: "Passage 1",
      });
      const item2 = addScrapSource({
        type: "text",
        title: "Item 2",
        extractedPassage: "Passage 2",
      });

      expect(getActiveScrapSource()?.id).toBe(item2.source?.id);

      setActiveScrapSource(item1.source?.id || "");
      expect(getActiveScrapSource()?.id).toBe(item1.source?.id);

      deleteScrapSource(item1.source?.id || "");
      const store = getScrapStore();
      expect(store.sources.length).toBe(1);
      expect(store.sources[0].id).toBe(item2.source?.id);
    });

    it("checks Pro / VIP eligibility", () => {
      expect(isScrapEligible("guest")).toBe(false);
      expect(isScrapEligible("free")).toBe(false);
      expect(isScrapEligible("base")).toBe(false);
      expect(isScrapEligible("pro")).toBe(true);
    });
  });

  describe("Generation Source Pinning & Quota Fallback", () => {
    it("defaults to 'industry' and persists pinned generation source", () => {
      expect(getGenerationSource()).toBe("industry");
      setGenerationSource("scrap");
      expect(getGenerationSource()).toBe("scrap");
    });

    it("falls back to 'industry' when 'scrap' is selected by Free/Base user or when no scrap exists", () => {
      setGenerationSource("scrap");
      // Free user
      const resFree = resolveEffectiveGenerationSource("free");
      expect(resFree.effectiveSource).toBe("industry");
      expect(resFree.fallbackNotice).toContain("Proプラン限定");

      // Pro user but no scrap saved yet
      const resProEmpty = resolveEffectiveGenerationSource("pro");
      expect(resProEmpty.effectiveSource).toBe("industry");
      expect(resProEmpty.fallbackNotice).toContain("未登録");

      // Pro user with saved PDF scrap
      addScrapSource({
        type: "pdf",
        title: "Enterprise Strategy.pdf",
        rawText: "Full PDF text for dynamic phrase generation.",
        extractedPassage: "Initial excerpt.",
      });
      const resProReady = resolveEffectiveGenerationSource("pro");
      expect(resProReady.effectiveSource).toBe("scrap");
      expect(resProReady.fallbackNotice).toBeUndefined();
    });

    it("falls back to 'industry' when 'custom_words' trial/daily quota is exhausted", () => {
      setGenerationSource("custom_words");
      saveCustomWords(["scalability", "latency", "deploy"]);

      // Free user has 2 cumulative uses
      expect(resolveEffectiveGenerationSource("free").effectiveSource).toBe("custom_words");
      consumeCustomGenerationQuota("free");
      consumeCustomGenerationQuota("free");

      const afterExhausted = resolveEffectiveGenerationSource("free");
      expect(afterExhausted.effectiveSource).toBe("industry");
      expect(afterExhausted.fallbackNotice).toContain("使い切ったため");
    });

    it("falls back to 'industry' when 'persona' daily quota is exhausted", () => {
      setGenerationSource("persona");
      savePersonaProfile({
        enabled: true,
        jobRole: "海外営業",
        industryField: "半導体",
        targetScenario: "商談・契約交渉",
      });

      // Base user has 5 daily uses
      expect(resolveEffectiveGenerationSource("base").effectiveSource).toBe("persona");
      for (let i = 0; i < BASE_PERSONA_DAILY_LIMIT; i++) {
        consumePersonaDailyQuota("base");
      }

      const afterExhausted = resolveEffectiveGenerationSource("base");
      expect(afterExhausted.effectiveSource).toBe("industry");
      expect(afterExhausted.fallbackNotice).toContain("使い切ったため");
    });
  });
});
