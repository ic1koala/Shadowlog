import { describe, it, expect, beforeEach } from "vitest";
import { getChunkSlashIndices } from "@/lib/diff/chunk-splitter";
import {
  getAdminPreviewSettings,
  setAdminPreviewSettings,
} from "@/lib/storage/admin-preview-store";

describe("Chunk Splitter & Admin Preview Store Unit Tests", () => {
  describe("getChunkSlashIndices", () => {
    it("returns empty set for very short sentences (<= 3 words)", () => {
      const words = ["Hello", "world", "today."];
      const indices = getChunkSlashIndices(words);
      expect(indices.size).toBe(0);
    });

    it("never places a slash after the last word of a sentence", () => {
      const words = "We are building a scalable cloud platform for global enterprise customers.".split(" ");
      const indices = getChunkSlashIndices(words);
      expect(indices.has(words.length - 1)).toBe(false);
    });

    it("always breaks right after comma or clause punctuation", () => {
      const words = "When the server restarts, the cache is automatically refreshed.".split(" ");
      // "restarts," is at index 3
      const indices = getChunkSlashIndices(words);
      expect(indices.has(3)).toBe(true);
    });

    it("splits before relative pronouns and subordinating conjunctions", () => {
      const words = "Our team developed a system that processes real-time audio streams.".split(" ");
      // "system" is at index 4, followed by "that" at index 5
      const indices = getChunkSlashIndices(words);
      expect(indices.has(4)).toBe(true);
    });

    it("splits before prepositions when current chunk has 3 or more words", () => {
      const words = "Continuous integration accelerates software delivery across multiple engineering teams.".split(" ");
      // "Continuous"(0) "integration"(1) "accelerates"(2) "software"(3) "delivery"(4) | "across"(5)
      const indices = getChunkSlashIndices(words);
      expect(indices.has(4)).toBe(true);
    });

    it("protects common collocations with 'to' (want to, need to, have to, according to)", () => {
      const words = "All engineers need to verify their configuration before deploying to production.".split(" ");
      // "All"(0) "engineers"(1) "need"(2) "to"(3) -> must NOT split at index 2 ("need / to")
      const indices = getChunkSlashIndices(words);
      expect(indices.has(2)).toBe(false);
      // Should split before "before" (index 6: "configuration")
      expect(indices.has(6)).toBe(true);
    });
  });

  describe("admin-preview-store", () => {
    beforeEach(() => {
      if (typeof window !== "undefined") {
        localStorage.clear();
      }
    });

    it("defaults chunkSlash to false and persists updates", () => {
      const initial = getAdminPreviewSettings();
      expect(initial.chunkSlash).toBe(false);

      const updated = setAdminPreviewSettings({ chunkSlash: true });
      expect(updated.chunkSlash).toBe(true);
      expect(getAdminPreviewSettings().chunkSlash).toBe(true);

      setAdminPreviewSettings({ chunkSlash: false });
      expect(getAdminPreviewSettings().chunkSlash).toBe(false);
    });
  });
});
