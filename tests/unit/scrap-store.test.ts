import { describe, it, expect, beforeEach } from "vitest";
import {
  extractYouTubeVideoId,
  cleanHtmlText,
} from "@/lib/scrap/parser";
import {
  addScrapSource,
  getScrapStore,
  deleteScrapSource,
  setActiveScrapSource,
  getActiveScrapSource,
  isScrapEligible,
  MAX_PRO_SCRAP_SOURCES,
} from "@/lib/storage/scrap-store";

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

  describe("Scrap Store Management", () => {
    it("allows adding sources up to MAX_PRO_SCRAP_SOURCES (5)", () => {
      for (let i = 0; i < MAX_PRO_SCRAP_SOURCES; i++) {
        const res = addScrapSource({
          type: "youtube",
          title: `Video ${i + 1}`,
          extractedPassage: `This is a test passage for item ${i + 1}.`,
        });
        expect(res.success).toBe(true);
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
});
