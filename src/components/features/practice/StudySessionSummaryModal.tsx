"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  Flame,
  Clock,
  Share2,
  ArrowRight,
  X,
  MessageSquareQuote,
  Target,
  Maximize2,
} from "lucide-react";
import { DiffResult } from "@/types";
import { StreakSphereSwarm } from "@/components/features/dashboard/StreakSphereSwarm";

interface StudySessionSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  elapsedSeconds: number;
  streakDays: number;
  totalWords?: number;
  lastDiffResult?: DiffResult | null;
}

export function StudySessionSummaryModal({
  isOpen,
  onClose,
  elapsedSeconds,
  streakDays,
  totalWords = 0,
  lastDiffResult,
}: StudySessionSummaryModalProps) {
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [isFullscreenSphere, setIsFullscreenSphere] = useState(false);

  // ESCキーでスフィア全画面モーダルを閉じる
  useEffect(() => {
    if (!isFullscreenSphere) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsFullscreenSphere(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreenSphere]);

  if (!isOpen) return null;

  // Format elapsed time (e.g., 8分24秒)
  const safeSeconds = Math.max(60, elapsedSeconds);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  const timeFormatted = `${minutes}分${seconds > 0 ? `${seconds}秒` : ""}`;

  // Share text template
  const shareText = `【ShadowLog】今日の英語シャドーイング完了！\n⏱️ 学習時間: ${timeFormatted}\n🔥 連続学習: ${streakDays}日達成！\n今日も英語のリズムを一歩前進させました。\n#英語学習 #シャドーイング #シャドーログ\nhttps://shadowlog.app`;

  // X (Twitter) Share
  const handleShareX = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // Threads Share
  const handleShareThreads = () => {
    const url = `https://threads.net/intent/post?text=${encodeURIComponent(shareText)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // Instagram Share (Web Share API for mobile, clipboard copy + web open for desktop)
  const handleShareInstagram = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "ShadowLog 今日の学習完了！",
          text: shareText,
        });
        return;
      } catch {
        // User cancelled or share failed, fallback to copy
      }
    }

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareText);
        setCopiedType("instagram");
        setTimeout(() => setCopiedType(null), 3000);
        window.open("https://www.instagram.com", "_blank", "noopener,noreferrer");
      } catch {
        // Fallback
      }
    }
  };

  // Extract review points from last diff tokens (missing / mismatch)
  const problemWords: string[] = [];
  if (lastDiffResult?.tokens) {
    for (const token of lastDiffResult.tokens) {
      if (token.status === "missing" || token.status === "mismatch") {
        if (!problemWords.includes(token.word)) {
          problemWords.push(token.word);
        }
      }
      if (problemWords.length >= 2) break;
    }
  }

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto overscroll-contain"
      >
        <div className="relative w-full max-w-lg rounded-3xl bg-card border border-border shadow-2xl p-5 sm:p-7 space-y-5 my-auto max-h-[90dvh] overflow-y-auto animate-in zoom-in-95 duration-200">
          {/* Decorative Top Accent Glow */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500" />

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
            aria-label="モーダルを閉じる"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="text-center space-y-1.5 pt-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>🎉 今日のシャドーイング完了！</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
              お疲れ様でした！
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              素晴らしい集中力です。今日も英語脳を一歩鍛え上げました！
            </p>
          </div>

          {/* 3D Streak Sphere Growth Card */}
          <div className="rounded-2xl bg-gradient-to-b from-[#080d1a] to-[#04060a] border border-slate-800 p-4 flex flex-col items-center text-center shadow-lg">
            <div className="w-full flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-500 fill-amber-500/20 animate-pulse" />
                <span className="text-xs font-bold text-amber-400">
                  ストリークスフィア成長中
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsFullscreenSphere(true)}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 text-white text-[11px] font-bold transition flex items-center gap-1 border border-white/15 cursor-pointer"
                aria-label="スフィア全画面表示"
              >
                <Maximize2 className="w-3 h-3" />
                <span>全画面でスクショ</span>
              </button>
            </div>

            <div className="w-full h-[180px] sm:h-[210px] relative rounded-xl overflow-hidden my-1">
              <StreakSphereSwarm
                wordsCount={totalWords}
                streakDays={streakDays}
                isPracticedToday={true}
                className="w-full h-full border-0 bg-transparent"
              />
            </div>

            <div className="mt-1 flex items-center justify-center gap-4 text-white">
              <div className="flex items-baseline gap-1">
                <span className="text-base sm:text-lg font-extrabold font-mono text-amber-400">
                  {streakDays}
                </span>
                <span className="text-xs text-white/70 font-bold">日連続</span>
              </div>
              <span className="text-white/25">•</span>
              <div className="flex items-baseline gap-1">
                <span className="text-base sm:text-lg font-extrabold font-mono text-white">
                  {totalWords.toLocaleString()}
                </span>
                <span className="text-xs text-white/60 font-medium">words</span>
              </div>
            </div>
          </div>

          {/* Stats Grid: 学習時間 & ストリーク日数 */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {/* Time */}
          <div className="p-4 rounded-2xl bg-muted/40 border border-border text-center space-y-1">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
              <Clock className="w-4 h-4" />
            </div>
            <span className="text-[11px] text-muted-foreground font-semibold block">
              本日の学習時間
            </span>
            <span className="text-lg sm:text-xl font-black text-foreground block">
              {timeFormatted}
            </span>
          </div>

          {/* Streak */}
          <div className="p-4 rounded-2xl bg-muted/40 border border-border text-center space-y-1">
            <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center mx-auto">
              <Flame className="w-4 h-4" />
            </div>
            <span className="text-[11px] text-muted-foreground font-semibold block">
              連続学習記録
            </span>
            <span className="text-lg sm:text-xl font-black text-foreground block">
              {streakDays}日連続達成！
            </span>
          </div>
        </div>

        {/* AI Coach Encouragement Message */}
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1.5 text-xs sm:text-sm leading-relaxed">
          <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-bold">
            <MessageSquareQuote className="w-4 h-4 shrink-0" />
            <span>AIコーチからの労いの一言</span>
          </div>
          <p className="text-foreground/90 pl-5">
            「お疲れ様でした！今日も集中して声を出すことができましたね。英語のリズムが確実に身体に染み込んできています。明日もこのペースで楽しく進めていきましょう！」
          </p>
        </div>

        {/* Review Points (復習ポイント) */}
        <div className="p-4 rounded-2xl bg-card border border-border space-y-2 text-xs leading-relaxed">
          <div className="flex items-center gap-1.5 text-foreground font-bold">
            <Target className="w-4 h-4 text-primary shrink-0" />
            <span>今回の復習ワンポイント</span>
          </div>
          <ul className="space-y-1.5 text-muted-foreground pl-1">
            {problemWords.length > 0 ? (
              problemWords.map((word, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-primary font-bold">•</span>
                  <span>
                    単語「<strong className="text-foreground">{word}</strong>」の発音・脱落に注意し、口元の形を意識して復習しておきましょう。
                  </span>
                </li>
              ))
            ) : (
              <li className="flex items-start gap-1.5">
                <span className="text-primary font-bold">•</span>
                <span>フレーズ全体のリンキング（音の繋がり）と、語尾の自然な息継ぎを意識して定着させましょう。</span>
              </li>
            )}
          </ul>
        </div>

        {/* SNS Share Buttons */}
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span className="flex items-center gap-1">
              <Share2 className="w-3.5 h-3.5" />
              成果をSNSでシェア
            </span>
            {copiedType === "instagram" && (
              <span className="text-emerald-600 font-bold text-[11px] animate-in fade-in">
                ✓ テキストをコピーしました！
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2">
            {/* X */}
            <button
              type="button"
              onClick={handleShareX}
              className="p-2.5 rounded-xl border border-border bg-card hover:bg-muted font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer shadow-2xs"
            >
              <span className="font-mono text-sm font-black">𝕏</span>
              <span>ポスト</span>
            </button>

            {/* Threads */}
            <button
              type="button"
              onClick={handleShareThreads}
              className="p-2.5 rounded-xl border border-border bg-card hover:bg-muted font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer shadow-2xs"
            >
              <span className="font-bold text-sm">@</span>
              <span>Threads</span>
            </button>

            {/* Instagram */}
            <button
              type="button"
              onClick={handleShareInstagram}
              className="p-2.5 rounded-xl border border-border bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-purple-500/10 hover:opacity-90 font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer shadow-2xs text-foreground"
            >
              <span>📸</span>
              <span>Instagram</span>
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
          <Link
            href="/"
            className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm text-center transition shadow-md shadow-primary/20 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>ダッシュボードへ戻る</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto py-2.5 px-4 rounded-xl border border-border hover:bg-muted font-bold text-xs text-muted-foreground hover:text-foreground transition cursor-pointer"
          >
            まだ練習を続ける
          </button>
        </div>
      </div>
    </div>

    {/* 縦型全画面スフィアモーダル（スクショ撮影用） */}
    {isFullscreenSphere && (
      <div
        role="dialog"
        aria-modal="true"
        aria-label="ストリークスフィア全画面表示"
        className="fixed inset-0 z-[130] min-h-dvh flex flex-col items-center justify-between bg-[#04060a] text-white p-6 sm:p-8 select-none animate-in fade-in duration-300"
      >
        <div className="w-full flex justify-end">
          <button
            type="button"
            onClick={() => setIsFullscreenSphere(false)}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white/80 hover:text-white transition cursor-pointer"
            aria-label="全画面表示を閉じる"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex flex-col items-center text-center mt-2 sm:mt-4">
          <div className="flex items-center gap-2">
            <Flame className="w-8 h-8 sm:w-10 sm:h-10 text-amber-500 fill-amber-500/30 animate-pulse" />
            <span className="text-4xl sm:text-5xl font-extrabold font-mono tracking-tight text-white">
              {streakDays}
            </span>
            <span className="text-2xl sm:text-3xl font-bold text-amber-400">
              日連続
            </span>
          </div>
          <p className="text-xs sm:text-sm text-white/60 mt-1.5 font-medium">
            素晴らしい継続力です！今日も学習して記録を伸ばしましょう。
          </p>
        </div>

        <div className="w-full max-w-sm sm:max-w-md flex-1 min-h-[300px] my-4 flex items-center justify-center relative">
          <StreakSphereSwarm
            wordsCount={totalWords}
            streakDays={streakDays}
            isPracticedToday={true}
            className="w-full h-full min-h-[320px] rounded-3xl border border-white/10 shadow-[0_0_60px_rgba(0,0,0,0.8)]"
          />
        </div>

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
    )}
    </>
  );
}
