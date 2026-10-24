"use client";

import { useState, useEffect } from "react";
import { Flame, Trophy, Calendar, ChevronDown, Maximize2, X } from "lucide-react";
import { StreakSphereSwarm } from "./StreakSphereSwarm";

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
}: StreakBadgeProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isStreakActive = currentStreak > 0;

  // ESCキーで全画面モーダルを閉じる
  useEffect(() => {
    if (!isFullscreen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsFullscreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  // 全画面表示中は背面のスクロールを固定
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isFullscreen]);

  // スフィア・ワード数・連続日数だけの縦型全画面モーダル
  const fullscreenModal = isFullscreen && (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="ストリークスフィア全画面表示"
      className="fixed inset-0 z-[120] min-h-dvh flex flex-col items-center justify-between bg-[#04060a] text-white p-6 sm:p-8 select-none animate-in fade-in duration-300"
    >
      {/* 右上 閉じるボタン */}
      <div className="w-full flex justify-end">
        <button
          type="button"
          onClick={() => setIsFullscreen(false)}
          className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white/80 hover:text-white transition cursor-pointer"
          aria-label="全画面表示を閉じる"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* 上部: 連続日数 */}
      <div className="flex flex-col items-center text-center mt-2 sm:mt-4">
        <div className="flex items-center gap-2">
          <Flame className="w-8 h-8 sm:w-10 sm:h-10 text-amber-500 fill-amber-500/30 animate-pulse" />
          <span className="text-4xl sm:text-5xl font-extrabold font-mono tracking-tight text-white">
            {currentStreak}
          </span>
          <span className="text-2xl sm:text-3xl font-bold text-amber-400">
            日連続
          </span>
        </div>
        <p className="text-xs sm:text-sm text-white/60 mt-1.5 font-medium">
          {currentStreak > 0
            ? "素晴らしい継続力です！今日も学習して記録を伸ばしましょう。"
            : "今日1セッション完了して、新しいストリークを開始しましょう！"}
        </p>
      </div>

      {/* 中央: 縦型 3D スフィア */}
      <div className="w-full max-w-sm sm:max-w-md flex-1 min-h-[300px] my-4 flex items-center justify-center relative">
        <StreakSphereSwarm
          wordsCount={totalWords}
          streakDays={currentStreak}
          isPracticedToday={isPracticedToday}
          className="w-full h-full min-h-[320px] rounded-3xl border border-white/10 shadow-[0_0_60px_rgba(0,0,0,0.8)]"
        />
      </div>

      {/* 下部: 発話ワード数 */}
      <div className="flex flex-col items-center text-center mb-4 sm:mb-6">
        <span className="text-xs sm:text-sm text-white/60 tracking-wider uppercase font-semibold">
          発話ワード数
        </span>
        <div className="flex items-baseline gap-1.5 mt-0.5">
          <span className="text-3xl sm:text-4xl font-extrabold font-mono text-white">
            {totalWords.toLocaleString()}
          </span>
          <span className="text-base sm:text-lg font-bold text-white/70">
            words
          </span>
        </div>
      </div>
    </div>
  );

  if (variant === "compact") {
    return (
      <>
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

            <div className="flex items-center gap-2.5 shrink-0 pl-2 sm:pl-3 border-l border-border/70 text-right self-center">
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

              {/* スフィア全画面ボタン */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFullscreen(true);
                }}
                className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 active:scale-95 text-amber-600 dark:text-amber-400 border border-amber-500/25 flex items-center gap-1 text-[11px] font-bold transition shrink-0 ml-1 cursor-pointer"
                title="スフィアを全画面表示"
                aria-label="スフィア全画面表示"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">全画面</span>
              </button>
            </div>
          </div>

          {/* ストリーク展開時: 縦型表示（スフィア・ワード数・連続日数のみ） */}
          {isExpanded && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full pt-3 mt-1 border-t border-amber-500/20 flex flex-col items-center gap-3 animate-in fade-in duration-200"
            >
              {/* 縦型スフィアプレビューカード */}
              <div className="w-full max-w-xs sm:max-w-sm rounded-2xl bg-gradient-to-b from-[#080d1a] to-[#04060a] border border-slate-800 p-4 flex flex-col items-center text-center shadow-lg">
                {/* 連続日数 */}
                <div className="flex items-center gap-2 mb-2">
                  <Flame className="w-5 h-5 text-amber-500 fill-amber-500/20 animate-pulse" />
                  <span className="text-xl sm:text-2xl font-extrabold font-mono text-white">
                    {currentStreak}
                  </span>
                  <span className="text-sm font-bold text-amber-400">
                    日連続
                  </span>
                </div>

                {/* 縦型 3D スフィア */}
                <div className="w-full h-[260px] sm:h-[300px] relative rounded-xl overflow-hidden my-1">
                  <StreakSphereSwarm
                    wordsCount={totalWords}
                    streakDays={currentStreak}
                    isPracticedToday={isPracticedToday}
                    className="w-full h-full border-0 bg-transparent"
                  />
                </div>

                {/* ワード数 */}
                <div className="mt-2 flex items-baseline gap-1 text-white">
                  <span className="text-lg sm:text-xl font-bold font-mono">
                    {totalWords.toLocaleString()}
                  </span>
                  <span className="text-xs text-white/60 font-medium">words</span>
                </div>

                {/* 全画面表示ボタン */}
                <button
                  type="button"
                  onClick={() => setIsFullscreen(true)}
                  className="mt-3 w-full py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 active:scale-[0.98] text-white text-xs font-bold transition flex items-center justify-center gap-1.5 border border-white/15 cursor-pointer"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>全画面で表示する</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 全画面モーダル */}
        {fullscreenModal}
      </>
    );
  }

  return (
    <>
      <div className="bg-card rounded-2xl p-6 sm:p-8 border border-border shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-amber-500/40 transition">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition">
          <Flame className="w-32 h-32 text-amber-500" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-medium text-xs uppercase tracking-wider">
              <Flame className="w-4 h-4 text-amber-500" />
              連続学習記録 (ストリーク)
            </div>
            <button
              type="button"
              onClick={() => setIsFullscreen(true)}
              className="p-1.5 px-2.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 active:scale-95 text-amber-600 dark:text-amber-400 border border-amber-500/25 flex items-center gap-1 text-[11px] font-bold transition cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>全画面</span>
            </button>
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

      {/* 全画面モーダル */}
      {fullscreenModal}
    </>
  );
}