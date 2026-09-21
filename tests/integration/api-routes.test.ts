import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { POST as generateSentenceHandler } from "@/app/api/generate-sentence/route";
import { POST as transcribeDiffHandler } from "@/app/api/transcribe-diff/route";

describe("API Routes Integration Tests", () => {
  describe("POST /api/generate-sentence", () => {
    it("returns valid sentence response for valid request", async () => {
      const req = new NextRequest("http://localhost:3000/api/generate-sentence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          industry: "tech",
          level: "intermediate",
        }),
      });

      const res = await generateSentenceHandler(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json).toHaveProperty("id");
      expect(json).toHaveProperty("english");
      expect(typeof json.english).toBe("string");
      expect(json.english.length).toBeGreaterThan(0);
      expect(json).toHaveProperty("japanese");
      expect(json.industry).toBe("tech");
      expect(json.level).toBe("intermediate");
      expect(json.wordCount).toBeGreaterThan(0);
    });

    it("returns 400 when body is invalid JSON", async () => {
      const req = new NextRequest("http://localhost:3000/api/generate-sentence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "invalid-json-content",
      });

      const res = await generateSentenceHandler(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("Invalid JSON body");
    });
  });

  describe("POST /api/transcribe-diff", () => {
    it("returns 400 when originalText is missing", async () => {
      const req = new NextRequest("http://localhost:3000/api/transcribe-diff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const res = await transcribeDiffHandler(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("originalText is required");
    });

    it("returns 400 when audio data is missing", async () => {
      const req = new NextRequest("http://localhost:3000/api/transcribe-diff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalText: "The system is functioning properly.",
        }),
      });

      const res = await transcribeDiffHandler(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("Audio data is missing or empty");
    });

    it("calculates diff using mock transcription header for testing", async () => {
      const originalText = "Continuous integration accelerates deployment velocity.";
      const spokenText = "Continuous integration accelerates deployment velocity.";

      const req = new NextRequest("http://localhost:3000/api/transcribe-diff", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-mock-transcription": spokenText,
        },
        body: JSON.stringify({
          originalText,
        }),
      });

      const res = await transcribeDiffHandler(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.transcription).toBe(spokenText);
      expect(json.diff.accuracyScore).toBe(100);
      expect(json.diff.matchedWordCount).toBe(5);
    });

    it("detects differences accurately via route handler", async () => {
      const originalText = "We should prioritize customer security.";
      const spokenText = "We should prioritize customer satisfaction.";

      const req = new NextRequest("http://localhost:3000/api/transcribe-diff", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-mock-transcription": spokenText,
        },
        body: JSON.stringify({
          originalText,
        }),
      });

      const res = await transcribeDiffHandler(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.diff.matchedWordCount).toBe(4);
      expect(json.diff.accuracyScore).toBeLessThan(100);
      const missing = json.diff.tokens.filter((t: { status: string }) => t.status === "missing");
      expect(missing.some((m: { word: string }) => m.word.includes("security"))).toBe(true);
    });
  });
});
