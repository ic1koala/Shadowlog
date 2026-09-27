"use client";

import { Flame, Trophy, Calendar } from "lucide-react";

interface StreakBadgeProps {
  currentStreak: number;
  bestStreak: number;
  lastPracticedDate?: string;
  variant?: "default" | "compact";
}

export function StreakBadge({
  currentStreak,
  bestStreak,
  lastPracticedDate,
  variant = "default",
}: StreakBadgeProps) {
  const isStreakActive = currentStreak > 0;

  if (variant === "compact") {
    return (
      <div className="bg-card rounded-2xl p-3.5 sm:p-4 border border-amber-500/25 bg-gradient-to-r from-amber-500/[0.08] via-orange-500/[0.03] to-card shadow-xs flex items-center justify-between gap-3 transition">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0 shadow-xs">
            <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500 fill-amber-500/20 animate-pulse" />
          </div>
          <div>
            <div className="flex items-baseline gap-1.5 sm:gap-2">
              <span className="text-xl sm:text-2xl font-extrabold font-mono tracking-tight text-foreground">
                {currentStreak}
              </span>
              <span className="text-xs sm:text-sm font-bold text-amber-600 dark:text-amber-400">
                日連続学習中！
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-muted-foreground line-clamp-1">
              {isStreakActive
                ? "素晴らしい継続力です！今日も学習して記録を伸ばしましょう。"
                : "今日1セッション完了して、新しいストリークを開始しましょう！"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 pl-2 sm:pl-3 border-l border-border/70 text-right">
          <div>
            <div className="text-[10px] sm:text-[11px] text-muted-foreground flex items-center justify-end gap-1">
              <Trophy className="w-3 h-3 text-amber-500" />
              <span>最高</span>
            </div>
            <div className="text-xs sm:text-sm font-bold font-mono text-foreground">
              {bestStreak}
              <span className="text-[10px] sm:text-xs font-normal text-muted-foreground ml-0.5">
                日
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl p-6 sm:p-8 border border-border shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-amber-500/40 transition">
      <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition">
        <Flame className="w-32 h-32 text-amber-500" />
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-medium text-xs uppercase tracking-wider">
          <Flame className="w-4 h-4 text-amber-500" />
          連続学習記録 (ストリーク)
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground font-mono">
            {currentStreak}
          </span>
          <span className="text-sm font-medium text-muted-foreground">日連続</span>
        </div>
        <p className="text-xs text-muted-foreground">
          {isStreakActive
            ? "素晴らしい継続力です！今日も学習を続けてストリークを伸ばしましょう。"
            : "今日練習を完了して、新しいストリークを開始しましょう！"}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-6 mt-6 border-t border-border/80">
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            過去最高記録
          </span>
          <p className="text-lg font-bold text-foreground">
            {bestStreak} <span className="text-xs font-normal text-muted-foreground">日</span>
          </p>
        </div>

        <div className="space-y-1">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            最終練習日
          </span>
          <p className="text-xs font-semibold text-foreground truncate">
            {lastPracticedDate
              ? new Date(lastPracticedDate).toLocaleDateString("ja-JP", {
                  month: "short",
                  day: "numeric",
                })
              : "未記録"}
          </p>
        </div>
      </div>
    </div>
  );
}
