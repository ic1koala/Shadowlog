import { describe, it, expect, vi } from "vitest";
import { GET } from "@/app/api/tts/route";
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
