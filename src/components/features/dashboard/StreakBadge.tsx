"use client";

import { Flame, Trophy, Calendar } from "lucide-react";

interface StreakBadgeProps {
  currentStreak: number;
  bestStreak: number;
  lastPracticedDate?: string;
}

export function StreakBadge({
  currentStreak,
  bestStreak,
  lastPracticedDate,
}: StreakBadgeProps) {
  const isStreakActive = currentStreak > 0;

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
