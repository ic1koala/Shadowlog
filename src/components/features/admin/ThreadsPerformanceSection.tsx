"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Image from "next/image";
import {
  TrendingUp,
  Eye,
  Heart,
  MessageCircle,
  Repeat,
  Clock,
  Send,
  ExternalLink,
  RefreshCw,
  BarChart3,
  Calendar,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Search,
  X,
  Flame,
  Image as ImageIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ThreadsPerformanceResponse } from "@/app/api/admin/threads-performance/route";

interface ThreadsPerformanceSectionProps {
  onRefreshParent?: () => void;
  authToken?: string | null;
  adminEmail?: string | null;
}

type MobileTab = "posts" | "queue" | "insights";
type PostFilter = "all" | "top_views" | "with_image";

export function ThreadsPerformanceSection({
  onRefreshParent,
  authToken,
  adminEmail,
}: ThreadsPerformanceSectionProps) {
  const [data, setData] = useState<ThreadsPerformanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [processingQueue, setProcessingQueue] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"views" | "likes" | "newest">("newest");
  const [postFilter, setPostFilter] = useState<PostFilter>("all");
  const [activeTab, setActiveTab] = useState<MobileTab>("posts");

  const fetchData = useCallback(
    async (forceRefresh = false) => {
      if (forceRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        let token = authToken;
        if (!token && typeof window !== "undefined") {
          try {
            const supabase = createClient();
            const {
              data: { session },
            } = await supabase.auth.getSession();
            token = session?.access_token || null;
          } catch {
            // ignore
          }
        }

        const headers: Record<string, string> = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
        const quickEmail =
          adminEmail ||
          (typeof window !== "undefined" ? localStorage.getItem("shadowlog_user_email") : null);
        if (quickEmail) {
          headers["x-admin-quick-email"] = quickEmail;
        }

        const queryParams = new URLSearchParams({
          refresh: forceRefresh ? "true" : "false",
          _t: Date.now().toString(),
        });
        if (quickEmail) {
          queryParams.set("quick_admin", quickEmail);
        }

        const res = await fetch(
          `/api/admin/threads-performance?${queryParams.toString()}`,
          {
            headers,
            cache: "no-store",
          }
        );

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
    },
    [authToken]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle Manual Queue Trigger
  const handleProcessQueueNow = async () => {
    if (!confirm("待機中の予約キュー投稿を今すぐ処理しますか？")) return;
    setProcessingQueue(true);
    setActionMessage(null);
    try {
      let token = authToken;
      if (!token && typeof window !== "undefined") {
        try {
          const supabase = createClient();
          const {
            data: { session },
          } = await supabase.auth.getSession();
          token = session?.access_token || null;
        } catch {
          // ignore
        }
      }

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch("/api/threads/publish", {
        method: "POST",
        headers,
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

    // Filter by text search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      list = list.filter((p) => p.text.toLowerCase().includes(query));
    }

    // Filter by quick filter
    if (postFilter === "top_views") {
      list = list.filter((p) => p.views > 0);
    } else if (postFilter === "with_image") {
      list = list.filter((p) => p.media_type === "IMAGE");
    }

    // Sort
    if (sortBy === "views") {
      list.sort((a, b) => b.views - a.views);
    } else if (sortBy === "likes") {
      list.sort((a, b) => b.likes - a.likes);
    } else {
      list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }

    return list;
  }, [data?.posts, searchQuery, postFilter, sortBy]);

  // Max views for relative bar width
  const maxViews = useMemo(() => {
    if (!data?.posts || data.posts.length === 0) return 1;
    return Math.max(...data.posts.map((p) => p.views), 1);
  }, [data?.posts]);

  // Format relative timestamp helper
  const formatTimeAgo = (isoString?: string) => {
    if (!isoString) return "日時不明";
    const postDate = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - postDate.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      const diffMins = Math.max(1, Math.floor(diffMs / (1000 * 60)));
      return `${diffMins}分前`;
    }
    if (diffHours < 24) {
      return `${diffHours}時間前`;
    }
    if (diffDays === 1) {
      return `昨日 ${postDate.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}`;
    }
    return postDate.toLocaleDateString("ja-JP", {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-4 rounded-3xl border border-border bg-card">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
        <div className="space-y-1">
          <p className="font-bold text-sm text-foreground">Threads リアルタイム最新データを取得中...</p>
          <p className="text-xs text-muted-foreground">Meta Graph API サーバーへ直接接続しています</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 sm:p-8 rounded-3xl border border-destructive/30 bg-destructive/5 text-destructive space-y-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <h3 className="font-bold text-base">Threads データの取得に失敗しました</h3>
        </div>
        <p className="text-xs font-mono bg-destructive/10 p-3 rounded-xl overflow-x-auto">{error}</p>
        <button
          onClick={() => fetchData(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90 transition shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>最新情報を再試行する</span>
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* ── 1. Mobile-Optimized Header Banner ── */}
      <div className="p-4 sm:p-6 rounded-3xl bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-purple-600/10 border border-primary/25 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {data.profile.threads_profile_picture_url ? (
              <Image
                src={data.profile.threads_profile_picture_url}
                alt={data.profile.username}
                width={48}
                height={48}
                className="w-12 h-12 rounded-2xl border-2 border-primary/30 object-cover shadow-sm shrink-0"
              />
            ) : (
              <Image
                src="/icons/icon-512.png"
                alt="ShadowLog Official"
                width={48}
                height={48}
                className="w-12 h-12 rounded-2xl border-2 border-primary/30 object-cover shadow-sm shrink-0"
              />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-black text-base sm:text-lg text-foreground tracking-tight truncate">
                  @{data.profile.username}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  LIVE
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5 flex-wrap">
                <span className="font-semibold text-foreground/80">
                  更新: {new Date(data.fetchedAt).toLocaleTimeString("ja-JP")}
                </span>
                <span>•</span>
                <a
                  href={`https://www.threads.com/@${data.profile.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-0.5 font-bold"
                >
                  <span>公式Threads ↗</span>
                </a>
              </div>
            </div>
          </div>

          {/* Quick Refresh Button */}
          <div className="flex items-center justify-between sm:justify-end gap-2 pt-1 sm:pt-0 border-t sm:border-t-0 border-border/50">
            <span className="text-[11px] text-muted-foreground sm:hidden font-medium">
              Meta直結・最新データ
            </span>
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition shadow-sm active:scale-95 disabled:opacity-50 min-h-[38px] cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
              <span>{refreshing ? "最新情報を取得中..." : "🔄 最新情報に更新"}</span>
            </button>
          </div>
        </div>

        {actionMessage && (
          <div className="mt-3 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2 font-bold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{actionMessage}</span>
          </div>
        )}
      </div>

      {/* ── 2. Real-time KPI Metric Cards (2x2 Grid on Mobile) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Total Views / Impressions */}
        <div className="p-3.5 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-2xs space-y-1 sm:space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] sm:text-xs font-bold flex items-center gap-1">
              <Eye className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span>総Views</span>
            </span>
            <span className="text-[9px] sm:text-[10px] px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold">
              LIVE
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-3xl font-black text-foreground tracking-tight">
              {data.accountInsights.totalViews.toLocaleString()}
            </span>
            <span className="text-[10px] sm:text-xs text-muted-foreground font-semibold">回</span>
          </div>
          <p className="text-[10px] text-muted-foreground hidden sm:block">
            投稿一覧およびアカウント合算インプレッション
          </p>
        </div>

        {/* Total Engagements */}
        <div className="p-3.5 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-2xs space-y-1 sm:space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] sm:text-xs font-bold flex items-center gap-1">
              <Heart className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span>リアクション</span>
            </span>
            <span className="text-[9px] sm:text-[10px] px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold">
              合計
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-3xl font-black text-foreground tracking-tight">
              {(
                data.accountInsights.totalLikes +
                data.accountInsights.totalReplies +
                data.accountInsights.totalReposts
              ).toLocaleString()}
            </span>
            <span className="text-[10px] sm:text-xs text-muted-foreground font-semibold">件</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium flex-wrap">
            <span>❤️{data.accountInsights.totalLikes}</span>
            <span>💬{data.accountInsights.totalReplies}</span>
            <span>🔁{data.accountInsights.totalReposts}</span>
          </div>
        </div>

        {/* Published Posts */}
        <div className="p-3.5 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-2xs space-y-1 sm:space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] sm:text-xs font-bold flex items-center gap-1">
              <Send className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>公開投稿数</span>
            </span>
            <span className="text-[9px] sm:text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
              追跡中
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-3xl font-black text-foreground tracking-tight">
              {data.posts.length}
            </span>
            <span className="text-[10px] sm:text-xs text-muted-foreground font-semibold">件</span>
          </div>
          <p className="text-[10px] text-muted-foreground hidden sm:block">
            直近20件の個別インサイト追跡中
          </p>
        </div>

        {/* Queue Status */}
        <div className="p-3.5 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-2xs space-y-1 sm:space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] sm:text-xs font-bold flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>予約キュー</span>
            </span>
            <span className="text-[9px] sm:text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold">
              残り
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
              {data.queueSummary.pendingCount}
            </span>
            <span className="text-[10px] sm:text-xs text-muted-foreground font-semibold">
              / 全{data.queueSummary.totalQueue}件
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground truncate">
            {data.queueSummary.nextScheduledPost
              ? `次回: ${new Date(data.queueSummary.nextScheduledPost.scheduledAt).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" })} ${new Date(data.queueSummary.nextScheduledPost.scheduledAt).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}`
              : "全配信完了"}
          </p>
        </div>
      </div>

      {/* ── 3. Mobile Segmented Tab Switcher ── */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-muted/70 border border-border/80 text-xs font-bold overflow-x-auto">
        <button
          onClick={() => setActiveTab("posts")}
          className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === "posts"
              ? "bg-card text-foreground shadow-sm font-black"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5 text-primary" />
          <span>投稿一覧 ({data.posts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("queue")}
          className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === "queue"
              ? "bg-card text-foreground shadow-sm font-black"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-amber-500" />
          <span>予約キュー ({data.queueSummary.pendingCount})</span>
        </button>

        <button
          onClick={() => setActiveTab("insights")}
          className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === "insights"
              ? "bg-card text-foreground shadow-sm font-black"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5 text-blue-500" />
          <span>日別推移</span>
        </button>
      </div>

      {/* ── TAB CONTENT: 1. POSTS VIEW ── */}
      {activeTab === "posts" && (
        <div className="p-4 sm:p-6 rounded-3xl bg-card border border-border shadow-xs space-y-4">
          {/* Filter & Search Bar */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="投稿テキストを検索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "views" | "likes" | "newest")}
                  className="px-3 py-2 text-xs rounded-xl border border-border bg-background text-foreground font-bold focus:outline-none focus:ring-1 focus:ring-primary w-full sm:w-auto"
                >
                  <option value="newest">⏱️ 新しい順</option>
                  <option value="views">🔥 閲覧数 (Views) 順</option>
                  <option value="likes">❤️ いいね順</option>
                </select>
              </div>
            </div>

            {/* Quick Filter Chips */}
            <div className="flex items-center gap-1.5 flex-wrap text-[11px] font-bold">
              <button
                onClick={() => setPostFilter("all")}
                className={`px-2.5 py-1 rounded-lg border transition ${
                  postFilter === "all"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/60 text-muted-foreground border-border hover:bg-muted"
                }`}
              >
                すべて ({data.posts.length})
              </button>
              <button
                onClick={() => setPostFilter("top_views")}
                className={`px-2.5 py-1 rounded-lg border transition flex items-center gap-1 ${
                  postFilter === "top_views"
                    ? "bg-amber-500 text-amber-950 border-amber-500"
                    : "bg-muted/60 text-muted-foreground border-border hover:bg-muted"
                }`}
              >
                <Flame className="w-3 h-3 text-amber-500" />
                <span>閲覧あり (Views &gt; 0)</span>
              </button>
              <button
                onClick={() => setPostFilter("with_image")}
                className={`px-2.5 py-1 rounded-lg border transition flex items-center gap-1 ${
                  postFilter === "with_image"
                    ? "bg-purple-600 text-white border-purple-600"
                    : "bg-muted/60 text-muted-foreground border-border hover:bg-muted"
                }`}
              >
                <ImageIcon className="w-3 h-3 text-purple-400" />
                <span>画像付き投稿</span>
              </button>
            </div>
          </div>

          {/* Posts List */}
          {sortedPosts.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              条件に一致する投稿が見つかりませんでした。
            </div>
          ) : (
            <div className="space-y-3">
              {sortedPosts.map((post, idx) => {
                const isExpanded = expandedPostId === post.id;
                const relativeWidth = Math.max(6, Math.round((post.views / maxViews) * 100));
                const isTopView = idx === 0 && sortBy === "views" && post.views > 0;

                return (
                  <div
                    key={post.id}
                    className={`p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 ${
                      isTopView
                        ? "border-amber-500/40 bg-amber-500/5 shadow-xs"
                        : "border-border bg-card hover:bg-muted/30"
                    }`}
                  >
                    <div className="space-y-2">
                      {/* Post Header: Timestamp & Badges */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 flex-wrap text-xs text-muted-foreground font-semibold">
                          <span className="text-foreground">{formatTimeAgo(post.timestamp)}</span>
                          <span>•</span>
                          <span className="font-mono text-[10px] text-muted-foreground/80">
                            #{post.id.slice(-6)}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {isTopView && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-400 text-[10px] font-black flex items-center gap-0.5">
                              <Flame className="w-3 h-3" />
                              <span>最多閲覧</span>
                            </span>
                          )}
                          {post.media_type === "IMAGE" && (
                            <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] font-bold flex items-center gap-0.5">
                              <ImageIcon className="w-3 h-3" />
                              <span>画像</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Post Content */}
                      <p
                        className={`text-xs sm:text-sm text-foreground whitespace-pre-wrap leading-relaxed ${
                          isExpanded ? "" : "line-clamp-2"
                        }`}
                      >
                        {post.text}
                      </p>

                      {post.text.length > 70 && (
                        <button
                          onClick={() => setExpandedPostId(isExpanded ? null : post.id)}
                          className="text-[11px] text-primary hover:underline font-bold flex items-center gap-0.5 pt-0.5 cursor-pointer"
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

                      {/* Performance Metric Bar */}
                      <div className="pt-2 flex items-center justify-between gap-2 border-t border-border/50 flex-wrap">
                        {/* Metric Badges */}
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-blue-500/15 text-blue-700 dark:text-blue-300 font-black text-xs">
                            <Eye className="w-3 h-3" />
                            <span>{post.views.toLocaleString()}</span>
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-xl bg-muted text-muted-foreground font-bold text-xs">
                            <Heart className="w-3 h-3 text-rose-500" />
                            <span>{post.likes}</span>
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-xl bg-muted text-muted-foreground font-bold text-xs">
                            <MessageCircle className="w-3 h-3 text-sky-500" />
                            <span>{post.replies}</span>
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-xl bg-muted text-muted-foreground font-bold text-xs">
                            <Repeat className="w-3 h-3 text-emerald-500" />
                            <span>{post.reposts}</span>
                          </span>
                        </div>

                        {/* Open in Threads Link */}
                        {post.permalink && (
                          <a
                            href={post.permalink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline ml-auto"
                          >
                            <span>Threadsで開く</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>

                      {/* View-Share Progress Line */}
                      {maxViews > 0 && (
                        <div className="w-full h-1 rounded-full bg-muted/60 overflow-hidden mt-1">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${relativeWidth}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB CONTENT: 2. QUEUE VIEW ── */}
      {activeTab === "queue" && (
        <div className="p-4 sm:p-6 rounded-3xl bg-card border border-border shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-500" />
              <h3 className="font-bold text-sm text-foreground">
                2週間自動投稿スケジュール（進捗モニター）
              </h3>
            </div>
            <button
              onClick={handleProcessQueueNow}
              disabled={processingQueue || data.queueSummary.pendingCount === 0}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 text-amber-950 hover:bg-amber-400 transition disabled:opacity-40 shadow-xs cursor-pointer min-h-[38px]"
            >
              <Send className={`w-3.5 h-3.5 ${processingQueue ? "animate-spin" : ""}`} />
              <span>{processingQueue ? "配信処理中..." : "待機キューを今すぐ手動送信"}</span>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2.5 rounded-xl bg-muted/60 border border-border">
              <div className="text-[10px] text-muted-foreground font-semibold">公開完了</div>
              <div className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                {data.queueSummary.publishedCount}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-muted/60 border border-border">
              <div className="text-[10px] text-muted-foreground font-semibold">予約待機中</div>
              <div className="text-base sm:text-lg font-black text-amber-600 dark:text-amber-400 mt-0.5">
                {data.queueSummary.pendingCount}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-muted/60 border border-border">
              <div className="text-[10px] text-muted-foreground font-semibold">スキップ</div>
              <div className="text-base sm:text-lg font-black text-muted-foreground mt-0.5">
                {data.queueSummary.skippedCount}
              </div>
            </div>
          </div>

          {data.queueSummary.nextScheduledPost ? (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-amber-700 dark:text-amber-300">
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
              <p className="text-xs text-foreground/90 font-medium whitespace-pre-wrap leading-relaxed bg-card/60 p-3 rounded-xl border border-amber-500/15">
                {data.queueSummary.nextScheduledPost.text}
              </p>
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-muted-foreground bg-muted/30 rounded-2xl">
              待機中の予約キューはありません。すべての予約投稿が配信完了しました。
            </div>
          )}
        </div>
      )}

      {/* ── TAB CONTENT: 3. INSIGHTS VIEW ── */}
      {activeTab === "insights" && (
        <div className="p-4 sm:p-6 rounded-3xl bg-card border border-border shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              日別インプレッション推移（Meta API）
            </h3>
            <span className="text-[10px] text-muted-foreground">集計データ</span>
          </div>

          {data.accountInsights.viewsDaily.length > 0 ? (
            <div className="space-y-3 pt-2">
              {data.accountInsights.viewsDaily.map((item) => {
                const maxDay = Math.max(...data.accountInsights.viewsDaily.map((d) => d.value), 1);
                const percent = Math.min(100, Math.round((item.value / maxDay) * 100));
                return (
                  <div key={item.date} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground">{item.date}</span>
                      <span className="font-bold text-primary">{item.value.toLocaleString()} views</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
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
            <div className="py-12 text-center text-xs text-muted-foreground">
              日別データ集計中（Meta Graph APIのデイリー集計同期をお待ちください）
            </div>
          )}
        </div>
      )}
    </div>
  );
}
