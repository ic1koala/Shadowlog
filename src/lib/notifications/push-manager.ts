// Web Push & Smart Habit Reminder Manager (FB-033)
// Email notifications are intentionally excluded per product spec to avoid inbox fatigue.

export interface ReminderSettings {
  enabled: boolean;
  time: string; // "HH:MM" (primary/first time for backward compatibility)
  times?: string[]; // multi-time array, e.g. ["08:00", "21:00"]
  smartSkipIfPracticed: boolean;
  lastNotifiedDate?: string; // "YYYY-MM-DD" in JST
  lastNotifiedTimes?: string[]; // times notified today
}

export type PushEnvironmentStatus =
  | "supported"
  | "ios_needs_pwa"
  | "unsupported";

export const REMINDER_STORAGE_KEY = "shadowlog_reminder_settings";

export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  enabled: false,
  time: "21:00",
  times: ["21:00"],
  smartSkipIfPracticed: true,
};

export const REMINDER_TIME_PRESETS: ReadonlyArray<{
  time: string;
  label: string;
  badge: string;
}> = [
  { time: "08:00", label: "08:00", badge: "🌅 朝活" },
  { time: "12:30", label: "12:30", badge: "☀️ 昼休み" },
  { time: "20:00", label: "20:00", badge: "🌙 帰宅後" },
  { time: "21:00", label: "21:00", badge: "🔥 一番人気" },
  { time: "22:30", label: "22:30", badge: "🦉 就寝前" },
];

/**
 * Validates "HH:MM" 24-hour time string.
 */
export function isValidReminderTime(time: string): boolean {
  return /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time);
}

/**
 * Returns "YYYY-MM-DD" in Japan Standard Time (Asia/Tokyo, UTC+9).
 */
export function getJstDateString(date: Date = new Date()): string {
  const jstTime = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  const year = jstTime.getUTCFullYear();
  const month = String(jstTime.getUTCMonth() + 1).padStart(2, "0");
  const day = String(jstTime.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Returns "HH:MM" in Japan Standard Time (Asia/Tokyo, UTC+9).
 */
export function getJstTimeString(date: Date = new Date()): string {
  const jstTime = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  const hours = String(jstTime.getUTCHours()).padStart(2, "0");
  const minutes = String(jstTime.getUTCMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

/**
 * Checks if the device is running iOS / iPadOS (including iPadOS desktop-mode UA).
 */
export function isIOSDevice(
  userAgent?: string,
  maxTouchPoints?: number
): boolean {
  const ua =
    userAgent ??
    (typeof navigator !== "undefined" ? navigator.userAgent : "");
  if (/iphone|ipad|ipod/i.test(ua)) return true;

  const touch =
    maxTouchPoints ??
    (typeof navigator !== "undefined" ? navigator.maxTouchPoints || 0 : 0);
  return /macintosh/i.test(ua) && touch > 1;
}

/**
 * Checks if the web app is running in standalone PWA mode (added to Home Screen).
 */
export function isStandaloneMode(options?: {
  matchStandalone?: boolean;
  navigatorStandalone?: boolean;
}): boolean {
  if (options) {
    return Boolean(options.matchStandalone || options.navigatorStandalone);
  }
  if (typeof window === "undefined") return false;

  const matchMediaStandalone =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(display-mode: standalone)").matches;
  const iosNavigatorStandalone =
    typeof navigator !== "undefined" &&
    (navigator as Navigator & { standalone?: boolean }).standalone === true;

  return Boolean(matchMediaStandalone || iosNavigatorStandalone);
}

/**
 * Determines the Web Push capability of the current browser/device environment.
 * - On iOS/iPadOS in a normal browser tab (not added to Home Screen): returns "ios_needs_pwa"
 * - When Notification API & ServiceWorker are available: returns "supported"
 * - Otherwise: returns "unsupported"
 */
export function getPushEnvironmentStatus(options?: {
  userAgent?: string;
  maxTouchPoints?: number;
  isStandalone?: boolean;
  hasNotificationApi?: boolean;
  hasServiceWorker?: boolean;
}): PushEnvironmentStatus {
  const ios = isIOSDevice(options?.userAgent, options?.maxTouchPoints);
  const standalone =
    options?.isStandalone !== undefined
      ? options.isStandalone
      : isStandaloneMode();

  if (ios && !standalone) {
    return "ios_needs_pwa";
  }

  const hasNotification =
    options?.hasNotificationApi !== undefined
      ? options.hasNotificationApi
      : typeof window !== "undefined" && "Notification" in window;

  const hasSW =
    options?.hasServiceWorker !== undefined
      ? options.hasServiceWorker
      : typeof navigator !== "undefined" && "serviceWorker" in navigator;

  if (hasNotification && hasSW) {
    return "supported";
  }

  return "unsupported";
}

/**
 * Reads reminder settings from localStorage with safe fallback.
 */
export function getReminderSettings(): ReminderSettings {
  if (typeof window === "undefined") {
    return { ...DEFAULT_REMINDER_SETTINGS };
  }
  try {
    const raw = localStorage.getItem(REMINDER_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_REMINDER_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<ReminderSettings>;

    const parsedTimes = Array.isArray(parsed.times)
      ? parsed.times.filter(isValidReminderTime)
      : typeof parsed.time === "string" && isValidReminderTime(parsed.time)
      ? [parsed.time]
      : ["21:00"];
    const effectiveTimes = parsedTimes.length > 0 ? parsedTimes : ["21:00"];

    return {
      enabled: Boolean(parsed.enabled),
      time: effectiveTimes[0] || DEFAULT_REMINDER_SETTINGS.time,
      times: effectiveTimes,
      smartSkipIfPracticed:
        parsed.smartSkipIfPracticed !== undefined
          ? Boolean(parsed.smartSkipIfPracticed)
          : true,
      lastNotifiedDate:
        typeof parsed.lastNotifiedDate === "string"
          ? parsed.lastNotifiedDate
          : undefined,
      lastNotifiedTimes: Array.isArray(parsed.lastNotifiedTimes)
        ? parsed.lastNotifiedTimes
        : undefined,
    };
  } catch {
    return { ...DEFAULT_REMINDER_SETTINGS };
  }
}

export interface SaveReminderSettingsOptions {
  silent?: boolean;
}

/**
 * Saves updated reminder settings to localStorage and dispatches an update event.
 */
export function saveReminderSettings(
  partial: Partial<ReminderSettings>,
  options?: SaveReminderSettingsOptions
): ReminderSettings {
  const current = getReminderSettings();
  let nextTimes: string[];
  if (partial.times) {
    nextTimes = partial.times.filter(isValidReminderTime);
  } else if (partial.time && isValidReminderTime(partial.time)) {
    nextTimes = [partial.time];
  } else {
    nextTimes = current.times || [current.time];
  }

  const primaryTime =
    partial.time && isValidReminderTime(partial.time)
      ? partial.time
      : nextTimes[0] || current.time || "21:00";

  const todayJst = getJstDateString();
  const currentJstHm = getJstTimeString();

  let nextLastNotifiedDate =
    partial.lastNotifiedDate !== undefined
      ? partial.lastNotifiedDate
      : current.lastNotifiedDate;

  let nextLastNotifiedTimes: string[] =
    partial.lastNotifiedTimes !== undefined
      ? partial.lastNotifiedTimes
      : nextLastNotifiedDate === todayJst
      ? current.lastNotifiedTimes || []
      : [];

  // When enabling reminders or updating times, prevent retroactive firing:
  // Any configured time <= current JST time today has already passed and will not fire today.
  const isEnabling = partial.enabled === true && !current.enabled;
  const isTimesChanged =
    partial.times !== undefined &&
    JSON.stringify(partial.times) !== JSON.stringify(current.times);

  if ((isEnabling || isTimesChanged) && (partial.enabled ?? current.enabled)) {
    nextLastNotifiedDate = todayJst;
    const passedTimesToday = nextTimes.filter((t) => t <= currentJstHm);
    nextLastNotifiedTimes = Array.from(
      new Set([...nextLastNotifiedTimes, ...passedTimesToday])
    );
  }

  const next: ReminderSettings = {
    ...current,
    ...partial,
    time: primaryTime,
    times: nextTimes,
    lastNotifiedDate: nextLastNotifiedDate,
    lastNotifiedTimes: nextLastNotifiedTimes,
  };

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(REMINDER_STORAGE_KEY, JSON.stringify(next));
      if (!options?.silent) {
        window.dispatchEvent(new Event("shadowlog:reminder-settings-update"));
      }
    } catch {
      // ignore storage errors
    }
  }
  return next;
}

/**
 * Checks whether the user has already completed at least 1 practice session today (JST).
 */
export function hasPracticedToday(
  sessions?: Array<{ id?: string; createdAt?: string; date?: string }>,
  referenceDate: Date = new Date()
): boolean {
  const todayJst = getJstDateString(referenceDate);

  let targetSessions = sessions;
  if (!targetSessions && typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("shadowlog_stored_sessions");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          targetSessions = parsed;
        }
      }
    } catch {
      targetSessions = [];
    }
  }

  if (!targetSessions || targetSessions.length === 0) return false;

  return targetSessions.some((s) => {
    if (!s) return false;
    if (s.id && s.id.startsWith("session-init-")) return false;
    const rawDate = s.createdAt || s.date;
    if (!rawDate) return false;
    // If rawDate is already YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
      return rawDate === todayJst;
    }
    const parsedDate = new Date(rawDate);
    if (isNaN(parsedDate.getTime())) return false;
    return getJstDateString(parsedDate) === todayJst;
  });
}

/**
 * Returns the specific scheduled time that should trigger right now, or null if none.
 * Fires at most once per JST day for each configured time when:
 * - settings.enabled is true
 * - not already notified today for this time
 * - if smartSkipIfPracticed is true, user has NOT practiced today
 * - current JST time matches scheduled time within 15 minutes grace window
 */
export function getTriggerableReminderTime(
  settings: ReminderSettings,
  practicedToday: boolean,
  now: Date = new Date()
): string | null {
  if (!settings.enabled) return null;
  if (settings.smartSkipIfPracticed && practicedToday) return null;

  const todayJst = getJstDateString(now);
  const activeTimes =
    settings.times && settings.times.length > 0
      ? settings.times
      : [settings.time];

  const currentJstHm = getJstTimeString(now);
  const [curH, curM] = currentJstHm.split(":").map(Number);
  const curMinutes = (curH ?? 0) * 60 + (curM ?? 0);

  const notifiedTimes =
    settings.lastNotifiedDate === todayJst
      ? settings.lastNotifiedTimes || [settings.time]
      : [];

  for (const targetTime of activeTimes) {
    if (!isValidReminderTime(targetTime)) continue;
    if (notifiedTimes.includes(targetTime)) continue;

    const [tarH, tarM] = targetTime.split(":").map(Number);
    const tarMinutes = (tarH ?? 0) * 60 + (tarM ?? 0);

    const diff = curMinutes - tarMinutes;
    // Only fire if the scheduled time has arrived and is within 15 minutes
    if (diff >= 0 && diff <= 15) {
      return targetTime;
    }
  }

  return null;
}

/**
 * Pure helper to determine if the daily reminder should fire right now.
 */
export function shouldFireDailyReminder(
  settings: ReminderSettings,
  practicedToday: boolean,
  now: Date = new Date()
): boolean {
  return Boolean(getTriggerableReminderTime(settings, practicedToday, now));
}

/**
 * Registers `/sw.js` Service Worker if supported.
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }
  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });
    return registration;
  } catch (err) {
    console.warn("Service Worker registration failed:", err);
    return null;
  }
}

/**
 * Requests browser Notification permission and registers the Service Worker if granted.
 */
export async function requestPushPermission(): Promise<
  NotificationPermission | "unsupported"
> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      await registerServiceWorker();
    }
    return permission;
  } catch (err) {
    console.warn("Notification permission request failed:", err);
    return Notification.permission || "default";
  }
}

/**
 * Sends an immediate test notification via Service Worker or Notification API.
 */
export async function sendTestNotification(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false;
  }

  if (Notification.permission !== "granted") {
    const perm = await requestPushPermission();
    if (perm !== "granted") return false;
  }

  const title = "🔥 ShadowLog リマインドテスト";
  const body =
    "通知設定はバッチリです！今日も1文だけ声に出してみましょう🎧";

  try {
    const reg = await registerServiceWorker();
    if (reg) {
      if (reg.active) {
        reg.active.postMessage({
          type: "SHOW_TEST_NOTIFICATION",
          title,
          body,
          url: "/practice",
        });
        return true;
      }
      await reg.showNotification(title, {
        body,
        icon: "/icons/icon-192x192.png",
        badge: "/icons/icon-192x192.png",
        tag: "shadowlog-test-notification",
        data: { url: "/practice" },
      });
      return true;
    }
  } catch {
    // Fallback to standard Notification constructor
  }

  try {
    new Notification(title, {
      body,
      icon: "/icons/icon-192x192.png",
      tag: "shadowlog-test-notification",
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Fires the daily smart reminder notification and records the notified time in lastNotifiedTimes.
 */
export async function triggerDailyReminderNotification(
  targetTime?: string
): Promise<boolean> {
  if (
    typeof window === "undefined" ||
    !("Notification" in window) ||
    Notification.permission !== "granted"
  ) {
    return false;
  }

  const todayJst = getJstDateString();
  const currentSettings = getReminderSettings();
  const firedTime =
    targetTime ||
    getTriggerableReminderTime(currentSettings, hasPracticedToday()) ||
    currentSettings.time ||
    "daily";

  const title = "🔥 ShadowLog 今日の1文シャドーイング";
  const body =
    "まだ今日のシャドーイングが完了していません。1文だけ声に出してストリークを繋ぎましょう🎧";

  // Record this notification immediately with silent: true to prevent any concurrent triggers or event loops
  const existingTimes =
    currentSettings.lastNotifiedDate === todayJst
      ? currentSettings.lastNotifiedTimes || []
      : [];
  const updatedNotifiedTimes = Array.from(
    new Set([...existingTimes, firedTime])
  );

  saveReminderSettings(
    {
      lastNotifiedDate: todayJst,
      lastNotifiedTimes: updatedNotifiedTimes,
    },
    { silent: true }
  );

  const tag = `shadowlog-daily-reminder-${todayJst}-${firedTime}`;

  try {
    const reg = await registerServiceWorker();
    if (reg) {
      await reg.showNotification(title, {
        body,
        icon: "/icons/icon-192x192.png",
        badge: "/icons/icon-192x192.png",
        tag,
        data: { url: "/practice" },
      });
      return true;
    }
  } catch {
    // Fallback below
  }

  try {
    new Notification(title, {
      body,
      icon: "/icons/icon-192x192.png",
      tag,
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Syncs the user's push subscription & preferred reminder time with `/api/push/subscribe`.
 */
export async function subscribeToPushServer(
  settings: ReminderSettings
): Promise<boolean> {
  if (typeof window === "undefined") return false;

  try {
    let endpoint = `local-browser-${window.location.origin}`;
    let keys: { p256dh?: string; auth?: string } = {};

    const reg = await registerServiceWorker();
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

    if (reg && reg.pushManager) {
      try {
        const existingSub = await reg.pushManager.getSubscription();
        if (existingSub) {
          const json = existingSub.toJSON();
          endpoint = json.endpoint || endpoint;
          keys = {
            p256dh: json.keys?.p256dh,
            auth: json.keys?.auth,
          };
        } else if (vapidPublicKey) {
          const sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: vapidPublicKey,
          });
          const json = sub.toJSON();
          endpoint = json.endpoint || endpoint;
          keys = {
            p256dh: json.keys?.p256dh,
            auth: json.keys?.auth,
          };
        }
      } catch {
        // Proceed with schedule sync even if VAPID pushManager subscription is not configured yet
      }
    }

    if (!settings.enabled) {
      const res = await fetch("/api/push/subscribe", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint }),
      });
      return res.ok;
    }

    const res = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint,
        keys,
        reminderTime: settings.time,
        smartSkipIfPracticed: settings.smartSkipIfPracticed,
        userAgent: navigator.userAgent,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
