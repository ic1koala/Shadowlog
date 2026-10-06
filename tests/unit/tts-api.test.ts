import { describe, it, expect, vi } from "vitest";
import { GET, POST } from "@/app/api/tts/route";
import { NextRequest } from "next/server";

// Mock openai
vi.mock("@/lib/ai/openai", () => ({
  getOpenAIClient: vi.fn(() => ({
    audio: {
      speech: {
        create: vi.fn().mockResolvedValue({
          arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(16)),
        }),
      },
    },
  })),
}));

describe("GET /api/tts", () => {
  it("returns 400 when text query parameter is missing", async () => {
    const req = new NextRequest("http://localhost:3000/api/tts");
    const res = await GET(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toContain("text parameter is required");
  });

  it("returns 200 and audio/mpeg when valid word is provided", async () => {
    const req = new NextRequest("http://localhost:3000/api/tts?text=infrastructure");
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("audio/mpeg");
    expect(res.headers.get("Cache-Control")).toContain("public");
  });
});

describe("POST /api/tts", () => {
  it("returns 400 when text is missing in JSON body", async () => {
    const req = new NextRequest("http://localhost:3000/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ level: "intermediate" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 200 and audioBase64 when valid sentence text is provided", async () => {
    const req = new NextRequest("http://localhost:3000/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: "We need to review our quarterly sales pipeline before the meeting.",
        level: "intermediate",
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(typeof json.audioBase64).toBe("string");
    expect(json.audioBase64.length).toBeGreaterThan(0);
  });
});

