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
    expect(user1.today_practice_count).toBe(1);
    expect(user1.active_days).toBe(1);
    expect(user1.daily_average_practice).toBe(1);
    expect(user1.projected_monthly_practices).toBe(30);
    expect(user1.projected_monthly_cost).toBe(10); // Math.round(30 * 0.322) = 10
    expect(user1.breakeven_daily_limit).toBe(0);
    expect(user1.cost_risk_status).toBe("free");

    expect(json).toHaveProperty("kpi");
    expect(json.kpi.totalCustomers).toBe(2);
    expect(json.kpi.paidOrProCount).toBe(1);
    expect(json.kpi.totalPracticeSessions).toBe(1);
    expect(json.kpi.overallDailyAverage).toBe(1);
    expect(json.kpi.topUserDailyCount).toBe(1);
    expect(json.kpi.warningAccountCount).toBe(0);
  });

  it("calculates correct breakeven limits and risk statuses for base and pro users", async () => {
    // Dynamically override supabase mock for this specific scenario
    const { createClient } = await import("@supabase/supabase-js");
    const mockCreateClient = vi.mocked(createClient);

    mockCreateClient.mockReturnValueOnce({
      auth: {
        admin: {
          listUsers: vi.fn().mockResolvedValue({
            data: { users: [] },
            error: null,
          }),
        },
        getUser: vi.fn().mockResolvedValue({
          data: { user: { email: "shadowlog.app@gmail.com" } },
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
                    id: "user-base-safe",
                    email: "base_safe@example.com",
                    plan: "base",
                    created_at: "2026-09-01T00:00:00Z",
                  },
                  {
                    id: "user-base-warning",
                    email: "base_warn@example.com",
                    plan: "base",
                    created_at: "2026-09-01T00:00:00Z",
                  },
                  {
                    id: "user-base-danger",
                    email: "base_danger@example.com",
                    plan: "base",
                    created_at: "2026-09-01T00:00:00Z",
                  },
                  {
                    id: "user-pro-safe",
                    email: "pro_safe@example.com",
                    plan: "pro",
                    created_at: "2026-09-01T00:00:00Z",
                  },
                ],
                error: null,
              }),
            }),
          };
        }
        if (table === "user_tickets") {
          return {
            select: vi.fn().mockResolvedValue({ data: [], error: null }),
          };
        }
        if (table === "practice_sessions") {
          // Generate session data
          // base-safe: 10 sessions across 1 day -> 10/day (10 < 25 -> safe)
          // base-warn: 30 sessions across 1 day -> 30/day (25 <= 30 < 40 -> warning)
          // base-danger: 45 sessions across 1 day -> 45/day (45 >= 40 -> danger)
          // pro-safe: 60 sessions across 1 day -> 60/day (60 < 73.5 -> safe, limit 147)
          const sessionsList: Array<{ id: string; user_id: string; created_at: string }> = [];

          for (let i = 0; i < 10; i++) {
            sessionsList.push({ id: `s-bs-${i}`, user_id: "user-base-safe", created_at: "2026-09-20T10:00:00Z" });
          }
          for (let i = 0; i < 30; i++) {
            sessionsList.push({ id: `s-bw-${i}`, user_id: "user-base-warning", created_at: "2026-09-20T10:00:00Z" });
          }
          for (let i = 0; i < 45; i++) {
            sessionsList.push({ id: `s-bd-${i}`, user_id: "user-base-danger", created_at: "2026-09-20T10:00:00Z" });
          }
          for (let i = 0; i < 60; i++) {
            sessionsList.push({ id: `s-ps-${i}`, user_id: "user-pro-safe", created_at: "2026-09-20T10:00:00Z" });
          }

          return {
            select: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: sessionsList,
                error: null,
              }),
            }),
          };
        }
        return {
          select: vi.fn().mockResolvedValue({ data: [], error: null }),
        };
      }),
    } as any);

    const req = new NextRequest("http://localhost:3000/api/admin/customers", {
      method: "GET",
      headers: {
        "x-mock-admin-email": "shadowlog.app@gmail.com",
      },
    });

    const res = await adminCustomersHandler(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    const baseSafe = json.customers.find((c: any) => c.id === "user-base-safe");
    const baseWarn = json.customers.find((c: any) => c.id === "user-base-warning");
    const baseDanger = json.customers.find((c: any) => c.id === "user-base-danger");
    const proSafe = json.customers.find((c: any) => c.id === "user-pro-safe");

    expect(baseSafe.breakeven_daily_limit).toBe(50);
    expect(baseSafe.daily_average_practice).toBe(10);
    expect(baseSafe.cost_risk_status).toBe("safe");

    expect(baseWarn.breakeven_daily_limit).toBe(50);
    expect(baseWarn.daily_average_practice).toBe(30);
    expect(baseWarn.cost_risk_status).toBe("warning");

    expect(baseDanger.breakeven_daily_limit).toBe(50);
    expect(baseDanger.daily_average_practice).toBe(45);
    expect(baseDanger.cost_risk_status).toBe("danger");

    expect(proSafe.breakeven_daily_limit).toBe(147);
    expect(proSafe.daily_average_practice).toBe(60);
    expect(proSafe.cost_risk_status).toBe("safe");

    // KPI verification
    expect(json.kpi.warningAccountCount).toBe(2); // base-warn and base-danger
    expect(json.kpi.topUserDailyCount).toBe(60); // pro-safe has 60
    // Overall daily average: (10 + 30 + 45 + 60) / 4 = 145 / 4 = 36.25 -> 36.3
    expect(json.kpi.overallDailyAverage).toBe(36.3);
  });
});
