"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Users,
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
  Gift,
  ExternalLink,
  Globe,
  BookOpen,
  LayoutDashboard,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { isAdminEmail } from "@/lib/auth/admin-checker";
import { AdminCustomerResponse, CustomerSummary } from "@/app/api/admin/customers/route";
import { IPComplianceSection } from "@/components/features/settings/IPComplianceSection";
import { CustomerUsageModal } from "@/components/features/admin/CustomerUsageModal";
import { ManagementDashboardSection } from "@/components/features/admin/ManagementDashboardSection";

type AdminTab = "customers" | "compliance" | "management";
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
  const [activeTab, setActiveTab] = useState<AdminTab>("customers");
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
  const [mobileViewMode, setMobileViewMode] = useState<"card" | "table">("card");
  const [selectedCustomerForGraph, setSelectedCustomerForGraph] = useState<CustomerSummary | null>(null);

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

        let userEmail = session?.user?.email;
        const accessToken = session?.access_token;

        if (!userEmail) {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          userEmail = user?.email;
        }

        if (userEmail && isAdminEmail(userEmail)) {
          if (mounted) {
            setIsAuthorized(true);
            setAdminEmail(userEmail);
            setAuthChecking(false);
            fetchCustomers(accessToken);
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

      const res = await fetch(`/api/admin/customers?t=${Date.now()}`, {
        headers,
        cache: "no-store",
      });

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

  // Plan counts for explicit KPI breakdown
  const planCounts = useMemo(() => {
    const list = data?.customers || [];
    return {
      all: list.length,
      pro: list.filter((c) => c.plan === "pro").length,
      base: list.filter((c) => c.plan === "base").length,
      free: list.filter((c) => c.plan === "free").length,
    };
  }, [data?.customers]);

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
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-sm shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm sm:text-lg tracking-tight truncate">
                    管理者専用ダッシュボード
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-primary/10 text-primary border border-primary/20 tracking-wide uppercase shrink-0">
                    Admin
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground hidden sm:block truncate">
                  顧客管理 & 知財コンプライアンス監査
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="hidden sm:flex items-center gap-1.5 sm:gap-2">
              <Link
                href="/compare/shadoten"
                target="_blank"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition"
                title="競合比較LP（静的生成）を確認"
              >
                <Globe className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">他社</span>比較LP
                <ExternalLink className="w-3 h-3 opacity-60" />
              </Link>
              <Link
                href="/blog"
                target="_blank"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition"
                title="公式ノウハウブログを確認"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>公式ブログ</span>
                <ExternalLink className="w-3 h-3 opacity-60" />
              </Link>
            </div>

            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted text-xs text-muted-foreground">
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

            {activeTab === "customers" && (
              <button
                onClick={handleExportCSV}
                disabled={!filteredCustomers.length}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition shadow-sm disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV出力</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Navigation Tabs: 顧客管理 vs コンプライアンス監査ログ */}
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <button
            onClick={() => setActiveTab("customers")}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition shadow-xs ${
              activeTab === "customers"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>顧客管理</span>
            {data?.kpi && (
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold ${
                  activeTab === "customers"
                    ? "bg-white/20 text-white"
                    : "bg-background text-foreground border border-border"
                }`}
              >
                {data.kpi.totalCustomers}名
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("compliance")}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition shadow-xs ${
              activeTab === "compliance"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>コンプライアンス監査ログ</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold ${
                activeTab === "compliance"
                  ? "bg-white/20 text-white"
                  : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
              }`}
            >
              安全 (PASS)
            </span>
          </button>

          <button
            onClick={() => setActiveTab("management")}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition shadow-xs ${
              activeTab === "management"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>統括ダッシュボード</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold ${
                activeTab === "management"
                  ? "bg-white/20 text-white"
                  : "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20"
              }`}
            >
              進捗・仕様
            </span>
          </button>
        </div>

        {activeTab === "customers" ? (
          <>
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-amber-500/5 to-emerald-500/10 border border-primary/20 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-primary/20 text-primary flex items-center justify-center font-bold shrink-0">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs sm:text-sm font-bold text-foreground">
                    広報・SEOマーケティング管理 Hub
                  </h2>
                  <p className="text-[11px] text-muted-foreground hidden sm:block">
                    本番公開済みの静的SEO比較LP・公式ブログへのアクセス導線
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
                <Link
                  href="/diagnosis"
                  target="_blank"
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-500/30 hover:bg-rose-500/25 transition"
                >
                  <Flame className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">30秒TOEIC診断 (/diagnosis)</span>
                  <ExternalLink className="w-3 h-3 opacity-70 shrink-0" />
                </Link>

                <Link
                  href="/waitlist"
                  target="_blank"
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-purple-500/15 text-purple-600 dark:text-purple-300 border border-purple-500/30 hover:bg-purple-500/25 transition"
                >
                  <Crown className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">紹介＆VIP登録LP (/waitlist)</span>
                  <ExternalLink className="w-3 h-3 opacity-70 shrink-0" />
                </Link>

                <Link
                  href="/compare/shadoten"
                  target="_blank"
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition"
                >
                  <Globe className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">他社比較LP</span>
                  <ExternalLink className="w-3 h-3 opacity-70 shrink-0" />
                </Link>

                <Link
                  href="/blog"
                  target="_blank"
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/25 transition"
                >
                  <BookOpen className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">公式ブログ一覧</span>
                  <ExternalLink className="w-3 h-3 opacity-70 shrink-0" />
                </Link>

                <Link
                  href="/blog/why-i-built-shadowlog"
                  target="_blank"
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 transition"
                >
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">最新記事：開発秘話</span>
                  <ExternalLink className="w-3 h-3 opacity-70 shrink-0" />
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              {/* Card 1: Total Users */}
              <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border shadow-xs flex flex-col justify-between h-full min-h-[120px]">
                <div className="flex items-center justify-between text-muted-foreground mb-2">
                  <span className="text-xs font-bold text-foreground">総登録者数</span>
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                    {data?.kpi.totalCustomers ?? 0}
                    <span className="text-sm font-normal text-muted-foreground ml-1">人</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-1.5 flex-wrap">
                    <span className="text-amber-600 dark:text-amber-400 font-bold">Pro:{planCounts.pro}</span>
                    <span className="opacity-40">/</span>
                    <span className="text-blue-600 dark:text-blue-400 font-bold">Base:{planCounts.base}</span>
                    <span className="opacity-40">/</span>
                    <span className="text-muted-foreground">Free:{planCounts.free}</span>
                  </p>
                </div>
              </div>

              {/* Card 2: Pro Plan Users */}
              <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/5 border border-amber-500/30 shadow-xs flex flex-col justify-between h-full min-h-[120px]">
                <div className="flex items-center justify-between text-muted-foreground mb-2">
                  <span className="text-xs font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1">
                    <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    Proプラン
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Crown className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-amber-700 dark:text-amber-300 tracking-tight">
                    {planCounts.pro}
                    <span className="text-sm font-normal text-muted-foreground ml-1">人</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1 truncate">先行VIP & Proテスター</p>
                </div>
              </div>

              {/* Card 3: Basic (Base) Plan Users */}
              <div className="p-4 sm:p-5 rounded-2xl bg-blue-500/5 border border-blue-500/30 shadow-xs flex flex-col justify-between h-full min-h-[120px]">
                <div className="flex items-center justify-between text-muted-foreground mb-2">
                  <span className="text-xs font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    ベーシックプラン
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-blue-700 dark:text-blue-300 tracking-tight">
                    {planCounts.base}
                    <span className="text-sm font-normal text-muted-foreground ml-1">人</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1 truncate">Base プラン契約者</p>
                </div>
              </div>

              {/* Card 4: Free Users */}
              <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border shadow-xs flex flex-col justify-between h-full min-h-[120px]">
                <div className="flex items-center justify-between text-muted-foreground mb-2">
                  <span className="text-xs font-medium">無料体験 (Free)</span>
                  <div className="w-8 h-8 rounded-xl bg-muted text-muted-foreground flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                    {planCounts.free}
                    <span className="text-sm font-normal text-muted-foreground ml-1">人</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1 truncate">フリー枠利用中</p>
                </div>
              </div>

              {/* Card 5: Waitlist Pre-subscribers */}
              <div className="p-4 sm:p-5 rounded-2xl bg-card border border-purple-500/20 shadow-xs flex flex-col justify-between h-full min-h-[120px] col-span-2 sm:col-span-1">
                <div className="flex items-center justify-between text-muted-foreground mb-2">
                  <span className="text-xs font-medium text-purple-600 dark:text-purple-400">事前登録 (Waitlist)</span>
                  <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                    <Gift className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                    {data?.kpi.waitlistCount ?? 0}
                    <span className="text-sm font-normal text-muted-foreground ml-1">人</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1 truncate">11月ローンチ向けリード</p>
                </div>
              </div>
            </div>

            {/* Cost & Usage Monitoring KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              {/* Card 6: Overall Daily Average */}
              <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border shadow-xs flex flex-col justify-between h-full min-h-[110px]">
                <div className="flex items-center justify-between text-muted-foreground mb-2">
                  <span className="text-xs font-medium">平均利用頻度</span>
                  <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                    {data?.kpi.overallDailyAverage ?? 0}
                    <span className="text-sm font-normal text-muted-foreground ml-1">回 / 日</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1 truncate">全アクティブユーザー平均</p>
                </div>
              </div>

              {/* Card 7: Top User Daily Practice */}
              <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border shadow-xs flex flex-col justify-between h-full min-h-[110px]">
                <div className="flex items-center justify-between text-muted-foreground mb-2">
                  <span className="text-xs font-medium">最高負荷ユーザー</span>
                  <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                    <Flame className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                    {data?.kpi.topUserDailyCount ?? 0}
                    <span className="text-sm font-normal text-muted-foreground ml-1">回 / 日</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1 truncate">最大利用者のペース</p>
                </div>
              </div>

              {/* Card 8: Warning Account Count */}
              <div
                className={`p-4 sm:p-5 rounded-2xl border shadow-xs flex flex-col justify-between h-full min-h-[110px] transition ${
                  (data?.kpi.warningAccountCount ?? 0) > 0
                    ? "bg-rose-500/5 border-rose-500/30"
                    : "bg-card border-border"
                }`}
              >
                <div className="flex items-center justify-between text-muted-foreground mb-2">
                  <span className="text-xs font-medium">採算リスク警戒数</span>
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
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
                  <p className="text-[11px] text-muted-foreground mt-1 truncate">損益分岐接近（Base&gt;25回, Pro&gt;73回）</p>
                </div>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-card border border-border shadow-xs flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
              {/* Search Box */}
              <div className="relative flex-1 min-w-[240px]">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="メールアドレス、ユーザーIDで絞り込み..."
                  className="w-full pl-10 pr-4 py-2 text-sm rounded-xl bg-muted/60 border border-border focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                />
              </div>

              {/* Controls: Plan Filter Tabs & Sort Dropdown */}
              <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2.5">
                {/* Plan Tabs */}
                <div className="flex items-center gap-1 p-1 bg-muted rounded-xl overflow-x-auto">
                  {(
                    [
                      { id: "all", label: "全て", count: planCounts.all },
                      { id: "pro", label: "Pro", count: planCounts.pro },
                      { id: "base", label: "ベーシック", count: planCounts.base },
                      { id: "free", label: "Free", count: planCounts.free },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setPlanFilter(tab.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                        planFilter === tab.id
                          ? "bg-background text-foreground shadow-xs font-semibold"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                          planFilter === tab.id
                            ? "bg-primary/10 text-primary font-bold"
                            : "bg-muted-foreground/15 text-muted-foreground"
                        }`}
                      >
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Sort Dropdown */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground hidden xl:inline">並び替え:</span>
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
            </div>

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
              <div className="px-4 sm:px-5 py-3.5 border-b border-border flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-sm text-foreground">登録顧客一覧</h2>
                  <span className="text-xs text-muted-foreground">
                ({filteredCustomers.length}件 / 全{data?.customers.length ?? 0}件)
              </span>
            </div>

            {/* Mobile View Switcher: Card vs Table */}
            <div className="flex items-center gap-1 p-1 bg-muted rounded-xl text-xs sm:hidden">
              <button
                onClick={() => setMobileViewMode("card")}
                className={`px-3 py-1 rounded-lg font-medium transition ${
                  mobileViewMode === "card"
                    ? "bg-background text-foreground shadow-xs font-bold"
                    : "text-muted-foreground"
                }`}
              >
                カード表示
              </button>
              <button
                onClick={() => setMobileViewMode("table")}
                className={`px-3 py-1 rounded-lg font-medium transition ${
                  mobileViewMode === "table"
                    ? "bg-background text-foreground shadow-xs font-bold"
                    : "text-muted-foreground"
                }`}
              >
                表（テーブル）
              </button>
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
            <>
              {/* Mobile Card List (Touch-friendly responsive layout) */}
              <div
                className={`${
                  mobileViewMode === "card" ? "block sm:hidden" : "hidden"
                } p-3 space-y-3 bg-muted/20`}
              >
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
                    <div
                      key={customer.id}
                      className="p-4 rounded-xl bg-card border border-border shadow-xs space-y-3"
                    >
                      {/* Card Header: Email & Plan Badge */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-sm text-foreground break-all">
                              {customer.email}
                            </span>
                            <button
                              onClick={() => handleCopy(customer.email, "email")}
                              className="p-1 rounded text-muted-foreground hover:text-foreground"
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
                            className="text-[10px] font-mono text-muted-foreground cursor-pointer hover:text-foreground flex items-center gap-1 mt-0.5"
                          >
                            ID: {customer.id.slice(0, 16)}...
                            {isIdCopied && (
                              <span className="text-emerald-500 font-sans">コピー完了</span>
                            )}
                          </span>
                        </div>

                        <div className="shrink-0">
                          {customer.vip_type === "campaign" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                              <Crown className="w-3 h-3 text-amber-500" />
                              VIP (10/30迄)
                            </span>
                          ) : customer.vip_type === "whitelist" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                              <Crown className="w-3 h-3 text-purple-500" />
                              VIP (テスター)
                            </span>
                          ) : customer.plan === "pro" ? (
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
                        </div>
                      </div>

                      {/* 2x2 Stats Grid (All 4 cards share uniform style and heights) */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {/* 1. Today / Daily Average */}
                        <button
                          type="button"
                          onClick={() => setSelectedCustomerForGraph(customer)}
                          className="text-left p-2.5 rounded-xl bg-background/80 border border-border/60 hover:border-blue-500/40 hover:bg-blue-500/5 transition group cursor-pointer flex flex-col justify-between"
                          title="クリックして日別利用推移（折れ線グラフ）を表示"
                        >
                          <span className="text-[10px] text-muted-foreground flex items-center justify-between">
                            本日 / 1日平均
                            <TrendingUp className="w-3 h-3 text-blue-600 dark:text-blue-400 opacity-60 group-hover:opacity-100 transition" />
                          </span>
                          <span className="font-bold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition block mt-1">
                            {customer.today_practice_count}回 / {customer.daily_average_practice}回
                          </span>
                        </button>

                        {/* 2. Cumulative Practice / Tickets */}
                        <button
                          type="button"
                          onClick={() => setSelectedCustomerForGraph(customer)}
                          className="text-left p-2.5 rounded-xl bg-background/80 border border-border/60 hover:border-blue-500/40 hover:bg-blue-500/5 transition group cursor-pointer flex flex-col justify-between"
                          title="クリックして日別利用推移（折れ線グラフ）を表示"
                        >
                          <span className="text-[10px] text-muted-foreground flex items-center justify-between">
                            累計 / チケット
                            <TrendingUp className="w-3 h-3 text-blue-600 dark:text-blue-400 opacity-60 group-hover:opacity-100 transition" />
                          </span>
                          <span className="font-bold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition block mt-1">
                            {customer.practice_count}回 ({customer.tickets_used}枚)
                          </span>
                        </button>

                        {/* 3. Monthly Projected Cost */}
                        <div className="p-2.5 rounded-xl bg-background/80 border border-border/60 flex flex-col justify-between">
                          <span className="text-[10px] text-muted-foreground block">月間想定原価</span>
                          <span className="font-bold text-foreground font-mono mt-1">
                            約¥{customer.projected_monthly_cost.toLocaleString()}
                          </span>
                        </div>

                        {/* 4. Profitability Risk Status */}
                        <div className="p-2.5 rounded-xl bg-background/80 border border-border/60 flex flex-col justify-between">
                          <span className="text-[10px] text-muted-foreground block">採算リスク</span>
                          <div className="mt-1">
                            {customer.cost_risk_status === "danger" ? (
                              <span className="text-rose-600 dark:text-rose-400 font-bold text-xs flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping shrink-0" />
                                赤字警戒 ({loadPercent}%)
                              </span>
                            ) : customer.cost_risk_status === "warning" ? (
                              <span className="text-amber-600 dark:text-amber-400 font-bold text-xs flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                                注意 ({loadPercent}%)
                              </span>
                            ) : customer.cost_risk_status === "safe" ? (
                              <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                安全 ({marginPercent}%)
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-xs">無料体験</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Card Footer */}
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1.5 border-t border-border/50">
                        <span className="truncate mr-2">
                          最新: {customer.last_practiced_at ? formatDate(customer.last_practiced_at) : "未練習"}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => setSelectedCustomerForGraph(customer)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/20 transition cursor-pointer"
                            title="日別利用推移（折れ線グラフ）を表示"
                          >
                            <TrendingUp className="w-3.5 h-3.5" />
                            <span>グラフ</span>
                          </button>
                          <a
                            href={`mailto:${customer.email}?subject=【ShadowLogサポート】`}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-muted hover:bg-muted/80 text-foreground transition"
                          >
                            <Mail className="w-3.5 h-3.5" />
                            <span>連絡</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Table View (Desktop default, with full mobile horizontal sliding support) */}
              <div
                className={`w-full overflow-x-auto overscroll-x-contain ${
                  mobileViewMode === "card" ? "hidden sm:block" : "block"
                }`}
                style={{ WebkitOverflowScrolling: "touch" }}
              >
                {/* Mobile scroll hint */}
                <div className="sm:hidden px-4 py-2 bg-blue-500/10 text-blue-700 dark:text-blue-300 text-xs flex items-center justify-between border-b border-blue-500/20">
                  <span className="flex items-center gap-1.5 font-medium">
                    <span>👉</span> 表を左右にスワイプして全項目を確認できます
                  </span>
                  <span className="text-[10px] font-mono opacity-80">(全7列)</span>
                </div>

                <table className="min-w-[960px] w-full text-left text-sm table-fixed">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      <th className="py-3 px-4 sm:px-6 w-[230px]">顧客情報</th>
                      <th className="py-3 px-4 w-[130px]">プラン</th>
                      <th className="py-3 px-4 w-[170px]">利用回数 (本日/平均)</th>
                      <th className="py-3 px-4 w-[210px]">採算限界 & リスク診断</th>
                      <th className="py-3 px-4 w-[160px]">累計練習 / チケット</th>
                      <th className="py-3 px-4 w-[130px]">最新練習日時</th>
                      <th className="py-3 px-4 w-[130px] text-right">アクション</th>
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
                          {/* 1. Email & ID */}
                          <td className="py-3.5 px-4 sm:px-6 align-middle">
                            <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className="font-semibold text-foreground truncate max-w-[170px]"
                                  title={customer.email}
                                >
                                  {customer.email}
                                </span>
                                <button
                                  onClick={() => handleCopy(customer.email, "email")}
                                  className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition shrink-0"
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

                          {/* 2. Plan Badge */}
                          <td className="py-3.5 px-4 align-middle">
                            {customer.vip_type === "campaign" ? (
                              <span
                                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                                title="10/20まで登録特典：10/30までVIP利用可能"
                              >
                                <Crown className="w-3 h-3 text-amber-500" />
                                VIP (10/30迄)
                              </span>
                            ) : customer.vip_type === "whitelist" ? (
                              <span
                                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30"
                                title="永続VIPテスター"
                              >
                                <Crown className="w-3 h-3 text-purple-500" />
                                VIP (テスター)
                              </span>
                            ) : customer.plan === "pro" ? (
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

                          {/* 3. Usage Counts: Today & Daily Average */}
                          <td className="py-3.5 px-4 align-middle">
                            <button
                              type="button"
                              onClick={() => setSelectedCustomerForGraph(customer)}
                              className="flex flex-col text-xs space-y-0.5 p-2 rounded-xl hover:bg-blue-500/10 hover:border-blue-500/30 border border-transparent transition text-left group cursor-pointer w-full"
                              title="クリックして日別利用回数の推移（折れ線グラフ）を表示"
                            >
                              <div className="flex items-center gap-1.5">
                                <span className="text-muted-foreground text-[11px]">本日:</span>
                                <span
                                  className={`font-bold px-1.5 py-0.5 rounded-md ${
                                    customer.today_practice_count > 0
                                      ? "bg-primary/10 text-primary"
                                      : "text-muted-foreground"
                                  }`}
                                >
                                  {customer.today_practice_count} 回
                                </span>
                                <span className="inline-flex items-center gap-0.5 text-[10px] text-blue-600 dark:text-blue-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
                                  <TrendingUp className="w-3 h-3" />
                                  グラフ
                                </span>
                              </div>
                              <div className="text-[11px] text-muted-foreground truncate">
                                1日平均: <strong className="text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">{customer.daily_average_practice}</strong> 回/日
                                <span className="text-[10px] text-muted-foreground/70 ml-1">
                                  ({customer.active_days}日)
                                </span>
                              </div>
                            </button>
                          </td>

                          {/* 4. Breakeven Limit & Risk Diagnosis */}
                          <td className="py-3.5 px-4 align-middle">
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

                              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground truncate">
                                <span>
                                  原価: <strong className="text-foreground">¥{customer.projected_monthly_cost.toLocaleString()}</strong>/月
                                </span>
                                {customer.breakeven_daily_limit > 0 ? (
                                  <span className="text-[10px] text-muted-foreground/80">
                                    (限:{customer.breakeven_daily_limit}回)
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-muted-foreground/80">(体験枠)</span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* 5. Cumulative Practice & Tickets */}
                          <td className="py-3.5 px-4 align-middle">
                            <button
                              type="button"
                              onClick={() => setSelectedCustomerForGraph(customer)}
                              className="flex flex-col text-xs space-y-0.5 p-2 rounded-xl hover:bg-blue-500/10 hover:border-blue-500/30 border border-transparent transition text-left group cursor-pointer w-full"
                              title="クリックして日別利用回数の推移（折れ線グラフ）を表示"
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-semibold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                                  累計 {customer.practice_count} 回
                                </span>
                                <TrendingUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 opacity-60 group-hover:opacity-100 transition shrink-0" />
                              </div>
                              <span className="text-[11px] text-muted-foreground truncate">
                                {customer.tickets_used} 枚消化
                                {customer.pro_trials_used > 0 && (
                                  <span className="text-amber-600 dark:text-amber-400 ml-1">
                                    (Pro:{customer.pro_trials_used})
                                  </span>
                                )}
                              </span>
                            </button>
                          </td>

                          {/* 6. Last Practiced / Registration */}
                          <td className="py-3.5 px-4 text-xs whitespace-nowrap align-middle">
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

                          {/* 7. Actions */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap align-middle">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setSelectedCustomerForGraph(customer)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 border border-transparent hover:border-blue-500/20 transition cursor-pointer"
                                title="日別利用推移（折れ線グラフ）を表示"
                              >
                                <TrendingUp className="w-3.5 h-3.5" />
                                <span>グラフ</span>
                              </button>
                              <a
                                href={`mailto:${customer.email}?subject=【ShadowLogサポート】`}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition"
                                title="メールを送信"
                              >
                                <Mail className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">連絡</span>
                              </a>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
            </div>
          </>
        ) : activeTab === "compliance" ? (
          <div className="space-y-6">
            <IPComplianceSection />
          </div>
        ) : (
          <div className="space-y-6">
            <ManagementDashboardSection />
          </div>
        )}
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

      {/* Customer Daily Usage Line Chart Modal */}
      <CustomerUsageModal
        isOpen={selectedCustomerForGraph !== null}
        onClose={() => setSelectedCustomerForGraph(null)}
        customer={selectedCustomerForGraph}
      />
    </div>
  );
}
