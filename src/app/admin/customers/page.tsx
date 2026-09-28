"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Users,
  UserPlus,
  Activity,
  Crown,
  Search,
  Download,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  ArrowLeft,
  Mail,
  Check,
  Copy,
  Sparkles,
  TrendingUp,
  Flame,
  AlertTriangle,
  ArrowUp,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { isAdminEmail } from "@/lib/auth/admin-checker";
import { AdminCustomerResponse } from "@/app/api/admin/customers/route";

type PlanFilter = "all" | "free" | "base" | "pro";
type SortOption =
  | "newest"
  | "oldest"
  | "practice_desc"
  | "daily_desc"
  | "risk_desc"
  | "cost_desc"
  | "last_active";

export default function AdminCustomersPage() {
  const [loading, setLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [adminEmail, setAdminEmail] = useState<string | null>(null);

  const [data, setData] = useState<AdminCustomerResponse | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [planFilter, setPlanFilter] = useState<PlanFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Monitor scroll for top-return button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 150);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 1. Check Authentication on Mount
  useEffect(() => {
    let mounted = true;

    async function checkAdminAuth() {
      try {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const userEmail = session?.user?.email;

        if (userEmail && isAdminEmail(userEmail)) {
          if (mounted) {
            setIsAuthorized(true);
            setAdminEmail(userEmail);
            setAuthChecking(false);
            fetchCustomers(session.access_token);
          }
        } else {
          if (mounted) {
            setIsAuthorized(false);
            setAuthChecking(false);
          }
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        if (mounted) {
          setIsAuthorized(false);
          setAuthChecking(false);
        }
      }
    }

    checkAdminAuth();

    return () => {
      mounted = false;
    };
  }, []);

  // 2. Fetch Customer Data
  async function fetchCustomers(token?: string) {
    setLoading(true);
    setErrorMessage(null);

    try {
      let authToken = token;
      if (!authToken) {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        authToken = session?.access_token;
      }

      const headers: Record<string, string> = {};
      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }

      const res = await fetch("/api/admin/customers", { headers });

      if (!res.ok) {
        if (res.status === 403) {
          setIsAuthorized(false);
          throw new Error("管理者権限がありません (403 Forbidden)");
        }
        throw new Error(`データ取得に失敗しました (Status: ${res.status})`);
      }

      const resData: AdminCustomerResponse = await res.json();
      setData(resData);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "予期せぬエラーが発生しました";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  }

  // 3. Filter & Sort Logic
  const filteredCustomers = useMemo(() => {
    if (!data?.customers) return [];

    let list = data.customers;

    // Search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.email.toLowerCase().includes(query) ||
          c.id.toLowerCase().includes(query)
      );
    }

    // Plan filter
    if (planFilter !== "all") {
      list = list.filter((c) => c.plan === planFilter);
    }

    // Sorting
    return [...list].sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === "oldest") {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      if (sortBy === "practice_desc") {
        return b.practice_count - a.practice_count;
      }
      if (sortBy === "daily_desc") {
        return b.daily_average_practice - a.daily_average_practice;
      }
      if (sortBy === "cost_desc") {
        return b.projected_monthly_cost - a.projected_monthly_cost;
      }
      if (sortBy === "risk_desc") {
        const riskWeight: Record<string, number> = { danger: 4, warning: 3, safe: 2, free: 1 };
        return (riskWeight[b.cost_risk_status] || 0) - (riskWeight[a.cost_risk_status] || 0);
      }
      if (sortBy === "last_active") {
        const timeA = a.last_practiced_at ? new Date(a.last_practiced_at).getTime() : 0;
        const timeB = b.last_practiced_at ? new Date(b.last_practiced_at).getTime() : 0;
        return timeB - timeA;
      }
      return 0;
    });
  }, [data?.customers, searchQuery, planFilter, sortBy]);

  // 4. Copy to Clipboard Helper
  const handleCopy = (text: string, type: "id" | "email") => {
    navigator.clipboard.writeText(text);
    if (type === "id") {
      setCopiedId(text);
      setTimeout(() => setCopiedId(null), 2000);
    } else {
      setCopiedEmail(text);
      setTimeout(() => setCopiedEmail(null), 2000);
    }
  };

  // 5. CSV Export Helper (UTF-8 with BOM for Excel compatibility)
  const handleExportCSV = () => {
    if (!data?.customers || data.customers.length === 0) return;

    const headers = [
      "ユーザーID",
      "メールアドレス",
      "プラン",
      "登録日時",
      "本日の利用数",
      "1日平均練習数",
      "アクティブ日数",
      "月間想定練習数",
      "月間想定原価(円)",
      "損益分岐限界(回/日)",
      "採算リスク",
      "累計練習セッション数",
      "チケット消化数",
      "Pro味見枠消化数",
      "最終練習日時",
    ];

    const riskLabelMap: Record<string, string> = {
      safe: "安全",
      warning: "注意",
      danger: "赤字警戒",
      free: "無料体験",
    };

    const rows = filteredCustomers.map((c) => [
      `"${c.id}"`,
      `"${c.email.replace(/"/g, '""')}"`,
      `"${c.plan}"`,
      `"${formatDate(c.created_at)}"`,
      c.today_practice_count,
      c.daily_average_practice,
      c.active_days,
      c.projected_monthly_practices,
      c.projected_monthly_cost,
      c.breakeven_daily_limit,
      `"${riskLabelMap[c.cost_risk_status] || c.cost_risk_status}"`,
      c.practice_count,
      c.tickets_used,
      c.pro_trials_used,
      `"${c.last_practiced_at ? formatDate(c.last_practiced_at) : "未練習"}"`,
    ]);

    const csvContent =
      "\uFEFF" + [headers.join(","), ...rows.map((e) => e.join(","))].join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;

    link.setAttribute("href", url);
    link.setAttribute("download", `shadowlog_customers_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Formatting date
  function formatDate(isoString: string): string {
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const h = String(d.getHours()).padStart(2, "0");
      const min = String(d.getMinutes()).padStart(2, "0");
      return `${y}/${m}/${day} ${h}:${min}`;
    } catch {
      return isoString;
    }
  }

  // 6. Access Denied / Auth Loading States
  if (authChecking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center animate-spin mb-4">
          <RefreshCw className="w-6 h-6" />
        </div>
        <p className="text-muted-foreground font-medium text-sm">
          管理者権限を確認しています...
        </p>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 text-center">
        <div className="w-16 h-16 rounded-3xl bg-rose-500/10 text-rose-500 flex items-center justify-center mb-5">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground mb-2">
          アクセス権限がありません
        </h1>
        <p className="text-muted-foreground text-sm max-w-md mb-6 leading-relaxed">
          このページは ShadowLog 管理者 (
          <code className="text-primary font-mono font-medium">shadowlog.app@gmail.com</code>
          ) のみアクセス可能です。
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-md hover:bg-primary/90 transition"
          >
            管理者アカウントでログイン
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-border text-foreground font-medium text-sm hover:bg-muted transition"
          >
            ダッシュボードへ戻る
          </Link>
        </div>
      </div>
    );
  }

  // 7. Admin Dashboard Render
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background shadow-xs">
        {/* iOS Status Bar Safe Area Spacer */}
        <div style={{ height: "env(safe-area-inset-top, 0px)" }} className="w-full bg-background" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition"
              title="メイン画面に戻る"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg tracking-tight">ShadowLog</span>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-primary/10 text-primary border border-primary/20 tracking-wide uppercase">
                    Admin
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground hidden sm:block">
                  顧客リスト & 進捗モニタリング
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted text-xs text-muted-foreground">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>{adminEmail}</span>
            </div>

            <button
              onClick={() => fetchCustomers()}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border border-border hover:bg-muted text-foreground transition disabled:opacity-50"
              title="データを再取得"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">更新</span>
            </button>

            <button
              onClick={handleExportCSV}
              disabled={!filteredCustomers.length}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition shadow-sm disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV出力</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* KPI Cards Section - Growth & Scale */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          {/* Card 1: Total Users */}
          <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs font-medium">総登録者数</span>
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                {data?.kpi.totalCustomers ?? 0}
                <span className="text-sm font-normal text-muted-foreground ml-1">人</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">全アカウント数</p>
            </div>
          </div>

          {/* Card 2: New Users This Week */}
          <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs font-medium">今週の新規登録</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <UserPlus className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                {data?.kpi.newCustomersThisWeek ?? 0}
                <span className="text-sm font-normal text-muted-foreground ml-1">人</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">直近7日間の獲得</p>
            </div>
          </div>

          {/* Card 3: Total Practice Sessions */}
          <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs font-medium">累計練習セッション</span>
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                {data?.kpi.totalPracticeSessions ?? 0}
                <span className="text-sm font-normal text-muted-foreground ml-1">回</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">全体スピーキング消化数</p>
            </div>
          </div>

          {/* Card 4: Paid / Pro Users */}
          <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs font-medium">有料 / Proテスター</span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Crown className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                {data?.kpi.paidOrProCount ?? 0}
                <span className="text-sm font-normal text-muted-foreground ml-1">人</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">Pro & Base ユーザー</p>
            </div>
          </div>
        </div>

        {/* Cost & Usage Monitoring KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-5">
          {/* Card 5: Overall Daily Average */}
          <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs font-medium">平均利用頻度</span>
              <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                {data?.kpi.overallDailyAverage ?? 0}
                <span className="text-sm font-normal text-muted-foreground ml-1">回 / 日</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">全アクティブユーザー平均</p>
            </div>
          </div>

          {/* Card 6: Top User Daily Practice */}
          <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs font-medium">最高負荷ユーザー</span>
              <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                <Flame className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                {data?.kpi.topUserDailyCount ?? 0}
                <span className="text-sm font-normal text-muted-foreground ml-1">回 / 日</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">最大利用者のペース</p>
            </div>
          </div>

          {/* Card 7: Warning Account Count */}
          <div
            className={`p-4 sm:p-5 rounded-2xl border shadow-xs flex flex-col justify-between transition ${
              (data?.kpi.warningAccountCount ?? 0) > 0
                ? "bg-rose-500/5 border-rose-500/30"
                : "bg-card border-border"
            }`}
          >
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs font-medium">採算リスク警戒数</span>
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  (data?.kpi.warningAccountCount ?? 0) > 0
                    ? "bg-rose-500/20 text-rose-600 dark:text-rose-400"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                <span
                  className={
                    (data?.kpi.warningAccountCount ?? 0) > 0
                      ? "text-rose-600 dark:text-rose-400"
                      : "text-foreground"
                  }
                >
                  {data?.kpi.warningAccountCount ?? 0}
                </span>
                <span className="text-sm font-normal text-muted-foreground ml-1">件</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">損益分岐接近（Base&gt;25回, Pro&gt;73回）</p>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="p-4 rounded-2xl bg-card border border-border shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="メールアドレス、ユーザーIDで絞り込み..."
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl bg-muted/60 border border-border focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
            />
          </div>

          {/* Plan Tabs */}
          <div className="flex items-center gap-1 p-1 bg-muted rounded-xl self-start md:self-auto overflow-x-auto max-w-full">
            {(
              [
                { id: "all", label: "全て" },
                { id: "free", label: "Free" },
                { id: "base", label: "Base" },
                { id: "pro", label: "Pro" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setPlanFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  planFilter === tab.id
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            <span className="text-xs text-muted-foreground hidden lg:inline">並び替え:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-3 py-1.5 rounded-xl text-xs font-medium bg-muted/60 border border-border text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20 transition cursor-pointer"
            >
              <option value="newest">登録が新しい順</option>
              <option value="oldest">登録が古い順</option>
              <option value="practice_desc">累計練習数が多い順</option>
              <option value="daily_desc">1日平均利用が多い順</option>
              <option value="risk_desc">採算リスクが高い順</option>
              <option value="cost_desc">月間想定原価が高い順</option>
              <option value="last_active">最近練習した順</option>
            </select>
          </div>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm flex items-center justify-between">
            <span>{errorMessage}</span>
            <button
              onClick={() => fetchCustomers()}
              className="text-xs font-semibold underline hover:no-underline"
            >
              再試行
            </button>
          </div>
        )}

        {/* Customer Table Section */}
        <div className="rounded-2xl bg-card border border-border shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-sm text-foreground">登録顧客一覧</h2>
              <span className="text-xs text-muted-foreground">
                ({filteredCustomers.length}件 / 全{data?.customers.length ?? 0}件)
              </span>
            </div>
          </div>

          {loading ? (
            <div className="py-20 text-center flex flex-col items-center justify-center">
              <RefreshCw className="w-8 h-8 text-primary animate-spin mb-3" />
              <p className="text-sm text-muted-foreground">顧客データを読み込み中...</p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium text-sm text-foreground">該当する顧客が見つかりません</p>
              <p className="text-xs mt-1">検索条件を変更するか、クリアしてください。</p>
            </div>
          ) : (
            <div className="overflow-x-auto touch-pan-y overscroll-x-contain">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <th className="py-3 px-4 sm:px-6">顧客情報</th>
                    <th className="py-3 px-4">プラン</th>
                    <th className="py-3 px-4">利用回数 (本日 / 平均)</th>
                    <th className="py-3 px-4">採算限界 & リスク診断</th>
                    <th className="py-3 px-4">累計練習 / チケット</th>
                    <th className="py-3 px-4">最新練習日時</th>
                    <th className="py-3 px-4 text-right">アクション</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredCustomers.map((customer) => {
                    const isCopied = copiedEmail === customer.email;
                    const isIdCopied = copiedId === customer.id;

                    const loadPercent =
                      customer.breakeven_daily_limit > 0
                        ? Math.round(
                            (customer.daily_average_practice / customer.breakeven_daily_limit) * 100
                          )
                        : 0;
                    const marginPercent = Math.max(0, 100 - loadPercent);

                    return (
                      <tr
                        key={customer.id}
                        className="hover:bg-muted/40 transition group"
                      >
                        {/* Email & ID */}
                        <td className="py-3.5 px-4 sm:px-6">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-foreground">
                                {customer.email}
                              </span>
                              <button
                                onClick={() => handleCopy(customer.email, "email")}
                                className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition"
                                title="メールアドレスをコピー"
                              >
                                {isCopied ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                            <span
                              onClick={() => handleCopy(customer.id, "id")}
                              className="text-[11px] font-mono text-muted-foreground/80 cursor-pointer hover:text-foreground transition flex items-center gap-1 mt-0.5"
                              title="ユーザーIDをコピー"
                            >
                              <span>ID: {customer.id.slice(0, 8)}...</span>
                              {isIdCopied && (
                                <span className="text-[10px] text-emerald-500 font-sans">
                                  コピー完了
                                </span>
                              )}
                            </span>
                          </div>
                        </td>

                        {/* Plan Badge */}
                        <td className="py-3.5 px-4">
                          {customer.plan === "pro" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                              <Crown className="w-3 h-3" />
                              Pro
                            </span>
                          ) : customer.plan === "base" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                              Base
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
                              Free
                            </span>
                          )}
                        </td>

                        {/* Usage Counts: Today & Daily Average */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col text-xs space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-muted-foreground">本日:</span>
                              <span
                                className={`font-bold px-1.5 py-0.5 rounded-md ${
                                  customer.today_practice_count > 0
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground"
                                }`}
                              >
                                {customer.today_practice_count} 回
                              </span>
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              1日平均: <strong className="text-foreground">{customer.daily_average_practice}</strong> 回/日
                              <span className="text-[10px] text-muted-foreground/70 ml-1">
                                ({customer.active_days}日稼働)
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Breakeven Limit & Risk Diagnosis */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col gap-1 text-xs">
                            {customer.cost_risk_status === "danger" ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 w-fit">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
                                赤字警戒 ({loadPercent}%)
                              </span>
                            ) : customer.cost_risk_status === "warning" ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 w-fit">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                注意 ({loadPercent}%)
                              </span>
                            ) : customer.cost_risk_status === "safe" ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 w-fit">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                安全 (余裕率 {marginPercent}%)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border w-fit">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                無料体験
                              </span>
                            )}

                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                              <span>
                                想定原価: <strong className="text-foreground">¥{customer.projected_monthly_cost.toLocaleString()}</strong>/月
                              </span>
                              {customer.breakeven_daily_limit > 0 ? (
                                <span className="text-[10px] text-muted-foreground/80">
                                  (限界: 1日{customer.breakeven_daily_limit}回)
                                </span>
                              ) : (
                                <span className="text-[10px] text-muted-foreground/80">(体験枠消化)</span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Cumulative Practice & Tickets */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col text-xs">
                            <span className="font-semibold text-foreground">
                              累計 {customer.practice_count} 回
                            </span>
                            <span className="text-[11px] text-muted-foreground mt-0.5">
                              {customer.tickets_used} 枚消化
                              {customer.pro_trials_used > 0 && (
                                <span className="text-amber-600 dark:text-amber-400 ml-1">
                                  (Pro: {customer.pro_trials_used}回)
                                </span>
                              )}
                            </span>
                          </div>
                        </td>

                        {/* Last Practiced / Registration */}
                        <td className="py-3.5 px-4 text-xs whitespace-nowrap">
                          <div className="flex flex-col">
                            {customer.last_practiced_at ? (
                              <span className="text-foreground font-medium">
                                {formatDate(customer.last_practiced_at)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground/60 italic">未練習</span>
                            )}
                            <span className="text-[10px] text-muted-foreground mt-0.5">
                              登録: {formatDate(customer.created_at)}
                            </span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <a
                            href={`mailto:${customer.email}?subject=【ShadowLogサポート】`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition"
                            title="メールを送信"
                          >
                            <Mail className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">連絡</span>
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Floating Scroll to Top Button for Mobile/Desktop */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 z-50 p-3 rounded-full bg-primary text-primary-foreground shadow-xl hover:bg-primary/90 active:scale-95 transition-all flex items-center gap-1.5 text-xs font-bold animate-in fade-in"
          title="一番上に戻る"
        >
          <ArrowUp className="w-4 h-4" />
          <span className="hidden sm:inline">トップへ</span>
        </button>
      )}
    </div>
  );
}
