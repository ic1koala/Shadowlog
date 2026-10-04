// ShadowLog Service Worker for Web Push & Habit Reminder Notifications (FB-033)

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let payload = {
    title: "🔥 ShadowLog 今日の1文シャドーイング",
    body: "まだ今日のシャドーイングが完了していません。1文だけ声に出してストリークを繋ぎましょう🎧",
    url: "/practice",
    tag: "shadowlog-daily-reminder",
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      payload = {
        ...payload,
        ...parsed,
      };
    } catch {
      const text = event.data.text();
      if (text) {
        payload.body = text;
      }
    }
  }

  const options = {
    body: payload.body,
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-192x192.png",
    tag: payload.tag || "shadowlog-daily-reminder",
    renotify: true,
    data: {
      url: payload.url || "/practice",
    },
  };

  event.waitUntil(self.registration.showNotification(payload.title, options));
});

self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data || typeof data !== "object") return;

  if (
    data.type === "SHOW_TEST_NOTIFICATION" ||
    data.type === "SHOW_REMINDER_NOTIFICATION"
  ) {
    const title =
      data.title ||
      (data.type === "SHOW_TEST_NOTIFICATION"
        ? "🔥 ShadowLog リマインドテスト"
        : "🔥 ShadowLog 今日の1文シャドーイング");
    const body =
      data.body ||
      (data.type === "SHOW_TEST_NOTIFICATION"
        ? "通知設定はバッチリです！今日も1文だけ声に出してみましょう🎧"
        : "まだ今日のシャドーイングが完了していません。1文だけ声に出してストリークを繋ぎましょう🎧");
    const url = data.url || "/practice";
    const tag =
      data.tag ||
      (data.type === "SHOW_TEST_NOTIFICATION"
        ? "shadowlog-test-notification"
        : "shadowlog-daily-reminder");

    event.waitUntil(
      self.registration.showNotification(title, {
        body,
        icon: "/icons/icon-192x192.png",
        badge: "/icons/icon-192x192.png",
        tag,
        renotify: true,
        data: { url },
      })
    );
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl =
    (event.notification.data && event.notification.data.url) || "/practice";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url && "focus" in client) {
            client.navigate(targetUrl).catch(() => {});
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});
