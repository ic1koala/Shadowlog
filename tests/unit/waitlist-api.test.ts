import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST as postWaitlist, GET as getWaitlist } from "@/app/api/waitlist/route";

describe("Waitlist API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/waitlist validation & registration", () => {
    it("returns 400 when email is empty", async () => {
      const req = new NextRequest("http://localhost:3000/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "" }),
      });

      const res = await postWaitlist(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("メールアドレスを入力してください");
    });

    it("returns 400 when email format is invalid", async () => {
      const req = new NextRequest("http://localhost:3000/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "invalid-email-string" }),
      });

      const res = await postWaitlist(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("有効なメールアドレス形式");
    });

    it("registers new subscriber successfully and returns 200", async () => {
      const uniqueEmail = `tester-${Date.now()}@example.com`;
      const req = new NextRequest("http://localhost:3000/api/waitlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": "127.0.0.1",
        },
        body: JSON.stringify({
          email: uniqueEmail,
          metadata: { source: "hero_test" },
        }),
      });

      const res = await postWaitlist(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.alreadyRegistered).toBe(false);
      expect(json.message).toContain("事前登録が完了しました");
    });

    it("handles duplicate subscriber gracefully with 200 and alreadyRegistered flag", async () => {
      const duplicateEmail = `duplicate-${Date.now()}@example.com`;
      const reqPayload = {
        email: duplicateEmail,
        metadata: { source: "footer_test" },
      };

      // First submission
      const req1 = new NextRequest("http://localhost:3000/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reqPayload),
      });
      const res1 = await postWaitlist(req1);
      expect(res1.status).toBe(200);

      // Second submission with identical email
      const req2 = new NextRequest("http://localhost:3000/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reqPayload),
      });
      const res2 = await postWaitlist(req2);
      expect(res2.status).toBe(200);
      const json2 = await res2.json();
      expect(json2.success).toBe(true);
      expect(json2.alreadyRegistered).toBe(true);
      expect(json2.message).toContain("すでにご登録いただいております");
    });
  });

  describe("GET /api/waitlist counts & admin visibility", () => {
    it("returns public count for non-admin request", async () => {
      const req = new NextRequest("http://localhost:3000/api/waitlist", {
        method: "GET",
      });

      const res = await getWaitlist(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toHaveProperty("count");
      expect(typeof json.count).toBe("number");
      expect(json.isAdmin).toBe(false);
      expect(json.subscribers).toBeUndefined();
    });

    it("returns subscribers list when requested with admin credentials", async () => {
      const req = new NextRequest("http://localhost:3000/api/waitlist", {
        method: "GET",
        headers: {
          "x-mock-admin-email": "shadowlog.app@gmail.com",
        },
      });

      const res = await getWaitlist(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.isAdmin).toBe(true);
      expect(json).toHaveProperty("count");
      expect(Array.isArray(json.subscribers)).toBe(true);
    });
  });
});
