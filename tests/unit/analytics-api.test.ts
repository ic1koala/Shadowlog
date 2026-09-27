import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST as postAnalytics, GET as getAnalytics } from "@/app/api/analytics/log/route";

describe("Analytics Log API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("In-Memory fallback", () => {
    it("POST /api/analytics/log records visitor successfully in memory", async () => {
      const req = new NextRequest("http://localhost:3000/api/analytics/log", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": "192.168.1.1",
          "user-agent": "Vitest-Test-Agent",
        },
        body: JSON.stringify({
          path: "/practice",
          userType: "base",
          visitorId: "test-visitor-uuid-1234",
        }),
      });

      const res = await postAnalytics(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
    });

    it("GET /api/analytics/log returns analytics metrics", async () => {
      const res = await getAnalytics();
      expect(res.status).toBe(200);
      const json = await res.json();

      expect(json).toHaveProperty("today");
      expect(json).toHaveProperty("past14Days");
      expect(json).toHaveProperty("pathRanking");
      expect(json).toHaveProperty("userTypes");
      expect(json).toHaveProperty("totalPv");

      expect(Array.isArray(json.past14Days)).toBe(true);
      expect(json.past14Days.length).toBe(14);
      expect(Array.isArray(json.pathRanking)).toBe(true);
      expect(json.source).toBe("memory");
    });
  });
});
