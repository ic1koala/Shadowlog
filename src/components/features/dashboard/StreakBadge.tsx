"use client";

import { useState } from "react";
import { Flame, Trophy, Calendar, ChevronDown, Sparkles, Activity } from "lucide-react";
import {
  StreakSphereSwarm,
  STREAK_PALETTE,
  getStreakColor,
  getStreakFormName,
} from "./StreakSphereSwarm";

interface StreakBadgeProps {
  currentStreak: number;
  bestStreak: number;
  lastPracticedDate?: string;
  variant?: "default" | "compact";
  totalWords?: number;
  isPracticedToday?: boolean;
  isAdmin?: boolean;
}

export function StreakBadge({
  currentStreak,
  bestStreak,
  lastPracticedDate,
  variant = "default",
  totalWords = 0,
  isPracticedToday = true,
  isAdmin = false,
}: StreakBadgeProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isStreakActive = currentStreak > 0;
  const currentStreakColor = getStreakColor(currentStreak);
  const formName = getStreakFormName(currentStreak, totalWords);

  if (variant === "compact") {
    return (
      <div
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        onClick={() => setIsExpanded((prev) => !prev)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsExpanded((prev) => !prev);
          }
        }}
        className="w-full text-left bg-card rounded-2xl p-3.5 sm:p-4 border border-amber-500/25 bg-gradient-to-r from-amber-500/[0.08] via-orange-500/[0.03] to-card shadow-xs flex flex-col gap-3 transition cursor-pointer select-none hover:border-amber-500/40 active:scale-[0.99]"
        title={isExpanded ? "タップで折りたたむ" : "タップで詳細を展開"}
      >
        <div className="flex items-center justify-between gap-3 w-full">
          <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0 shadow-xs mt-0.5 sm:mt-0">
              <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500 fill-amber-500/20 animate-pulse" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-1.5 sm:gap-2">
                <span className="text-xl sm:text-2xl font-extrabold font-mono tracking-tight text-foreground">
                  {currentStreak}
                </span>
                <span className="text-xs sm:text-sm font-bold text-amber-600 dark:text-amber-400">
                  日連続学習中！
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-amber-600/70 dark:text-amber-400/70 transition-transform duration-200 ml-0.5 shrink-0 ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                />
              </div>
              <p
                className={`text-[11px] sm:text-xs text-muted-foreground leading-relaxed transition-all ${
                  isExpanded ? "whitespace-normal break-words mt-0.5" : "line-clamp-1"
                }`}
              >
                {isStreakActive
                  ? "素晴らしい継続力です！今日も学習して記録を伸ばしましょう。"
                  : "今日1セッション完了して、新しいストリークを開始しましょう！"}
              </p>
              {isExpanded && lastPracticedDate && (
                <p className="text-[10px] sm:text-[11px] text-muted-foreground/80 flex items-center gap-1 mt-1 animate-in fade-in duration-150">
                  <Calendar className="w-3 h-3 text-amber-500 shrink-0" />
                  <span>
                    最終練習日:{" "}
                    {new Date(lastPracticedDate).toLocaleDateString("ja-JP", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 pl-2 sm:pl-3 border-l border-border/70 text-right self-center">
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

        {/* 管理者テスト機能: ストリーク展開時にスフィアグラデーション＆凡例を表示 */}
        {isExpanded && isAdmin && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full pt-3 mt-1 border-t border-amber-500/20 flex flex-col gap-3 animate-in fade-in duration-200"
          >
            {/* スフィアステータスヘッダー */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center justify-center p-1 rounded-md bg-amber-500/10 text-amber-500">
                  <Sparkles className="w-3.5 h-3.5" />
                </span>
                <div>
                  <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <span>ストリークスフィア (Admin Test)</span>
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-full shadow-xs"
                      style={{ backgroundColor: currentStreakColor.hex }}
                    />
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    形態: <span className="font-semibold text-foreground">{formName.label}</span> ({formName.sub})
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-muted-foreground block">発話ワード数 / 粒子量</span>
                <span className="text-xs font-mono font-bold text-foreground">
                  {totalWords.toLocaleString()} <span className="text-[10px] font-normal text-muted-foreground">words</span>
                </span>
              </div>
            </div>

            {/* 3D WebGL スフィアキャンバス */}
            <StreakSphereSwarm
              wordsCount={totalWords}
              streakDays={currentStreak}
              isPracticedToday={isPracticedToday}
            />

            {/* 凡例バー & カラー指標（何日継続で何色になるかのガイド） */}
            <div className="space-y-1.5 bg-background/50 dark:bg-slate-900/40 p-2.5 rounded-xl border border-border/60">
              <div className="flex items-center justify-between text-[10px] font-semibold text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Activity className="w-3 h-3 text-cyan-500" />
                  継続日数カラー指標 (Streak Palette)
                </span>
                <span className="font-mono text-[9px] text-muted-foreground">
                  現在: Day {currentStreak}
                </span>
              </div>

              {/* グラデーションバー */}
              <div className="w-full h-2.5 rounded-full overflow-hidden border border-white/10 flex shadow-inner">
                <div className="w-[12%] h-full bg-[#ffffff]" title="Day 1 (白光)" />
                <div className="w-[20%] h-full bg-gradient-to-r from-[#ffffff] to-[#ff9400]" title="Day 1〜6 (黄金橙)" />
                <div className="w-[18%] h-full bg-gradient-to-r from-[#ff9400] to-[#e0f52e]" title="Day 6〜12 (新緑黄)" />
                <div className="w-[18%] h-full bg-gradient-to-r from-[#e0f52e] to-[#14e07a]" title="Day 12〜18 (翠緑)" />
                <div className="w-[16%] h-full bg-gradient-to-r from-[#14e07a] to-[#00b8ff]" title="Day 18〜24 (天空碧)" />
                <div className="w-[16%] h-full bg-gradient-to-r from-[#00b8ff] to-[#0047ff]" title="Day 24〜30+ (深海瑠璃)" />
              </div>

              {/* 指標ステップ一覧 */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 pt-1 text-[9px]">
                {STREAK_PALETTE.map((step) => {
                  const isCurrent =
                    (step.day === 1 && currentStreak <= 1) ||
                    (step.day === 6 && currentStreak > 1 && currentStreak <= 6) ||
                    (step.day === 12 && currentStreak > 6 && currentStreak <= 12) ||
                    (step.day === 18 && currentStreak > 12 && currentStreak <= 18) ||
                    (step.day === 24 && currentStreak > 18 && currentStreak <= 24) ||
                    (step.day === 30 && currentStreak >= 25);

                  return (
                    <div
                      key={step.day}
                      className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md border transition ${
                        isCurrent
                          ? "bg-accent border-primary/50 font-bold text-foreground"
                          : "border-transparent text-muted-foreground"
                      }`}
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0 shadow-2xs"
                        style={{ backgroundColor: step.colorHex }}
                      />
                      <span className="truncate">{step.day === 30 ? "30日〜" : `${step.day}日`}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
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
