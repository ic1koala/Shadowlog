"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import {
  TrendingUp,
  Eye,
  Heart,
  MessageCircle,
  Repeat,
  Quote,
  Clock,
  Send,
  ExternalLink,
  RefreshCw,
  Sparkles,
  BarChart3,
  Calendar,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { ThreadsPerformanceResponse, ThreadsPostInsight } from "@/app/api/admin/threads-performance/route";

interface ThreadsPerformanceSectionProps {
  onRefreshParent?: () => void;
}

export function ThreadsPerformanceSection({ onRefreshParent }: ThreadsPerformanceSectionProps) {
  const [data, setData] = useState<ThreadsPerformanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [processingQueue, setProcessingQueue] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"views" | "likes" | "newest">("newest");

  const fetchData = async (forceRefresh = false) => {
    if (forceRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/threads-performance${forceRefresh ? "?refresh=true" : ""}`);
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Error ${res.status}: データの取得に失敗しました`);
      }
      const json: ThreadsPerformanceResponse = await res.json();
      setData(json);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle Manual Queue Trigger
  const handleProcessQueueNow = async () => {
    if (!confirm("待機中の予約キュー投稿を今すぐ処理しますか？")) return;
    setProcessingQueue(true);
    setActionMessage(null);
    try {
      const res = await fetch("/api/threads/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "process-queue" }),
      });
      const result = await res.json();
      if (res.ok) {
        setActionMessage(`キュー処理完了: ${result.processedCount ?? 0} 件を送信しました`);
        fetchData(true);
        if (onRefreshParent) onRefreshParent();
      } else {
        alert(`キュー処理エラー: ${result.error || "不明なエラー"}`);
      }
    } catch (err: unknown) {
      alert(`通信エラー: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setProcessingQueue(false);
    }
  };

  // Filter & Sort Posts
  const sortedPosts = useMemo(() => {
    if (!data?.posts) return [];
    let list = [...data.posts];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      list = list.filter((p) => p.text.toLowerCase().includes(query));
    }

    if (sortBy === "views") {
      list.sort((a, b) => b.views - a.views);
    } else if (sortBy === "likes") {
      list.sort((a, b) => b.likes - a.likes);
    } else {
      list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }

    return list;
  }, [data?.posts, searchQuery, sortBy]);

  // Max views for relative bar width
  const maxViews = useMemo(() => {
    if (!data?.posts || data.posts.length === 0) return 1;
    return Math.max(...data.posts.map((p) => p.views), 1);
  }, [data?.posts]);

  if (loading) {
    return (
      <div className="p-12 text-center flex flex-col items-center justify-center space-y-4 rounded-2xl border border-border bg-card">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
        <div className="space-y-1">
          <p className="font-bold text-sm text-foreground">Threads リアルタイムインサイトを取得中...</p>
          <p className="text-xs text-muted-foreground">Meta Threads Graph API とリアルタイム同期しています</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 rounded-2xl border border-destructive/30 bg-destructive/5 text-destructive space-y-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <h3 className="font-bold text-base">Threads データの取得に失敗しました</h3>
        </div>
        <p className="text-xs font-mono bg-destructive/10 p-3 rounded-lg overflow-x-auto">{error}</p>
        <button
          onClick={() => fetchData(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>再試行する</span>
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* 1. Account & Live Header Banner */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-purple-600/10 border border-primary/20 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {data.profile.threads_profile_picture_url ? (
              <Image
                src={data.profile.threads_profile_picture_url}
                alt={data.profile.username}
                width={56}
                height={56}
                className="w-14 h-14 rounded-2xl border-2 border-primary/30 object-cover shadow-sm"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl shadow-sm">
                @
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-black text-lg sm:text-xl text-foreground tracking-tight">
                  @{data.profile.username}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Meta API リアルタイム連携中
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-1 max-w-xl">
                {data.profile.threads_biography || "AIシャドーイング ShadowLog 公式Threadsアカウント"}
              </p>
              <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                <span>最終更新: {new Date(data.fetchedAt).toLocaleTimeString("ja-JP")}</span>
                <span>•</span>
                <a
                  href={`https://www.threads.com/@${data.profile.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-1 font-semibold"
                >
                  <span>Threads公式で開く</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border border-border bg-card hover:bg-muted text-foreground transition shadow-2xs disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-primary" : ""}`} />
              <span>{refreshing ? "更新中..." : "最新インサイト取得"}</span>
            </button>
          </div>
        </div>

        {actionMessage && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{actionMessage}</span>
          </div>
        )}
      </div>

      {/* 2. Real-time KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Views / Impressions */}
        <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-blue-500" />
              総インプレッション (Views)
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold">
              LIVE
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              {data.accountInsights.totalViews.toLocaleString()}
            </span>
            <span className="text-xs text-muted-foreground font-medium">回閲覧</span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            投稿一覧およびアカウント合算インプレッション
          </p>
        </div>

        {/* Total Engagements */}
        <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-rose-500" />
              総エンゲージメント
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold">
              Reacts
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              {(
                data.accountInsights.totalLikes +
                data.accountInsights.totalReplies +
                data.accountInsights.totalReposts
              ).toLocaleString()}
            </span>
            <span className="text-xs text-muted-foreground font-medium">アクション</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground pt-0.5">
            <span>❤️ {data.accountInsights.totalLikes} いいね</span>
            <span>💬 {data.accountInsights.totalReplies} 返信</span>
            <span>🔁 {data.accountInsights.totalReposts} リポスト</span>
          </div>
        </div>

        {/* Published Posts */}
        <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold flex items-center gap-1.5">
              <Send className="w-4 h-4 text-emerald-500" />
              公開済み投稿数
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
              Post Count
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              {data.posts.length}
            </span>
            <span className="text-xs text-muted-foreground font-medium">投稿取得中</span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            直近20件の個別インサイト追跡中
          </p>
        </div>

        {/* Queue Status */}
        <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-500" />
              予約待機キュー
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold">
              Scheduler
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
              {data.queueSummary.pendingCount}
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              / 全{data.queueSummary.totalQueue}件
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground truncate" title={data.queueSummary.nextScheduledPost ? `次回: ${new Date(data.queueSummary.nextScheduledPost.scheduledAt).toLocaleString("ja-JP")}` : "全キュー配信済み"}>
            {data.queueSummary.nextScheduledPost
              ? `次回: ${new Date(data.queueSummary.nextScheduledPost.scheduledAt).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" })} ${new Date(data.queueSummary.nextScheduledPost.scheduledAt).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}`
              : "全予約キュー完了"}
          </p>
        </div>
      </div>

      {/* 3. Daily Views Breakdown (if available) & Scheduled Queue Monitor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Views Bar Chart */}
        <div className="lg:col-span-1 p-5 rounded-2xl bg-card border border-border shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              日別インプレッション推移
            </h3>
            <span className="text-[10px] text-muted-foreground">直近の推移</span>
          </div>

          {data.accountInsights.viewsDaily.length > 0 ? (
            <div className="space-y-3">
              {data.accountInsights.viewsDaily.map((item) => {
                const maxDay = Math.max(...data.accountInsights.viewsDaily.map((d) => d.value), 1);
                const percent = Math.min(100, Math.round((item.value / maxDay) * 100));
                return (
                  <div key={item.date} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground">{item.date}</span>
                      <span className="font-bold text-primary">{item.value.toLocaleString()} views</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-muted-foreground">
              日別データ集計中（Meta APIからの集計同期をお待ちください）
            </div>
          )}
        </div>

        {/* Scheduled Queue Control & Next Up Monitor */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-card border border-border shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-500" />
              <h3 className="font-bold text-sm text-foreground">
                2週間自動投稿スケジュール（進捗モニター）
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleProcessQueueNow}
                disabled={processingQueue || data.queueSummary.pendingCount === 0}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500 text-amber-950 hover:bg-amber-400 transition disabled:opacity-40 shadow-xs"
              >
                <Send className={`w-3.5 h-3.5 ${processingQueue ? "animate-spin" : ""}`} />
                <span>{processingQueue ? "処理中..." : "待機キューを今すぐ送信"}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2.5 rounded-xl bg-muted/60 border border-border">
              <div className="text-[10px] text-muted-foreground font-medium">公開完了</div>
              <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                {data.queueSummary.publishedCount}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-muted/60 border border-border">
              <div className="text-[10px] text-muted-foreground font-medium">予約待機中</div>
              <div className="text-lg font-black text-amber-600 dark:text-amber-400 mt-0.5">
                {data.queueSummary.pendingCount}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-muted/60 border border-border">
              <div className="text-[10px] text-muted-foreground font-medium">スキップ</div>
              <div className="text-lg font-black text-muted-foreground mt-0.5">
                {data.queueSummary.skippedCount}
              </div>
            </div>
          </div>

          {data.queueSummary.nextScheduledPost ? (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-amber-700 dark:text-amber-400">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  次回自動投稿の予定
                </span>
                <span>
                  {new Date(data.queueSummary.nextScheduledPost.scheduledAt).toLocaleString("ja-JP", {
                    month: "numeric",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <p className="text-xs text-foreground/90 font-medium whitespace-pre-wrap line-clamp-3 bg-background/50 p-2.5 rounded-lg border border-amber-500/10">
                {data.queueSummary.nextScheduledPost.text}
              </p>
            </div>
          ) : (
            <div className="p-4 text-center text-xs text-muted-foreground bg-muted/30 rounded-xl">
              待機中の予約キューはありません。すべての予約投稿が配信完了しました。
            </div>
          )}
        </div>
      </div>

      {/* 4. Live Post Performance List */}
      <div className="p-5 sm:p-6 rounded-3xl bg-card border border-border shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-black text-base text-foreground tracking-tight flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              投稿別リアルタイム・インプレッション詳細
            </h3>
            <p className="text-xs text-muted-foreground">
              直近の各Threads投稿の閲覧数・リアクション数をリアルタイム集計中
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="text"
              placeholder="投稿テキストを検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-40 sm:w-52"
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "views" | "likes" | "newest")}
              className="px-3 py-1.5 text-xs rounded-xl border border-border bg-background text-foreground font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="newest">新しい順</option>
              <option value="views">閲覧数 (Views) 順</option>
              <option value="likes">いいね順</option>
            </select>
          </div>
        </div>

        {sortedPosts.length === 0 ? (
          <div className="py-12 text-center text-xs text-muted-foreground">
            条件に一致する投稿が見つかりませんでした。
          </div>
        ) : (
          <div className="space-y-3">
            {sortedPosts.map((post, idx) => {
              const isExpanded = expandedPostId === post.id;
              const dateStr = post.timestamp
                ? new Date(post.timestamp).toLocaleString("ja-JP", {
                    month: "numeric",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "日時不明";

              const relativeWidth = Math.max(6, Math.round((post.views / maxViews) * 100));
              const isTopView = idx === 0 && sortBy === "views" && post.views > 0;

              return (
                <div
                  key={post.id}
                  className={`p-4 rounded-2xl border transition-all duration-200 ${
                    isTopView
                      ? "border-amber-500/40 bg-amber-500/5 shadow-xs"
                      : "border-border bg-muted/20 hover:bg-muted/40"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground/80">{dateStr}</span>
                        <span>•</span>
                        <span className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono">
                          ID: {post.id}
                        </span>
                        {post.media_type === "IMAGE" && (
                          <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] font-bold">
                            🖼️ 画像付
                          </span>
                        )}
                        {isTopView && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-400 text-[10px] font-bold flex items-center gap-1">
                            🔥 最多閲覧
                          </span>
                        )}
                      </div>

                      <p
                        className={`text-xs sm:text-sm text-foreground whitespace-pre-wrap leading-relaxed ${
                          isExpanded ? "" : "line-clamp-2"
                        }`}
                      >
                        {post.text}
                      </p>

                      {post.text.length > 80 && (
                        <button
                          onClick={() => setExpandedPostId(isExpanded ? null : post.id)}
                          className="text-[11px] text-primary hover:underline font-semibold flex items-center gap-0.5"
                        >
                          {isExpanded ? (
                            <>
                              <span>閉じる</span>
                              <ChevronUp className="w-3 h-3" />
                            </>
                          ) : (
                            <>
                              <span>全文を表示</span>
                              <ChevronDown className="w-3 h-3" />
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {/* Performance Metrics Block */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 sm:gap-1.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-muted-foreground font-semibold">Views:</span>
                        <span className="px-2.5 py-1 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 font-black text-sm sm:text-base flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" />
                          {post.views.toLocaleString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                        <span className="flex items-center gap-0.5" title="いいね">
                          <Heart className="w-3 h-3 text-rose-500" />
                          {post.likes}
                        </span>
                        <span className="flex items-center gap-0.5" title="返信">
                          <MessageCircle className="w-3 h-3 text-sky-500" />
                          {post.replies}
                        </span>
                        <span className="flex items-center gap-0.5" title="再投稿">
                          <Repeat className="w-3 h-3 text-emerald-500" />
                          {post.reposts}
                        </span>
                      </div>

                      {post.permalink && (
                        <a
                          href={post.permalink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 text-[11px] text-primary hover:underline font-bold flex items-center gap-1"
                        >
                          <span>Threadsで確認</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Relative Views Bar */}
                  {maxViews > 0 && (
                    <div className="mt-3 pt-2 border-t border-border/40">
                      <div className="w-full h-1.5 rounded-full bg-muted/60 overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${relativeWidth}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
