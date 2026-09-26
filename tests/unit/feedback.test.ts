import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST as feedbackHandler } from "@/app/api/feedback/route";

describe("POST /api/feedback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when category is missing", async () => {
    const req = new NextRequest("http://localhost:3000/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "test@example.com",
        content: "ボタンが押せません",
      }),
    });

    const res = await feedbackHandler(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("必須です");
  });

  it("returns 400 when email is invalid", async () => {
    const req = new NextRequest("http://localhost:3000/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: "bug",
        email: "not-an-email",
        content: "テスト内容",
      }),
    });

    const res = await feedbackHandler(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("有効なメールアドレス");
  });

  it("returns 400 when content is missing", async () => {
    const req = new NextRequest("http://localhost:3000/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: "bug",
        email: "test@example.com",
        content: "",
      }),
    });

    const res = await feedbackHandler(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("必須です");
  });

  it("returns 200 with success for valid payload", async () => {
    const req = new NextRequest("http://localhost:3000/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: "feature_request",
        email: "tester@example.com",
        content: "スピード調整機能が欲しいです",
        environmentInfo: {
          platform: "MacIntel",
          language: "ja-JP",
        },
      }),
    });

    const res = await feedbackHandler(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.message).toContain("受け付けました");
  });
});
