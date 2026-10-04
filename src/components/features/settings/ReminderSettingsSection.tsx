"use client";

import { useState, useEffect } from "react";
import {
  Bell,
  BellRing,
  CheckCircle2,
  Clock,
  Sparkles,
  Smartphone,
  AlertCircle,
  ChevronDown,
  Share,
  PlusSquare,
} from "lucide-react";
import {
  ReminderSettings,
  PushEnvironmentStatus,
  REMINDER_TIME_PRESETS,
  DEFAULT_REMINDER_SETTINGS,
  getReminderSettings,
  saveReminderSettings,
  getPushEnvironmentStatus,
  requestPushPermission,
  sendTestNotification,
  subscribeToPushServer,
  hasPracticedToday,
} from "@/lib/notifications/push-manager";

export function ReminderSettingsSection() {
  const [settings, setSettings] = useState<ReminderSettings>(
    DEFAULT_REMINDER_SETTINGS
  );
  const [envStatus, setEnvStatus] =
    useState<PushEnvironmentStatus>("supported");
  const [permissionState, setPermissionState] =
    useState<NotificationPermission>("default");
  const [practicedToday, setPracticedToday] = useState(false);
  const [testStatus, setTestStatus] = useState<
    "idle" | "sending" | "sent" | "denied"
  >("idle");
  const [savedToast, setSavedToast] = useState(false);
  const [showPwaGuide, setShowPwaGuide] = useState(false);

  useEffect(() => {
    const loaded = getReminderSettings();
    setSettings(loaded);

    const status = getPushEnvironmentStatus();
    setEnvStatus(status);

    if (typeof window !== "undefined" && "Notification" in window) {
      setPermissionState(Notification.permission);
    }

    setPracticedToday(hasPracticedToday());

    const handleSessionUpdate = () => {
      setPracticedToday(hasPracticedToday());
    };
    window.addEventListener("shadowlog:session-update", handleSessionUpdate);
    return () => {
      window.removeEventListener(
        "shadowlog:session-update",
        handleSessionUpdate
      );
    };
  }, []);

  const triggerSavedToast = () => {
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2500);
  };

  const handleToggleEnabled = async () => {
    const nextEnabled = !settings.enabled;

    if (nextEnabled && envStatus === "supported") {
      const perm = await requestPushPermission();
      if (perm !== "unsupported") {
        setPermissionState(perm);
      }
      if (perm === "denied") {
        const updated = saveReminderSettings({ enabled: false });
        setSettings(updated);
        return;
      }
    }

    const updated = saveReminderSettings({ enabled: nextEnabled });
    setSettings(updated);
    triggerSavedToast();
    void subscribeToPushServer(updated);
  };

  const handleTimeChange = (newTime: string) => {
    const updated = saveReminderSettings({ time: newTime });
    setSettings(updated);
    triggerSavedToast();
    if (updated.enabled) {
      void subscribeToPushServer(updated);
    }
  };

  const handleTestNotification = async () => {
    setTestStatus("sending");
    const ok = await sendTestNotification();
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermissionState(Notification.permission);
    }
    if (ok) {
      setTestStatus("sent");
      setTimeout(() => setTestStatus("idle"), 4000);
    } else {
      setTestStatus("denied");
      setTimeout(() => setTestStatus("idle"), 5000);
    }
  };

  return (
    <div className="bg-card rounded-2xl p-5 sm:p-8 border border-border shadow-sm space-y-5 relative overflow-hidden">
      {/* Header & Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Bell className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-foreground">
              ⏰ 毎日の学習リマインド（プッシュ通知）
            </h2>
            {settings.enabled && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                毎日 {settings.time} に設定中
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            決まった時間にスマホへ通知し、1日1文のシャドーイング習慣化をサポートします（メールは届きません）。
          </p>
        </div>

        {/* Main ON / OFF Toggle */}
        <div className="flex items-center justify-between sm:justify-end gap-3 pt-1 sm:pt-0 shrink-0">
          <span className="text-xs font-bold text-foreground sm:hidden">
            リマインド通知をオンにする
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={settings.enabled}
            onClick={handleToggleEnabled}
            className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
              settings.enabled ? "bg-primary" : "bg-muted-foreground/30"
            }`}
            aria-label="毎日の学習リマインド通知のオン・オフ"
          >
            <span
              className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                settings.enabled ? "translate-x-6" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Smart Skip Reassurance Badge */}
      <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-start gap-2.5">
        <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5 text-xs leading-relaxed">
          <p className="font-bold text-emerald-800 dark:text-emerald-300">
            ✨ スマート通知：その日に1回でも練習を終えている場合は、自動的に通知をスキップします。
          </p>
          <p className="text-[11px] text-emerald-700/85 dark:text-emerald-300/80">
            {practicedToday
              ? "✅ 今日はすでに練習完了しているため、本日のリマインド通知はお休みします！"
              : "未練習で連続記録（ストリーク）が途切れそうな日だけ、優しくお知らせします。"}
          </p>
        </div>
      </div>

      {/* iOS Safari (Non-PWA) 3-Step Home Screen Guide Card */}
      {envStatus === "ios_needs_pwa" && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 space-y-3">
          <div className="flex items-start gap-2.5">
            <Smartphone className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-xs sm:text-sm font-extrabold text-amber-900 dark:text-amber-200">
                🍎 iPhoneでプッシュ通知を受け取るための簡単3ステップ
              </h3>
              <p className="text-[11px] sm:text-xs text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
                iPhoneの仕様により、ホーム画面に追加するとアプリとしてプッシュ通知が届くようになります（下の通知時刻は今すぐ事前保存できます）。
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            <div className="p-3 rounded-xl bg-background/80 border border-amber-500/20 flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-amber-500 text-white font-black text-xs flex items-center justify-center shrink-0">
                1
              </span>
              <span className="text-xs font-semibold text-foreground leading-snug">
                Safari画面下の
                <strong className="inline-flex items-center gap-0.5 text-primary mx-0.5">
                  <Share className="w-3 h-3 inline" />
                  共有ボタン
                </strong>
                をタップ
              </span>
            </div>

            <div className="p-3 rounded-xl bg-background/80 border border-amber-500/20 flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-amber-500 text-white font-black text-xs flex items-center justify-center shrink-0">
                2
              </span>
              <span className="text-xs font-semibold text-foreground leading-snug">
                メニューから
                <strong className="inline-flex items-center gap-0.5 text-primary mx-0.5">
                  <PlusSquare className="w-3 h-3 inline" />
                  ホーム画面に追加
                </strong>
                を選択
              </span>
            </div>

            <div className="p-3 rounded-xl bg-background/80 border border-amber-500/20 flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-amber-500 text-white font-black text-xs flex items-center justify-center shrink-0">
                3
              </span>
              <span className="text-xs font-semibold text-foreground leading-snug">
                ホーム画面の<strong>「ShadowLog」</strong>から開いて通知をON
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Permission Denied Warning */}
      {envStatus === "supported" && permissionState === "denied" && (
        <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/25 flex items-start gap-2.5 text-xs text-destructive">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="space-y-0.5 leading-relaxed">
            <p className="font-bold">
              ⚠️ 端末またはブラウザの設定で通知がオフになっています
            </p>
            <p className="opacity-90">
              アドレスバー左側のアイコン、またはスマホの「設定 ➔ アプリ ➔ 通知」からShadowLogの通知を許可してください。
            </p>
          </div>
        </div>
      )}

      {/* Time Selection Presets & Custom Time Input */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <label
            htmlFor="reminder-time-input"
            className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-1.5"
          >
            <Clock className="w-4 h-4 text-primary" />
            <span>通知を受け取る時刻（ワンタップ選択）</span>
          </label>
          {savedToast && (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 animate-in fade-in duration-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              保存しました
            </span>
          )}
        </div>

        {/* Preset Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {REMINDER_TIME_PRESETS.map((preset) => {
            const isSelected = settings.time === preset.time;
            return (
              <button
                key={preset.time}
                type="button"
                onClick={() => handleTimeChange(preset.time)}
                className={`p-2.5 rounded-xl border text-center transition cursor-pointer flex flex-col items-center justify-center gap-0.5 min-h-[54px] ${
                  isSelected
                    ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/20 font-bold"
                    : "border-border bg-background hover:border-primary/40 text-foreground"
                }`}
              >
                <span className="text-[11px] text-muted-foreground font-medium">
                  {preset.badge}
                </span>
                <span className="text-sm font-extrabold">{preset.label}</span>
              </button>
            );
          })}
        </div>

        {/* Custom Time Picker + Test Notification Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2.5">
            <span className="text-xs text-muted-foreground font-medium">
              自由な時刻を指定:
            </span>
            <input
              id="reminder-time-input"
              type="time"
              value={settings.time}
              onChange={(e) => {
                if (e.target.value) {
                  handleTimeChange(e.target.value);
                }
              }}
              className="px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs sm:text-sm font-bold focus:outline-hidden focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {envStatus === "supported" && (
            <button
              type="button"
              onClick={handleTestNotification}
              disabled={testStatus === "sending"}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 text-secondary-foreground font-bold text-xs transition border border-border/80 cursor-pointer min-h-[42px]"
            >
              <BellRing className="w-3.5 h-3.5 text-primary" />
              <span>
                {testStatus === "sending"
                  ? "テスト通知を送信中..."
                  : "🔔 今すぐテスト通知を送ってみる"}
              </span>
            </button>
          )}
        </div>

        {testStatus === "sent" && (
          <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 pt-1">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>
              テスト通知を送信しました！スマホ・PCの上部バナーをご確認ください。
            </span>
          </p>
        )}

        {testStatus === "denied" && (
          <p className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5 pt-1">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>
              通知の許可が必要です。ブラウザの確認ダイアログで「許可」を選択してください。
            </span>
          </p>
        )}
      </div>

      {/* Collapsible PWA Home Screen Guide for Android / Desktop Users */}
      {envStatus !== "ios_needs_pwa" && (
        <div className="pt-2 border-t border-border/60">
          <button
            type="button"
            onClick={() => setShowPwaGuide((prev) => !prev)}
            className="w-full flex items-center justify-between text-xs text-muted-foreground hover:text-foreground transition py-1 cursor-pointer"
          >
            <span className="flex items-center gap-1.5 font-medium">
              <Smartphone className="w-3.5 h-3.5 text-primary" />
              <span>📲 スマホのホーム画面にアプリとして追加する方法</span>
            </span>
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${
                showPwaGuide ? "rotate-180 text-primary" : ""
              }`}
            />
          </button>

          {showPwaGuide && (
            <div className="mt-2.5 p-3.5 rounded-xl bg-muted/40 border border-border text-xs text-muted-foreground space-y-1.5 leading-relaxed">
              <p>
                <strong className="text-foreground">Android (Chrome):</strong>{" "}
                画面右上のメニュー「⋮」➔「ホーム画面に追加」（または「アプリをインストール」）をタップすると、ネイティブアプリのようにワンタップで起動＆通知受信できます。
              </p>
              <p>
                <strong className="text-foreground">iPhone (Safari):</strong>{" "}
                画面下の共有ボタン「↑」➔「ホーム画面に追加」をタップして起動してください。
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
