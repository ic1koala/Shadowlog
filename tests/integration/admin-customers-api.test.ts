import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock Supabase
vi.mock("@supabase/supabase-js", () => {
  return {
    createClient: vi.fn(() => ({
      auth: {
        admin: {
          listUsers: vi.fn().mockResolvedValue({
            data: {
              users: [
                {
                  id: "user-1",
                  email: "user1@example.com",
                  created_at: new Date().toISOString(),
                },
              ],
            },
            error: null,
          }),
        },
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: { email: "shadowlog.app@gmail.com" },
          },
          error: null,
        }),
      },
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          return {
            select: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: "user-1",
                    email: "user1@example.com",
                    plan: "free",
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  },
                  {
                    id: "user-admin",
                    email: "shadowlog.app@gmail.com",
                    plan: "pro",
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  },
                ],
                error: null,
              }),
            }),
          };
        }
        if (table === "user_tickets") {
          return {
            select: vi.fn().mockResolvedValue({
              data: [
                {
                  user_id: "user-1",
                  tickets_used: 3,
                  pro_trials_used: 1,
                  daily_practice_count: 2,
                  last_practice_date: "2026-09-27",
                },
              ],
              error: null,
            }),
          };
        }
        if (table === "practice_sessions") {
          return {
            select: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: "session-1",
                    user_id: "user-1",
                    created_at: new Date().toISOString(),
                  },
                ],
                error: null,
              }),
            }),
          };
        }
        return {
          select: vi.fn().mockResolvedValue({ data: [], error: null }),
        };
      }),
    })),
  };
});

import { GET as adminCustomersHandler } from "@/app/api/admin/customers/route";

describe("GET /api/admin/customers Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 403 Forbidden when no admin credentials are provided", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/customers", {
      method: "GET",
    });

    const res = await adminCustomersHandler(req);
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toContain("管理者権限が必要です");
  });

  it("returns 403 Forbidden when non-admin email is supplied in test header", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/customers", {
      method: "GET",
      headers: {
        "x-mock-admin-email": "randomuser@example.com",
      },
    });

    const res = await adminCustomersHandler(req);
    expect(res.status).toBe(403);
  });

  it("returns 200 and customer data structure when valid admin email is provided", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/customers", {
      method: "GET",
      headers: {
        "x-mock-admin-email": "shadowlog.app@gmail.com",
      },
    });

    const res = await adminCustomersHandler(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json).toHaveProperty("customers");
    expect(Array.isArray(json.customers)).toBe(true);
    expect(json.customers.length).toBe(2);

    const user1 = json.customers.find((c: { id: string }) => c.id === "user-1");
    expect(user1).toBeDefined();
    expect(user1.email).toBe("user1@example.com");
    expect(user1.tickets_used).toBe(3);
    expect(user1.practice_count).toBe(1);

    expect(json).toHaveProperty("kpi");
    expect(json.kpi.totalCustomers).toBe(2);
    expect(json.kpi.paidOrProCount).toBe(1);
    expect(json.kpi.totalPracticeSessions).toBe(1);
  });
});
