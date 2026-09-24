"use client";

import Link from "next/link";
import { useStats } from "@/hooks/use-stats";
import { WordStatsCard } from "@/components/features/dashboard/WordStatsCard";
import { StreakBadge } from "@/components/features/dashboard/StreakBadge";
import { ActivityHeatmap } from "@/components/features/dashboard/ActivityHeatmap";
import { Mic, ArrowRight, History, Sparkles, AlertCircle, GraduationCap } from "lucide-react";

export default function DashboardPage() {
  const { stats, sessions, error, refresh } = useStats();

  const totalWords = stats?.totalWords || 0;
  const totalSessions = stats?.totalSessions || 0;
  const currentStreak = stats?.currentStreak || 0;
  const bestStreak = stats?.bestStreak || 0;
  const dailyCounts = stats?.dailyCounts || {};

  const avgAccuracy =
    sessions.length > 0
      ? Math.round(
          sessions.reduce((acc, s) => acc + s.accuracyScore, 0) / sessions.length
        )
      : undefined;

  return (
    <div className="space-y-5 sm:space-y-8 pb-4 sm:pb-12">
      {/* Welcome Banner */}
      <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="max-w-xl space-y-3 sm:space-y-4 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-[11px] sm:text-xs font-semibold backdrop-blur-md shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            AIシャドーイング学習
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight text-white drop-shadow-sm">
            話した分だけ、<span className="text-cyan-200">確実に伸びる。</span>
          </h1>
          <p className="text-blue-100 font-medium text-xs sm:text-base leading-relaxed drop-shadow-xs">
            AIがあなた専用の英文を生成し、発話を一語一句分析。累計単語数とストリークで成長を実感しましょう。
          </p>
          <div className="pt-1 sm:pt-2 flex flex-wrap gap-2.5 sm:gap-3">
            <Link
              href="/practice"
              className="inline-flex items-center gap-2 px-5 py-3 sm:px-6 sm:py-3.5 bg-white text-primary font-bold rounded-xl sm:rounded-2xl shadow-md hover:bg-white/90 active:scale-95 transition text-sm sm:text-base"
            >
              <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
              今すぐ練習を始める
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-0.5" />
            </Link>
            <Link
              href="/review"
              className="inline-flex items-center gap-2 px-4 py-3 sm:px-5 sm:py-3.5 bg-white/20 text-white font-bold rounded-xl sm:rounded-2xl border border-white/30 backdrop-blur-xs hover:bg-white/30 active:scale-95 transition text-sm sm:text-base"
            >
              <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5" />
              復習カルテ・単語帳
            </Link>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 sm:p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs sm:text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>{error}</span>
          </div>
          <button
            onClick={refresh}
            className="text-xs underline font-semibold hover:opacity-80"
          >
            再試行
          </button>
        </div>
      )}

      {/* Main KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <WordStatsCard
          totalWords={totalWords}
          totalSessions={totalSessions}
          averageAccuracy={avgAccuracy}
        />
        <StreakBadge
          currentStreak={currentStreak}
          bestStreak={bestStreak}
          lastPracticedDate={stats?.lastPracticedDate}
        />
      </div>

      {/* Activity Heatmap */}
      <ActivityHeatmap dailyCounts={dailyCounts} />

      {/* Recent Sessions List */}
      <div className="bg-card rounded-2xl p-4 sm:p-8 border border-border shadow-sm space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
            <History className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            最近の学習履歴
          </h3>
          <span className="text-[11px] sm:text-xs text-muted-foreground">
            直近 {Math.min(sessions.length, 5)} 件{sessions.length > 5 ? ` (全${sessions.length}件)` : ""}
          </span>
        </div>

        {sessions.length === 0 ? (
          <div className="text-center py-6 sm:py-8 text-muted-foreground text-sm space-y-3">
            <p>まだ学習記録がありません。</p>
            <Link
              href="/practice"
              className="text-primary hover:underline text-sm font-medium inline-block"
            >
              最初のシャドーイングを行う →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {sessions.slice(0, 5).map((session) => (
              <div
                key={session.id}
                className="py-3 sm:py-4 first:pt-0 last:pb-0 flex flex-col gap-2 sm:gap-3"
              >
                <p className="text-xs sm:text-sm font-semibold text-foreground leading-snug">
                  {session.sentence}
                </p>
                <p className="text-[11px] sm:text-xs text-muted-foreground truncate font-mono">
                  認識: &ldquo;{session.transcription}&rdquo;
                </p>

                <div className="flex items-center justify-between">
                  <div className="text-[11px] sm:text-xs text-muted-foreground">
                    {new Date(session.createdAt).toLocaleDateString("ja-JP", {
                      month: "numeric",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs sm:text-sm font-semibold text-foreground">
                      {session.matchedWordCount}/{session.wordCount} words
                    </span>
                    <div
                      className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg font-bold text-[11px] sm:text-xs ${
                        session.accuracyScore >= 80
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                          : session.accuracyScore >= 60
                          ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                          : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {session.accuracyScore}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
