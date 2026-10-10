import { describe, it, expect, beforeEach } from "vitest";
import {
  isIOSDevice,
  isStandaloneMode,
  getPushEnvironmentStatus,
  isValidReminderTime,
  getJstDateString,
  getJstTimeString,
  getReminderSettings,
  saveReminderSettings,
  hasPracticedToday,
  shouldFireDailyReminder,
  getTriggerableReminderTime,
  DEFAULT_REMINDER_SETTINGS,
  REMINDER_TIME_PRESETS,
} from "@/lib/notifications/push-manager";

describe("Web Push Habit Reminder Manager (FB-033)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("correctly detects iOS / iPadOS devices vs Android and Desktop", () => {
    const iphoneUA =
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
    const ipadDesktopUA =
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15";
    const androidUA =
      "Mozilla/5.0 (Linux; Android 16; SM-S941N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36";

    expect(isIOSDevice(iphoneUA, 5)).toBe(true);
    expect(isIOSDevice(ipadDesktopUA, 5)).toBe(true);
    expect(isIOSDevice(ipadDesktopUA, 0)).toBe(false);
    expect(isIOSDevice(androidUA, 5)).toBe(false);
  });

  it("returns ios_needs_pwa for iOS Safari browser tab and supported for iOS PWA or Android", () => {
    const iphoneUA =
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
    const androidUA =
      "Mozilla/5.0 (Linux; Android 16; SM-S941N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36";

    expect(
      getPushEnvironmentStatus({
        userAgent: iphoneUA,
        maxTouchPoints: 5,
        isStandalone: false,
        hasNotificationApi: false,
        hasServiceWorker: true,
      })
    ).toBe("ios_needs_pwa");

    expect(
      getPushEnvironmentStatus({
        userAgent: iphoneUA,
        maxTouchPoints: 5,
        isStandalone: true,
        hasNotificationApi: true,
        hasServiceWorker: true,
      })
    ).toBe("supported");

    expect(
      getPushEnvironmentStatus({
        userAgent: androidUA,
        maxTouchPoints: 5,
        isStandalone: false,
        hasNotificationApi: true,
        hasServiceWorker: true,
      })
    ).toBe("supported");

    expect(
      isStandaloneMode({ matchStandalone: false, navigatorStandalone: true })
    ).toBe(true);
  });

  it("validates 24-hour HH:MM reminder times and persists settings to localStorage", () => {
    expect(isValidReminderTime("08:00")).toBe(true);
    expect(isValidReminderTime("21:00")).toBe(true);
    expect(isValidReminderTime("23:59")).toBe(true);
    expect(isValidReminderTime("24:00")).toBe(false);
    expect(isValidReminderTime("9:00")).toBe(false);

    expect(REMINDER_TIME_PRESETS.map((p) => p.time)).toEqual([
      "08:00",
      "12:30",
      "20:00",
      "21:00",
      "22:30",
    ]);

    expect(getReminderSettings()).toEqual(DEFAULT_REMINDER_SETTINGS);

    const updated = saveReminderSettings({ enabled: true, time: "20:00" });
    expect(updated.enabled).toBe(true);
    expect(updated.time).toBe("20:00");
    expect(getReminderSettings().time).toBe("20:00");
  });

  it("correctly evaluates hasPracticedToday in JST and ignores dummy session-init entries", () => {
    // 2026-10-04 21:00 JST = 2026-10-04T12:00:00.000Z
    const refDate = new Date("2026-10-04T12:00:00.000Z");
    expect(getJstDateString(refDate)).toBe("2026-10-04");
    expect(getJstTimeString(refDate)).toBe("21:00");

    expect(
      hasPracticedToday(
        [{ id: "session-init-1", createdAt: "2026-10-04T10:00:00.000Z" }],
        refDate
      )
    ).toBe(false);

    expect(
      hasPracticedToday(
        [{ id: "session-123", createdAt: "2026-10-04T01:30:00.000Z" }],
        refDate
      )
    ).toBe(true);

    expect(
      hasPracticedToday(
        [{ id: "session-yesterday", createdAt: "2026-10-03T10:00:00.000Z" }],
        refDate
      )
    ).toBe(false);
  });

  it("smart-skips daily reminder when user already practiced today or was already notified today", () => {
    const nowAt2115Jst = new Date("2026-10-04T12:15:00.000Z"); // 21:15 JST on 2026-10-04

    const activeSettings = {
      enabled: true,
      time: "21:00",
      smartSkipIfPracticed: true,
    };

    // Should fire when not practiced today and time >= 21:00 JST
    expect(shouldFireDailyReminder(activeSettings, false, nowAt2115Jst)).toBe(
      true
    );

    // Smart skip: should NOT fire when user already practiced today
    expect(shouldFireDailyReminder(activeSettings, true, nowAt2115Jst)).toBe(
      false
    );

    // Should NOT fire if already notified on 2026-10-04
    expect(
      shouldFireDailyReminder(
        { ...activeSettings, lastNotifiedDate: "2026-10-04" },
        false,
        nowAt2115Jst
      )
    ).toBe(false);

    // Should NOT fire before target time (e.g. 20:30 JST)
    const nowAt2030Jst = new Date("2026-10-04T11:30:00.000Z");
    expect(shouldFireDailyReminder(activeSettings, false, nowAt2030Jst)).toBe(
      false
    );
  });

  it("handles multi-time reminder schedules and tracks individual notified times", () => {
    const multiSettings = {
      enabled: true,
      time: "08:00",
      times: ["08:00", "12:30", "21:00"],
      smartSkipIfPracticed: false,
      lastNotifiedDate: "2026-10-04",
      lastNotifiedTimes: ["08:00"],
    };

    // At 12:32 JST, 08:00 was notified, but 12:30 has arrived and was NOT notified
    const at1232Jst = new Date("2026-10-04T03:32:00.000Z"); // 12:32 JST
    expect(getTriggerableReminderTime(multiSettings, false, at1232Jst)).toBe("12:30");
    expect(shouldFireDailyReminder(multiSettings, false, at1232Jst)).toBe(true);

    // After 12:30 is also marked as notified, it should not fire at 12:35 JST
    const updatedSettings = {
      ...multiSettings,
      lastNotifiedTimes: ["08:00", "12:30"],
    };
    const at1235Jst = new Date("2026-10-04T03:35:00.000Z");
    expect(getTriggerableReminderTime(updatedSettings, false, at1235Jst)).toBeNull();

    // But when 21:05 JST arrives, 21:00 should trigger
    const at2105Jst = new Date("2026-10-04T12:05:00.000Z");
    expect(getTriggerableReminderTime(updatedSettings, false, at2105Jst)).toBe("21:00");
  });

  it("prevents retroactive notifications for times that already passed earlier today when enabled", () => {
    // Current time is 14:00 JST on today's date
    const currentJstTime = getJstTimeString();

    // Suppose we configure times where some have passed and some are in the future
    const saved = saveReminderSettings({
      enabled: true,
      times: ["00:01", "23:59"],
    });

    // "00:01" has already passed today since any realistic test runs after 00:01 JST
    // It should be automatically included in lastNotifiedTimes
    if ("00:01" <= currentJstTime) {
      expect(saved.lastNotifiedTimes).toContain("00:01");
    }

    // Saving with silent: true should not throw and persist correctly
    const silentSaved = saveReminderSettings(
      { smartSkipIfPracticed: false },
      { silent: true }
    );
    expect(silentSaved.smartSkipIfPracticed).toBe(false);
  });
});
