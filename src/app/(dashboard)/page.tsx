"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useStats } from "@/hooks/use-stats";
import { StreakBadge } from "@/components/features/dashboard/StreakBadge";
import { GreetingBanner } from "@/components/features/dashboard/GreetingBanner";
import { GuestSignupBanner } from "@/components/features/dashboard/GuestSignupBanner";
import { ActivityWpmCard } from "@/components/features/dashboard/ActivityWpmCard";
import { Mic, ArrowRight, History, Sparkles, AlertCircle, GraduationCap } from "lucide-react";

export default function DashboardPage() {
  const { stats, sessions, error, refresh } = useStats();

  // Handle OAuth callback login success or general login sync
  useEffect(() => {
    if (typeof window !== "undefined") {
      import("@/lib/storage/sync-service").then(async ({ getAuthenticatedUser, migrateGuestDataToSupabase }) => {
        const user = await getAuthenticatedUser();
        if (user && user.email) {
          const { upgradeGuestToRegisteredUser } = await import("@/lib/storage/ticket-store");
          upgradeGuestToRegisteredUser(user.email);
          await migrateGuestDataToSupabase();
          window.dispatchEvent(new Event("shadowlog:ticket-update"));
        }
      }).catch(() => {});
    }
  }, []);

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
    <div className="space-y-4 sm:space-y-6 pb-4 sm:pb-12 max-w-4xl mx-auto">
      {/* 1. 挨拶メッセージ（既存のものを維持） */}
      <GreetingBanner />

      {/* ゲスト向け無料登録CTA（未登録時のみ表示） */}
      <GuestSignupBanner />

      {/* 2. ストリーク（連続記録）：挨拶のすぐ下に配置。アイコン（🔥）でコンパクトかつ目立つ表示 */}
      <StreakBadge
        currentStreak={currentStreak}
        bestStreak={bestStreak}
        lastPracticedDate={stats?.lastPracticedDate}
        variant="compact"
      />

      {/* 3. メインアクション（横並びボタン）：Primary/Secondary差別化、押しやすいmin-h-[48px] */}
      <div className="grid grid-cols-2 gap-3 w-full">
        <Link
          href="/practice"
          className="min-h-[48px] sm:min-h-[52px] px-3 sm:px-5 py-3 bg-primary text-primary-foreground hover:bg-primary/90 font-bold rounded-2xl shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-xs sm:text-base group"
        >
          <Mic className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 group-hover:scale-110 transition-transform" />
          <span className="truncate">今すぐ練習を始める</span>
          <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 opacity-80 group-hover:translate-x-0.5 transition-transform hidden xs:inline-block" />
        </Link>
        <Link
          href="/review"
          className="min-h-[48px] sm:min-h-[52px] px-3 sm:px-5 py-3 bg-card border-2 border-border hover:border-primary/40 hover:bg-muted text-foreground font-bold rounded-2xl shadow-xs active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-xs sm:text-base group"
        >
          <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 text-primary group-hover:scale-110 transition-transform" />
          <span className="truncate">復習カルテ</span>
        </Link>
      </div>

      {/* 4. ウェルカムバナーの動的非表示：学習履歴が0件の初回のみ表示、1件以上で非表示 */}
      {sessions.length === 0 && (
        <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 p-5 sm:p-8 text-white shadow-xl relative overflow-hidden animate-in fade-in duration-300">
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="max-w-xl space-y-2.5 sm:space-y-3 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-[11px] sm:text-xs font-semibold backdrop-blur-md shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              AIシャドーイング学習
            </div>
            <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight leading-tight text-white drop-shadow-sm">
              話した分だけ、<span className="text-cyan-200">確実に伸びる。</span>
            </h1>
            <p className="text-blue-100 font-medium text-xs sm:text-sm leading-relaxed drop-shadow-xs">
              AIがあなた専用の英文を生成し、発話を一語一句分析。累計単語数とストリークで成長を実感しましょう。
            </p>
          </div>
        </div>
      )}

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

      {/* 5. 学習アクティビティとWPMの統合（累計ワード数 & 平均WPMサマリー + 14日ヒートマップ + WPM詳細トグル） */}
      <ActivityWpmCard
        totalWords={totalWords}
        totalSessions={totalSessions}
        averageAccuracy={avgAccuracy}
        dailyCounts={dailyCounts}
        sessions={sessions}
      />

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
              <Link
                key={session.id}
                href={`/review?tab=history&session=${encodeURIComponent(session.id)}`}
                className="py-3 sm:py-4 first:pt-0 last:pb-0 flex flex-col gap-2 sm:gap-3 group hover:bg-muted/40 rounded-xl px-2 sm:px-3 -mx-2 sm:-mx-3 transition-colors cursor-pointer block"
                title="タップして指導レビューを確認"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs sm:text-sm font-semibold text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-2">
                    {session.sentence}
                  </p>
                  <span className="text-[10px] text-primary shrink-0 opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                    指導レビュー →
                  </span>
                </div>
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
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
