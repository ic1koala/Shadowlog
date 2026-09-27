"use client";

import { useEffect, useState } from "react";
import {
  Sun,
  Coffee,
  Moon,
  Sparkles,
  Ticket,
  Flame,
} from "lucide-react";
import { fetchUserNickname, getStoredNickname } from "@/lib/storage/sync-service";
import { getTicketStatus, TicketStatus } from "@/lib/storage/ticket-store";

interface GreetingContent {
  greeting: string;
  subtext: string;
  icon: typeof Sun;
  badgeBg: string;
  badgeText: string;
  timeSlot: "morning" | "afternoon" | "evening" | "night";
}

function getTimeSlotContent(hour: number, nickname: string | null): GreetingContent {
  const nameDisplay = nickname ? `${nickname}さん` : "";

  if (hour >= 5 && hour < 11) {
    return {
      greeting: `おはようございます${nameDisplay ? `、${nameDisplay}` : ""}！`,
      subtext: "今日も爽やかに1フレーズから声を出して始めましょう。",
      icon: Sun,
      badgeBg: "bg-amber-500/15 border-amber-500/30",
      badgeText: "text-amber-600 dark:text-amber-400",
      timeSlot: "morning",
    };
  } else if (hour >= 11 && hour < 17) {
    return {
      greeting: `こんにちは${nameDisplay ? `、${nameDisplay}` : ""}！`,
      subtext: "午後のスキマ時間に英語シャドーイングで気分転換しませんか？",
      icon: Coffee,
      badgeBg: "bg-blue-500/15 border-blue-500/30",
      badgeText: "text-blue-600 dark:text-blue-400",
      timeSlot: "afternoon",
    };
  } else if (hour >= 17 && hour < 23) {
    return {
      greeting: `こんばんは${nameDisplay ? `、${nameDisplay}` : ""}！`,
      subtext: "今日もお仕事・1日お疲れ様でした！就寝前に少しだけ発話しリズムを整えましょう。",
      icon: Moon,
      badgeBg: "bg-indigo-500/15 border-indigo-500/30",
      badgeText: "text-indigo-600 dark:text-indigo-400",
      timeSlot: "evening",
    };
  } else {
    return {
      greeting: `こんばんは${nameDisplay ? `、${nameDisplay}` : ""}。`,
      subtext: "深夜まで本当にお疲れ様です！無理のない範囲で練習してくださいね。",
      icon: Sparkles,
      badgeBg: "bg-purple-500/15 border-purple-500/30",
      badgeText: "text-purple-600 dark:text-purple-400",
      timeSlot: "night",
    };
  }
}

export function GreetingBanner() {
  const [ticketStatus, setTicketStatus] = useState<TicketStatus | null>(null);
  const [content, setContent] = useState<GreetingContent>(() => {
    const currentHour = new Date().getHours();
    return getTimeSlotContent(currentHour, getStoredNickname());
  });

  useEffect(() => {
    // ニックネームの同期
    fetchUserNickname().then((name) => {
      if (name) {
        const hour = new Date().getHours();
        setContent(getTimeSlotContent(hour, name));
      }
    });

    const handleNickUpdate = () => {
      const name = getStoredNickname();
      const hour = new Date().getHours();
      setContent(getTimeSlotContent(hour, name));
    };

    window.addEventListener("shadowlog:nickname-update", handleNickUpdate);

    // チケット状態
    setTicketStatus(getTicketStatus());
    const handleTicketUpdate = () => {
      setTicketStatus(getTicketStatus());
    };
    window.addEventListener("shadowlog:ticket-update", handleTicketUpdate);

    return () => {
      window.removeEventListener("shadowlog:nickname-update", handleNickUpdate);
      window.removeEventListener("shadowlog:ticket-update", handleTicketUpdate);
    };
  }, []);

  const Icon = content.icon;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-card border border-border/80 p-4 sm:p-5 shadow-xs transition">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${content.badgeBg} ${content.badgeText}`}
          >
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
              <span>{content.greeting}</span>
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              {content.subtext}
            </p>
          </div>
        </div>

        {/* 状態バッジ */}
        {ticketStatus && (
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            {ticketStatus.isVip || ticketStatus.plan === "pro" ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                <Flame className="w-3.5 h-3.5 fill-amber-500" />
                無制限プラン利用中
              </span>
            ) : ticketStatus.isRegistered ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                <Ticket className="w-3.5 h-3.5" />
                残りチケット: {ticketStatus.availableTickets}回
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
                <Ticket className="w-3.5 h-3.5" />
                体験残り: {ticketStatus.availableTickets}回
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
