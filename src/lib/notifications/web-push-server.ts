import webpush from "web-push";

export const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  "BEdsH-HZbW2h4My47195BFDagQnu4_jzY76ngEgW7ijMINPT5kGoLaTWsqYoUWvJTBGpZNTFBAquYuLcCv1l0zE";

export const VAPID_PRIVATE_KEY =
  process.env.VAPID_PRIVATE_KEY ||
  "lrDFl6ErRy-8qW9PnzukxqqR5Ot-zXO5ij8h0mlcVjA";

export const VAPID_SUBJECT =
  process.env.VAPID_SUBJECT || "mailto:admin@shadowlog.app";

let isVapidInitialized = false;

function ensureVapidDetails() {
  if (!isVapidInitialized) {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
    isVapidInitialized = true;
  }
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

export interface SendPushResult {
  success: boolean;
  expired?: boolean;
  error?: string;
}

/**
 * Sends a real Web Push notification to a browser push subscription via Apple/Google push servers.
 */
export async function sendWebPushNotification(
  subscription: {
    endpoint: string;
    keys?: {
      p256dh?: string | null;
      auth?: string | null;
    } | null;
  },
  payload: PushNotificationPayload
): Promise<SendPushResult> {
  if (!subscription || !subscription.endpoint) {
    return { success: false, error: "Missing subscription endpoint" };
  }

  // If subscription is a mock or local placeholder, skip external network push
  if (!subscription.endpoint.startsWith("https://")) {
    return { success: false, error: "Non-HTTPS mock endpoint" };
  }

  if (!subscription.keys?.p256dh || !subscription.keys?.auth) {
    return { success: false, error: "Missing p256dh or auth keys" };
  }

  ensureVapidDetails();

  const pushSub = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
  };

  const stringifiedPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url || "/practice",
    tag: payload.tag || "shadowlog-daily-reminder",
  });

  try {
    await webpush.sendNotification(pushSub, stringifiedPayload, {
      TTL: 60 * 60 * 24, // 24 hours
      urgency: "normal",
    });
    return { success: true };
  } catch (err: unknown) {
    const errorObj = err as { statusCode?: number; message?: string };
    const statusCode = errorObj.statusCode;
    // 404 Not Found or 410 Gone means the subscription has expired or user revoked it
    const isExpired = statusCode === 404 || statusCode === 410;
    return {
      success: false,
      expired: isExpired,
      error: errorObj.message || `Push delivery failed with code ${statusCode}`,
    };
  }
}
