import { describe, it, expect } from "vitest";
import {
  sendWebPushNotification,
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY,
} from "@/lib/notifications/web-push-server";

describe("Web Push Server Delivery (FB-064)", () => {
  it("reads VAPID keys from environment or empty string", () => {
    expect(typeof VAPID_PUBLIC_KEY).toBe("string");
    expect(typeof VAPID_PRIVATE_KEY).toBe("string");
  });

  it("safely skips non-https mock endpoints", async () => {
    const res = await sendWebPushNotification(
      {
        endpoint: "local-browser-http://localhost:3000",
        keys: { p256dh: "mock-p256dh", auth: "mock-auth" },
      },
      {
        title: "Test",
        body: "Test body",
      }
    );

    expect(res.success).toBe(false);
    expect(res.error).toBe("Non-HTTPS mock endpoint");
  });

  it("safely handles missing endpoint or keys", async () => {
    const res1 = await sendWebPushNotification(
      { endpoint: "" },
      { title: "Test", body: "Test" }
    );
    expect(res1.success).toBe(false);

    const res2 = await sendWebPushNotification(
      { endpoint: "https://web.push.apple.com/test", keys: null },
      { title: "Test", body: "Test" }
    );
    expect(res2.success).toBe(false);
    expect(res2.error).toContain("Missing");
  });
});
