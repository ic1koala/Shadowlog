import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST as checkoutHandler } from "@/app/api/stripe/checkout/route";
import { POST as webhookHandler } from "@/app/api/stripe/webhook/route";
import { POST as portalHandler } from "@/app/api/stripe/portal/route";

// Mock Stripe Server
const mockCreateCheckoutSession = vi.fn();
const mockCreatePortalSession = vi.fn();
const mockConstructEvent = vi.fn();

vi.mock("@/lib/stripe/stripe-server", () => ({
  getStripeServer: () => ({
    checkout: {
      sessions: {
        create: mockCreateCheckoutSession,
      },
    },
    billingPortal: {
      sessions: {
        create: mockCreatePortalSession,
      },
    },
    webhooks: {
      constructEvent: mockConstructEvent,
    },
  }),
}));

// Mock Supabase Admin
const mockUpdate = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
const mockSelect = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  getSupabaseAdmin: () => ({
    from: vi.fn(() => ({
      update: mockUpdate,
      select: mockSelect,
    })),
  }),
}));

// Mock Supabase Server Auth
const mockGetUser = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => Promise.resolve({
    auth: {
      getUser: mockGetUser,
    },
  }),
}));

describe("Stripe Integration APIs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/stripe/checkout", () => {
    it("creates checkout session for Base plan (¥500)", async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: "user-123", email: "tester@example.com" } } });
      mockSelect.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      });
      mockCreateCheckoutSession.mockResolvedValue({ url: "https://checkout.stripe.com/test-base" });

      const req = new NextRequest("http://localhost:3000/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "base" }),
      });

      const res = await checkoutHandler(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.url).toBe("https://checkout.stripe.com/test-base");

      expect(mockCreateCheckoutSession).toHaveBeenCalledWith(
        expect.objectContaining({
          client_reference_id: "user-123",
          line_items: expect.arrayContaining([
            expect.objectContaining({
              price_data: expect.objectContaining({
                unit_amount: 500,
                currency: "jpy",
              }),
            }),
          ]),
          metadata: expect.objectContaining({
            userId: "user-123",
            plan: "base",
          }),
        })
      );
    });

    it("creates checkout session for Pro plan (¥1000)", async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: "user-456", email: "pro@example.com" } } });
      mockSelect.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: { stripe_customer_id: "cus_existing123" }, error: null }),
        }),
      });
      mockCreateCheckoutSession.mockResolvedValue({ url: "https://checkout.stripe.com/test-pro" });

      const req = new NextRequest("http://localhost:3000/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "pro" }),
      });

      const res = await checkoutHandler(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.url).toBe("https://checkout.stripe.com/test-pro");

      expect(mockCreateCheckoutSession).toHaveBeenCalledWith(
        expect.objectContaining({
          customer: "cus_existing123",
          line_items: expect.arrayContaining([
            expect.objectContaining({
              price_data: expect.objectContaining({
                unit_amount: 1000,
                currency: "jpy",
              }),
            }),
          ]),
        })
      );
    });
  });

  describe("POST /api/stripe/webhook", () => {
    it("handles checkout.session.completed and updates user profile plan", async () => {
      const eqMock = vi.fn().mockResolvedValue({ error: null });
      mockUpdate.mockReturnValue({ eq: eqMock });

      const webhookPayload = {
        type: "checkout.session.completed",
        data: {
          object: {
            id: "cs_test_123",
            customer: "cus_999",
            subscription: "sub_999",
            metadata: {
              userId: "user-abc",
              plan: "pro",
            },
          },
        },
      };

      const req = new NextRequest("http://localhost:3000/api/stripe/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(webhookPayload),
      });

      const res = await webhookHandler(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.received).toBe(true);

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          plan: "pro",
          stripe_customer_id: "cus_999",
          stripe_subscription_id: "sub_999",
        })
      );
      expect(eqMock).toHaveBeenCalledWith("id", "user-abc");
    });

    it("handles customer.subscription.deleted and downgrades user to free", async () => {
      const eqMock = vi.fn().mockResolvedValue({ error: null });
      mockUpdate.mockReturnValue({ eq: eqMock });
      mockSelect.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: { id: "user-to-downgrade" }, error: null }),
        }),
      });

      const webhookPayload = {
        type: "customer.subscription.deleted",
        data: {
          object: {
            id: "sub_deleted_123",
            customer: "cus_cancelled",
          },
        },
      };

      const req = new NextRequest("http://localhost:3000/api/stripe/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(webhookPayload),
      });

      const res = await webhookHandler(req);
      expect(res.status).toBe(200);

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          plan: "free",
          stripe_subscription_id: null,
        })
      );
      expect(eqMock).toHaveBeenCalledWith("id", "user-to-downgrade");
    });
  });

  describe("POST /api/stripe/portal", () => {
    it("returns 401 when user is not authenticated", async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error("Not logged in") });

      const req = new NextRequest("http://localhost:3000/api/stripe/portal", {
        method: "POST",
      });

      const res = await portalHandler(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toContain("ログインが必要");
    });

    it("returns 400 when user has no stripe_customer_id", async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: "free-user" } } });
      mockSelect.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: { stripe_customer_id: null }, error: null }),
        }),
      });

      const req = new NextRequest("http://localhost:3000/api/stripe/portal", {
        method: "POST",
      });

      const res = await portalHandler(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("有効なお支払い情報が見つかりません");
    });

    it("returns portal URL when user has stripe_customer_id", async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: "paid-user" } } });
      mockSelect.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: { stripe_customer_id: "cus_billing_123" }, error: null }),
        }),
      });
      mockCreatePortalSession.mockResolvedValue({ url: "https://billing.stripe.com/p/session/test" });

      const req = new NextRequest("http://localhost:3000/api/stripe/portal", {
        method: "POST",
      });

      const res = await portalHandler(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.url).toBe("https://billing.stripe.com/p/session/test");

      expect(mockCreatePortalSession).toHaveBeenCalledWith(
        expect.objectContaining({
          customer: "cus_billing_123",
          return_url: "http://localhost:3000/settings",
        })
      );
    });
  });
});
