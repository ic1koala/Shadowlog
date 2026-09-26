import { getTicketStatus } from "@/lib/storage/ticket-store";

export interface ClientEnvironmentInfo {
  userAgent: string;
  platform: string;
  language: string;
  screenSize: string;
  windowSize: string;
  devicePixelRatio: number;
  currentUrl: string;
  selectedMic?: string;
  userPlan?: string;
  availableTickets?: number;
  isOnline: boolean;
  timeZone: string;
  timestamp: string;
}

export async function collectClientEnvironmentInfo(): Promise<ClientEnvironmentInfo> {
  let selectedMic = "未選択 / デフォルト";

  if (typeof window !== "undefined") {
    try {
      const savedMicLabel = localStorage.getItem("shadowlog_selected_mic_label");
      if (savedMicLabel) {
        selectedMic = savedMicLabel;
      } else if (navigator.mediaDevices?.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter((d) => d.kind === "audioinput");
        if (audioInputs.length > 0) {
          const defaultMic = audioInputs.find((d) => d.deviceId === "default") || audioInputs[0];
          selectedMic = defaultMic.label || `マイク (${audioInputs.length}台接続中)`;
        }
      }
    } catch {}
  }

  let userPlan = "guest";
  let availableTickets = 0;
  try {
    const status = getTicketStatus();
    userPlan = status.isVip ? "vip" : status.plan;
    availableTickets = status.availableTickets;
  } catch {}

  const nav = typeof navigator !== "undefined" ? (navigator as Navigator & { userAgentData?: { platform?: string } }) : null;

  return {
    userAgent: nav ? nav.userAgent : "Unknown",
    platform: nav ? nav.userAgentData?.platform || nav.platform || "Unknown" : "Unknown",
    language: typeof navigator !== "undefined" ? navigator.language : "ja-JP",
    screenSize: typeof window !== "undefined" ? `${window.screen.width}x${window.screen.height}` : "Unknown",
    windowSize: typeof window !== "undefined" ? `${window.innerWidth}x${window.innerHeight}` : "Unknown",
    devicePixelRatio: typeof window !== "undefined" ? window.devicePixelRatio : 1,
    currentUrl: typeof window !== "undefined" ? window.location.href : "Unknown",
    selectedMic,
    userPlan,
    availableTickets,
    isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Tokyo",
    timestamp: new Date().toISOString(),
  };
}
