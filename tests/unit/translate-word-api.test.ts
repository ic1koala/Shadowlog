import { describe, it, expect } from "vitest";
import { POST } from "@/app/api/translate-word/route";
import { NextRequest } from "next/server";

describe("POST /api/translate-word", () => {
  it("returns 400 when word is missing", async () => {
    const req = new NextRequest("http://localhost:3000/api/translate-word", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Word is required");
  });

  it("handles valid word request gracefully even without OpenAI API key", async () => {
    const req = new NextRequest("http://localhost:3000/api/translate-word", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ word: "pipeline" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.translation).toBeDefined();
  });
});
