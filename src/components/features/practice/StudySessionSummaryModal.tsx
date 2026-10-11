"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Flame,
  Clock,
  Share2,
  Check,
  GraduationCap,
  ArrowRight,
  X,
  MessageSquareQuote,
  Target,
} from "lucide-react";
import { DiffResult } from "@/types";

interface StudySessionSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  elapsedSeconds: number;
  streakDays: number;
  lastDiffResult?: DiffResult | null;
}

export function StudySessionSummaryModal({
  isOpen,
  onClose,
  elapsedSeconds,
  streakDays,
  lastDiffResult,
}: StudySessionSummaryModalProps) {
  const [copiedType, setCopiedType] = useState<string | null>(null);

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
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg rounded-3xl bg-card border border-border shadow-2xl p-6 sm:p-8 space-y-6 animate-in zoom-in-95 duration-200 overflow-hidden">
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
  );
}
