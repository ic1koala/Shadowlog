"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DifficultyLevel, Industry, normalizeIndustry } from "@/types";
import { AssessmentResult } from "@/lib/assessment/assessment-engine";
import {
  Save,
  CheckCircle2,
  Briefcase,
  BarChart,
  Sparkles,
  Target,
  Calendar,
  ArrowRight,
  Mic,
  RotateCcw,
  Trash2,
  User,
  Mail,
  Lock,
  Loader2,
  ShieldCheck,
  AlertCircle,
  KeyRound,
  Megaphone,
  MessageSquare,
  BookOpen,
  Bell,
  Search,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  FileText,
  LogOut,
  LogIn,
  Shield,
  X,
  ExternalLink,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  getAuthenticatedUser,
  fetchUserNickname,
  updateUserNickname,
  getStoredNickname,
} from "@/lib/storage/sync-service";
import { getTicketStatus, TicketStatus } from "@/lib/storage/ticket-store";
import { FeedbackForm } from "@/components/features/settings/FeedbackForm";
import { PlanComparisonSection } from "@/components/features/settings/PlanComparisonSection";
import { AnnouncementHistorySection } from "@/components/features/announcements/AnnouncementHistorySection";
import { ReminderSettingsSection } from "@/components/features/settings/ReminderSettingsSection";
import { CustomWordsSection } from "@/components/features/settings/CustomWordsSection";
import { AppFeatureGuide } from "@/components/features/settings/AppFeatureGuide";
import { isAdminEmail } from "@/lib/auth/admin-checker";

export type SettingSectionKey =
  | "account"
  | "reminder"
  | "learning"
  | "assessment"
  | "mic"
  | "guide"
  | "announcements"
  | "community"
  | "legal"
  | "plans"
  | "feedback"
  | "reset";

export default function SettingsPage() {
  const router = useRouter();

  // Active sub-section state (null = main list view matching attached screenshot)
  const [activeSection, setActiveSection] = useState<SettingSectionKey | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [industry, setIndustry] = useState<Industry>("tech");
  const [level, setLevel] = useState<DifficultyLevel>("intermediate");
  const [isSaved, setIsSaved] = useState(false);
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | null>(null);
  const [assessmentDate, setAssessmentDate] = useState<string | null>(null);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedMicId, setSelectedMicId] = useState<string>("");

  // Account State
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isGoogleUser, setIsGoogleUser] = useState(false);
  const [nickname, setNickname] = useState("");
  const [isSavingNickname, setIsSavingNickname] = useState(false);
  const [nicknameSaved, setNicknameSaved] = useState(false);

  // Password Change State
  const [isPasswordSectionOpen, setIsPasswordSectionOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Plan State
  const [ticketStatus, setTicketStatus] = useState<TicketStatus | null>(null);

  // Read URL query parameter on mount if present (e.g., /settings?section=reminder)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const sectionParam = params.get("section") as SettingSectionKey | null;
      if (sectionParam) {
        setActiveSection(sectionParam);
      }
    }
  }, []);

  useEffect(() => {
    // Load audio devices
    if (typeof window !== "undefined" && navigator.mediaDevices?.enumerateDevices) {
      navigator.mediaDevices
        .enumerateDevices()
        .then((devices) => {
          setAudioDevices(devices.filter((d) => d.kind === "audioinput"));
        })
        .catch(() => {});
    }

    try {
      const savedMicId = localStorage.getItem("shadowlog_mic_device_id") || "";
      setSelectedMicId(savedMicId);
    } catch {}
  }, []);

  const handleMicChange = (deviceId: string) => {
    setSelectedMicId(deviceId);
    try {
      if (deviceId) {
        localStorage.setItem("shadowlog_mic_device_id", deviceId);
        const found = audioDevices.find((d) => d.deviceId === deviceId);
        if (found?.label) {
          localStorage.setItem("shadowlog_mic_device_label", found.label);
        }
      } else {
        localStorage.removeItem("shadowlog_mic_device_id");
        localStorage.removeItem("shadowlog_mic_device_label");
      }
    } catch {}
  };

  useEffect(() => {
    // 1. Load preferences
    try {
      const savedIndustry = localStorage.getItem("shadowlog_industry");
      const savedLevel = localStorage.getItem("shadowlog_level") as DifficultyLevel;
      if (savedIndustry) setIndustry(normalizeIndustry(savedIndustry));
      if (savedLevel) setLevel(savedLevel);

      const savedResult = localStorage.getItem("shadowlog_assessment_result");
      const savedDate = localStorage.getItem("shadowlog_assessment_date");
      if (savedResult) {
        setAssessmentResult(JSON.parse(savedResult) as AssessmentResult);
      }
      if (savedDate) {
        setAssessmentDate(savedDate);
      }
    } catch {}

    // 2. Load Nickname & Account info
    const cachedNick = getStoredNickname();
    if (cachedNick) setNickname(cachedNick);

    fetchUserNickname().then((name) => {
      if (name) setNickname(name);
    });

    getAuthenticatedUser().then((user) => {
      if (user) {
        setIsLoggedIn(true);
        setUserEmail(user.email || null);
        const provider = user.app_metadata?.provider;
        setIsGoogleUser(provider === "google");
      } else {
        setIsLoggedIn(false);
        setUserEmail(null);
      }
    });

    // 3. Ticket Status
    setTicketStatus(getTicketStatus());
    const handleTicketUpdate = () => {
      setTicketStatus(getTicketStatus());
    };
    window.addEventListener("shadowlog:ticket-update", handleTicketUpdate);
    return () => {
      window.removeEventListener("shadowlog:ticket-update", handleTicketUpdate);
    };
  }, []);

  const handleSaveLearning = () => {
    try {
      localStorage.setItem("shadowlog_industry", industry);
      localStorage.setItem("shadowlog_level", level);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch {}
  };

  const handleSaveNickname = async () => {
    setIsSavingNickname(true);
    setNicknameSaved(false);
    try {
      await updateUserNickname(nickname);
      setNicknameSaved(true);
      setTimeout(() => setNicknameSaved(false), 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingNickname(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (newPassword.length < 6) {
      setPasswordMessage({
        type: "error",
        text: "新しいパスワードは6文字以上で入力してください。",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({
        type: "error",
        text: "確認用パスワードが一致しません。",
      });
      return;
    }

    setIsSubmittingPassword(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setPasswordMessage({
        type: "success",
        text: "パスワードを正常に変更しました。",
      });
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        setIsPasswordSectionOpen(false);
        setPasswordMessage(null);
      }, 3000);
    } catch (err: unknown) {
      console.error(err);
      setPasswordMessage({
        type: "error",
        text: err instanceof Error ? err.message : "パスワードの変更に失敗しました。",
      });
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  const handleStartAssessment = () => {
    router.push("/settings/assessment");
  };

  const handleResetData = () => {
    if (
      window.confirm(
        "学習履歴、発話単語数、苦手単語帳の記録をリセットしますか？\nこの操作は取り消せません。"
      )
    ) {
      try {
        localStorage.removeItem("shadowlog_stats");
        localStorage.removeItem("shadowlog_sessions");
        localStorage.removeItem("shadowlog_words");
        localStorage.removeItem("shadowlog_weak_words");
        localStorage.removeItem("shadowlog_level");
        localStorage.removeItem("shadowlog_industry");
        localStorage.removeItem("shadowlog_assessment_result");
        localStorage.removeItem("shadowlog_assessment_date");

        fetch("/api/stats", { method: "DELETE" }).catch(() => {});

        alert("学習データをリセットしました。初期状態に戻ります。");
        window.location.reload();
      } catch {
        alert("リセットに失敗しました。");
      }
    }
  };

  const handleLogout = async () => {
    if (window.confirm("ログアウトしますか？")) {
      try {
        const supabase = createClient();
        await supabase.auth.signOut();
        setIsLoggedIn(false);
        setUserEmail(null);
        router.push("/login");
      } catch (err) {
        console.error("ログアウト処理エラー:", err);
      }
    }
  };

  const industries: Array<{ key: Industry; label: string; desc: string }> = [
    { key: "tech", label: "Tech (IT・開発)", desc: "クラウド、AI、アジャイル開発、API、障害対応など" },
    { key: "business", label: "Business (ビジネス・財務)", desc: "経営戦略、商談、四半期決算、投資、リスク管理など" },
    { key: "marketing", label: "Marketing (マーケ・企画)", desc: "ブランド戦略、デジタル広告、顧客維持、分析など" },
    { key: "daily", label: "Daily (日常・街中会話)", desc: "日常会話、旅行、食事、カジュアルな交流など" },
  ];

  const levels: Array<{ key: DifficultyLevel; label: string; words: string; desc: string }> = [
    {
      key: "beginner",
      label: "初級 (Beginner)",
      words: "6 〜 10語",
      desc: "基本語彙とシンプルな構文。基礎的なリズムを掴みたい方に最適です。",
    },
    {
      key: "intermediate",
      label: "中級 (Intermediate)",
      words: "12 〜 18語",
      desc: "複合文やビジネス表現。実務で通用する滑らかな発話を目指す方に最適です。",
    },
    {
      key: "advanced",
      label: "上級 (Advanced)",
      words: "20 〜 30語",
      desc: "長文・関係詞・高度な業界用語。プレゼンやハイレベルな議論向けです。",
    },
  ];

  // Definition of menu items matching the attached screenshot style
  interface MenuItem {
    id: SettingSectionKey;
    label: string;
    sublabel: string;
    icon: typeof User;
    group: "main" | "info" | "system";
    badge?: string;
    keywords: string[];
  }

  const menuItems: MenuItem[] = [
    {
      id: "account",
      label: "アカウント管理",
      sublabel: "メール・ニックネーム・パスワード変更",
      icon: User,
      group: "main",
      badge: isLoggedIn ? "登録済み" : "ゲスト",
      keywords: ["アカウント", "メール", "パスワード", "ニックネーム", "名前", "ログイン", "ユーザー"],
    },
    {
      id: "reminder",
      label: "通知",
      sublabel: "毎日の習慣化リマインド通知（複数設定可）",
      icon: Bell,
      group: "main",
      badge: "リマインド",
      keywords: ["通知", "リマインド", "プッシュ", "時間", "アラーム", "習慣化"],
    },
    {
      id: "learning",
      label: "学習設定",
      sublabel: "業種ドメイン・難易度・カスタムマイ単語",
      icon: Briefcase,
      group: "main",
      badge: industries.find((i) => i.key === industry)?.label.split(" ")[0] || industry,
      keywords: ["学習", "業種", "ドメイン", "難易度", "レベル", "マイ単語", "カスタム", "単語登録"],
    },
    {
      id: "assessment",
      label: "レベル判定",
      sublabel: "アダプティブ方式の英語力診断テスト",
      icon: Target,
      group: "main",
      badge: assessmentResult?.levelInfo?.labelShort || (assessmentResult ? "診断済" : undefined),
      keywords: ["レベル判定", "診断", "テスト", "実力", "アダプティブ", "WPM"],
    },
    {
      id: "mic",
      label: "マイク設定",
      sublabel: "録音用マイク・Bluetoothイヤホンの指定",
      icon: Mic,
      group: "main",
      badge: selectedMicId ? "指定中" : "既定",
      keywords: ["マイク", "録音", "Bluetooth", "イヤホン", "AirPods", "オーディオ"],
    },

    // Group 2: Info & Guides
    {
      id: "guide",
      label: "機能一覧ガイド（使い方）",
      sublabel: "全8機能の活用法・上達Tips",
      icon: HelpCircle,
      group: "info",
      badge: "全8機能",
      keywords: ["使い方", "ガイド", "ヘルプ", "機能", "シャドーイング", "音読録音", "フリップ", "カラオケ"],
    },
    {
      id: "announcements",
      label: "お知らせ",
      sublabel: "アプリアップデート・キャンペーン履歴",
      icon: Megaphone,
      group: "info",
      keywords: ["お知らせ", "アップデート", "キャンペーン", "履歴"],
    },
    {
      id: "community",
      label: "公式ブログ & Threads",
      sublabel: "最新ノウハウ・他社サービス比較",
      icon: BookOpen,
      group: "info",
      keywords: ["ブログ", "Threads", "SNS", "ノウハウ", "他社比較", "記事"],
    },
    {
      id: "legal",
      label: "利用規約・プライバシー",
      sublabel: "利用規約、プライバシーポリシー、特定商取引法",
      icon: FileText,
      group: "info",
      keywords: ["利用規約", "規約", "プライバシー", "ポリシー", "特商法", "特定商取引法"],
    },

    // Group 3: Plans & Support & Data
    {
      id: "plans",
      label: "料金プラン",
      sublabel: "Free / Base / Pro プラン案内・チケット",
      icon: Sparkles,
      group: "system",
      badge: ticketStatus?.plan === "pro" ? "Pro会員" : ticketStatus?.plan === "base" ? "Base会員" : "Free",
      keywords: ["料金", "プラン", "Pro", "Base", "チケット", "月額", "アップグレード"],
    },
    {
      id: "feedback",
      label: "不具合報告",
      sublabel: "開発者へのお問い合わせ・改善リクエスト",
      icon: MessageSquare,
      group: "system",
      keywords: ["不具合", "バグ", "報告", "問い合わせ", "フィードバック", "改善"],
    },
    {
      id: "reset",
      label: "データの初期化",
      sublabel: "累計発話数・苦手単語帳の記録リセット",
      icon: RotateCcw,
      group: "system",
      keywords: ["初期化", "リセット", "削除", "データ", "履歴"],
    },
  ];

  // Filter items by search query
  const filteredItems = menuItems.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    return (
      item.label.toLowerCase().includes(q) ||
      item.sublabel.toLowerCase().includes(q) ||
      item.keywords.some((k) => k.toLowerCase().includes(q))
    );
  });

  const mainGroup = filteredItems.filter((i) => i.group === "main");
  const infoGroup = filteredItems.filter((i) => i.group === "info");
  const systemGroup = filteredItems.filter((i) => i.group === "system");

  const openSection = (key: SettingSectionKey) => {
    setActiveSection(key);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const closeSection = () => {
    setActiveSection(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Helper to get active section title
  const getSectionTitle = (key: SettingSectionKey): string => {
    const item = menuItems.find((i) => i.id === key);
    return item ? item.label : "設定";
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-4 sm:py-6 pb-20 relative">
      {/* ─────────────────────────────────────────────────────────────
          1. ROOT MENU LIST VIEW (matches attached screenshot exactly)
          ───────────────────────────────────────────────────────────── */}
      {activeSection === null ? (
        <div className="space-y-4 animate-in fade-in-50 duration-200">
          {/* Top Bar: Circular Back Button & Centered Title */}
          <div className="flex items-center justify-between relative min-h-[44px]">
            <button
              type="button"
              onClick={() => router.back()}
              aria-label="前の画面に戻る"
              className="w-9 h-9 rounded-full bg-foreground text-background flex items-center justify-center hover:opacity-80 active:scale-95 transition shadow-xs cursor-pointer z-10"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg sm:text-xl font-bold text-foreground text-center absolute inset-x-0 mx-auto pointer-events-none">
              設定
            </h1>
            <div className="w-9 h-9 opacity-0 pointer-events-none" />
          </div>

          {/* Search Bar ("🔍 設定検索") */}
          <div className="relative rounded-xl bg-muted/60 border border-border/60 focus-within:border-primary/50 focus-within:bg-background transition flex items-center px-3.5 py-2.5 gap-2.5">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="設定検索"
              className="bg-transparent text-sm w-full focus:outline-hidden text-foreground placeholder:text-muted-foreground font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label="検索キーワードをクリア"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Admin Bar if applicable */}
          {isAdminEmail(userEmail) && (
            <Link
              href="/admin/customers"
              className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-amber-700 dark:text-amber-300 font-bold text-xs hover:bg-amber-500/15 transition shadow-2xs group"
            >
              <div className="flex items-center gap-2.5">
                <Shield className="w-4 h-4 shrink-0" />
                <span>🛡️ 管理者専用ダッシュボード</span>
              </div>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
            </Link>
          )}

          {/* Group 1: Main Settings (アカウント管理、通知、学習設定、レベル判定、マイク設定) */}
          {mainGroup.length > 0 && (
            <div className="bg-card rounded-2xl border border-border/80 shadow-xs divide-y divide-border/60 overflow-hidden">
              {mainGroup.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => openSection(item.id)}
                    className="w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-muted/40 active:bg-muted/60 transition cursor-pointer group"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <Icon className="w-5 h-5 text-foreground shrink-0" />
                      <div className="min-w-0">
                        <span className="text-sm font-semibold text-foreground block truncate">
                          {item.label}
                        </span>
                        <span className="text-[11px] text-muted-foreground truncate block">
                          {item.sublabel}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {item.badge && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground border border-border">
                          {item.badge}
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 text-muted-foreground/70 group-hover:text-foreground group-hover:translate-x-0.5 transition" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Group 2: Guides & Info (使い方・お知らせ・ブログ・規約) */}
          {infoGroup.length > 0 && (
            <div className="bg-card rounded-2xl border border-border/80 shadow-xs divide-y divide-border/60 overflow-hidden">
              {infoGroup.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => openSection(item.id)}
                    className="w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-muted/40 active:bg-muted/60 transition cursor-pointer group"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <Icon className="w-5 h-5 text-foreground shrink-0" />
                      <div className="min-w-0">
                        <span className="text-sm font-semibold text-foreground block truncate">
                          {item.label}
                        </span>
                        <span className="text-[11px] text-muted-foreground truncate block">
                          {item.sublabel}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {item.badge && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground border border-border">
                          {item.badge}
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 text-muted-foreground/70 group-hover:text-foreground group-hover:translate-x-0.5 transition" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Group 3: Plans, Feedback & Reset */}
          {systemGroup.length > 0 && (
            <div className="bg-card rounded-2xl border border-border/80 shadow-xs divide-y divide-border/60 overflow-hidden">
              {systemGroup.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => openSection(item.id)}
                    className="w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-muted/40 active:bg-muted/60 transition cursor-pointer group"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <Icon className="w-5 h-5 text-foreground shrink-0" />
                      <div className="min-w-0">
                        <span className="text-sm font-semibold text-foreground block truncate">
                          {item.label}
                        </span>
                        <span className="text-[11px] text-muted-foreground truncate block">
                          {item.sublabel}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {item.badge && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground border border-border">
                          {item.badge}
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 text-muted-foreground/70 group-hover:text-foreground group-hover:translate-x-0.5 transition" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Group 4: Logout / Login row */}
          <div className="bg-card rounded-2xl border border-border/80 shadow-xs overflow-hidden">
            {isLoggedIn ? (
              <button
                type="button"
                onClick={handleLogout}
                className="w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-destructive/10 text-destructive transition cursor-pointer group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <LogOut className="w-5 h-5 shrink-0" />
                  <span className="text-sm font-semibold block">ログアウト</span>
                </div>
                <ChevronRight className="w-4 h-4 text-destructive/70 group-hover:translate-x-0.5 transition shrink-0" />
              </button>
            ) : (
              <Link
                href="/login"
                className="w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-primary/10 text-primary transition cursor-pointer group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <LogIn className="w-5 h-5 shrink-0" />
                  <span className="text-sm font-semibold block">ログイン / 会員登録</span>
                </div>
                <ChevronRight className="w-4 h-4 text-primary/70 group-hover:translate-x-0.5 transition shrink-0" />
              </Link>
            )}
          </div>

          {/* Empty search fallback */}
          {filteredItems.length === 0 && (
            <div className="p-8 text-center bg-card rounded-2xl border border-border space-y-2">
              <p className="text-sm font-semibold text-foreground">
                該当する設定項目が見つかりませんでした
              </p>
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-xs text-primary font-bold hover:underline"
              >
                検索キーワードをクリア
              </button>
            </div>
          )}
        </div>
      ) : (
        /* ─────────────────────────────────────────────────────────────
           2. DETAIL VIEW (displayed when any list item is tapped)
           ───────────────────────────────────────────────────────────── */
        <div className="space-y-4 animate-in fade-in-50 duration-200">
          {/* Detail Header: Circular Back Button returning to list, Centered Title */}
          <div className="flex items-center justify-between relative min-h-[44px]">
            <button
              type="button"
              onClick={closeSection}
              aria-label="設定一覧に戻る"
              className="w-9 h-9 rounded-full bg-foreground text-background flex items-center justify-center hover:opacity-80 active:scale-95 transition shadow-xs cursor-pointer z-10"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-base sm:text-lg font-bold text-foreground text-center absolute inset-x-0 mx-auto pointer-events-none truncate px-12">
              {getSectionTitle(activeSection)}
            </h2>
            <div className="w-9 h-9 opacity-0 pointer-events-none" />
          </div>

          {/* Back breadcrumb button */}
          <div className="pt-0.5">
            <button
              type="button"
              onClick={closeSection}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground font-medium transition cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>設定メニュー一覧へ戻る</span>
            </button>
          </div>

          {/* SECTION 1: アカウント管理 */}
          {activeSection === "account" && (
            <div className="bg-card rounded-2xl p-5 sm:p-7 border border-border shadow-xs space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 font-bold text-base text-foreground">
                  <User className="w-5 h-5 text-primary" />
                  <span>アカウント情報</span>
                </div>
                {isLoggedIn ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    会員登録済み
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-muted text-muted-foreground border border-border">
                    ゲスト利用中
                  </span>
                )}
              </div>

              <div className="space-y-4 pt-1">
                {/* Email Row */}
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                      登録メールアドレス
                    </span>
                    <p className="text-xs text-muted-foreground">
                      {userEmail || "アカウント未作成（ゲスト利用中）"}
                    </p>
                  </div>
                  {!isLoggedIn && (
                    <Link
                      href="/login?mode=signup"
                      className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition shadow-xs shrink-0 self-start sm:self-auto"
                    >
                      <span>無料アカウント作成</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>

                {/* Nickname Row */}
                <div className="space-y-1.5">
                  <label htmlFor="settings-nickname" className="text-xs font-bold text-foreground block">
                    ニックネーム（表示名）
                  </label>
                  <p className="text-[11px] text-muted-foreground">
                    ダッシュボードの挨拶や学習レポートで使用されるあなたのお名前です。
                  </p>
                  <div className="flex items-center gap-2 pt-0.5">
                    <input
                      id="settings-nickname"
                      type="text"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder="例: リョウ、Alex、英語がんばるマン"
                      className="flex-1 p-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                      maxLength={30}
                    />
                    <button
                      type="button"
                      onClick={handleSaveNickname}
                      disabled={isSavingNickname}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 active:scale-95 transition shadow-xs disabled:opacity-50 min-h-[42px] shrink-0 cursor-pointer"
                    >
                      {isSavingNickname ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : nicknameSaved ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>保存完了</span>
                        </>
                      ) : (
                        <span>保存する</span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Password Change */}
                {isLoggedIn && (
                  <div className="pt-2 border-t border-border/60">
                    {isGoogleUser ? (
                      <div className="p-3.5 rounded-xl bg-blue-500/5 border border-blue-500/15 flex items-center gap-2.5">
                        <span className="text-base">🌐</span>
                        <div>
                          <p className="text-xs font-bold text-foreground">Googleアカウント連携中</p>
                          <p className="text-[11px] text-muted-foreground">
                            Googleアカウントで安全にログイン中のため、パスワード変更は不要です。
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                              <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                              パスワード
                            </span>
                            <p className="text-xs text-muted-foreground tracking-widest mt-0.5">
                              ••••••••••••
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setIsPasswordSectionOpen((prev) => !prev)}
                            className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                            {isPasswordSectionOpen ? "閉じる" : "パスワード変更"}
                          </button>
                        </div>

                        {isPasswordSectionOpen && (
                          <form
                            onSubmit={handleChangePassword}
                            className="p-4 rounded-xl bg-muted/40 border border-border/80 space-y-3 animate-in fade-in-50 duration-200"
                          >
                            <div className="space-y-1">
                              <label className="text-xs font-semibold text-foreground">
                                新しいパスワード (6文字以上)
                              </label>
                              <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                minLength={6}
                                className="w-full p-2.5 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-semibold text-foreground">
                                新しいパスワード（確認用）
                              </label>
                              <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                minLength={6}
                                className="w-full p-2.5 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                              />
                            </div>

                            {passwordMessage && (
                              <div
                                className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                                  passwordMessage.type === "success"
                                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                                    : "bg-destructive/10 text-destructive border border-destructive/20"
                                }`}
                              >
                                {passwordMessage.type === "success" ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                ) : (
                                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                )}
                                <span>{passwordMessage.text}</span>
                              </div>
                            )}

                            <div className="flex justify-end pt-1">
                              <button
                                type="submit"
                                disabled={isSubmittingPassword}
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary/90 disabled:opacity-50 transition shadow-xs cursor-pointer"
                              >
                                {isSubmittingPassword ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <span>パスワードを更新</span>
                                )}
                              </button>
                            </div>
                          </form>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SECTION 2: 通知・リマインド */}
          {activeSection === "reminder" && (
            <div className="space-y-3">
              <ReminderSettingsSection />
            </div>
          )}

          {/* SECTION 3: 学習設定 */}
          {activeSection === "learning" && (
            <div className="bg-card rounded-2xl p-5 sm:p-7 border border-border shadow-xs space-y-6">
              {/* Industry Selection */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-primary" />
                      <span>学習する業種・ドメイン</span>
                    </h3>
                    <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                      IT・ビジネス・マーケティング・日常会話から選択
                    </p>
                  </div>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                    現在: {industries.find((i) => i.key === industry)?.label.split(" ")[0]}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {industries.map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setIndustry(item.key)}
                      className={`p-3.5 rounded-xl border text-left transition min-h-[56px] cursor-pointer ${
                        industry === item.key
                          ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                          : "border-border hover:border-primary/40 bg-card"
                      }`}
                    >
                      <p className="font-bold text-sm text-foreground">{item.label}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                        {item.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Level Selection */}
              <div className="space-y-3 pt-3 border-t border-border/60">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
                      <BarChart className="w-4 h-4 text-primary" />
                      <span>難易度レベルの手動選択</span>
                    </h3>
                    <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                      文の長さや構文の複雑さを変更できます
                    </p>
                  </div>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                    現在: {levels.find((l) => l.key === level)?.label.split(" ")[0]}
                  </span>
                </div>

                <div className="space-y-2">
                  {levels.map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setLevel(item.key)}
                      className={`w-full p-3.5 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                        level === item.key
                          ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                          : "border-border hover:border-primary/40 bg-card"
                      }`}
                    >
                      <div className="space-y-0.5 pr-2">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm text-foreground">{item.label}</p>
                          <span className="text-[11px] text-muted-foreground">({item.words})</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                          level === item.key
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-muted-foreground"
                        }`}
                      >
                        {level === item.key && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Save learning button */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/40 border border-border/60">
                <span className="text-xs text-muted-foreground">次回の練習文から設定が適用されます</span>
                <div className="flex items-center gap-2">
                  {isSaved && (
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 animate-in fade-in">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      保存完了
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={handleSaveLearning}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:bg-primary/90 transition shadow-xs cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>設定を保存</span>
                  </button>
                </div>
              </div>

              {/* Custom Words Section */}
              <div className="pt-2 border-t border-border/60">
                <CustomWordsSection
                  industry={industry}
                  plan={ticketStatus?.plan || "free"}
                  isLoggedIn={isLoggedIn}
                />
              </div>
            </div>
          )}

          {/* SECTION 4: レベル判定テスト */}
          {activeSection === "assessment" && (
            <div className="bg-card rounded-2xl p-5 sm:p-7 border border-border shadow-xs space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-bold text-foreground">
                      レベル判定テスト
                    </h3>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                      アダプティブ (3〜5問)
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                    発話の正確性と話速追従度からA1〜C1の5段階で現在の英語力を判定（所要時間約2〜3分）
                  </p>
                </div>
              </div>

              {/* Previous Result */}
              {assessmentResult && assessmentDate && (
                <div className="p-4 rounded-xl bg-muted/50 border border-border space-y-2.5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      前回の判定結果
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(assessmentDate).toLocaleDateString("ja-JP", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    {assessmentResult.levelInfo ? (
                      <span
                        className={`px-3 py-1 rounded-lg border text-sm font-bold ${assessmentResult.levelInfo.bg} ${assessmentResult.levelInfo.color}`}
                      >
                        {assessmentResult.levelInfo.label}
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-lg border text-sm font-bold bg-primary/10 text-primary border-primary/30">
                        判定済み
                      </span>
                    )}
                    {assessmentResult.overallComposite !== undefined && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>総合スコア: <strong>{assessmentResult.overallComposite}%</strong></span>
                        <span className="text-border">|</span>
                        <span>正確性: {assessmentResult.overallAccuracy}%</span>
                        <span className="text-border">|</span>
                        <span>話速: {assessmentResult.overallWPMFollowRate}%</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleStartAssessment}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition shadow-sm active:scale-95 text-xs sm:text-sm min-h-[44px] cursor-pointer"
              >
                <Target className="w-4 h-4" />
                <span>{assessmentResult ? "再テストを受ける" : "判定テストを開始する"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* SECTION 5: 録音マイク設定 */}
          {activeSection === "mic" && (
            <div className="bg-card rounded-2xl p-5 sm:p-7 border border-border shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
                  <Mic className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">録音マイクの設定</h3>
                  <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                    AirPodsなどのBluetoothイヤホンや外付けマイクを明示的に指定可能
                  </p>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <label className="text-xs font-semibold text-foreground block">
                  使用するマイクデバイス
                </label>
                <select
                  value={selectedMicId}
                  onChange={(e) => handleMicChange(e.target.value)}
                  className="w-full p-3 rounded-xl border border-border bg-background text-foreground text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition min-h-[44px]"
                >
                  <option value="">システム既定（自動選択）</option>
                  {audioDevices.map((device, idx) => (
                    <option key={device.deviceId || idx} value={device.deviceId}>
                      {device.label || `マイク ${idx + 1}`}
                    </option>
                  ))}
                </select>
                {selectedMicId && (
                  <p className="text-[11px] text-primary font-medium pl-1">
                    ✓ 選択したマイクは次回以降も自動で優先接続されます
                  </p>
                )}
              </div>
            </div>
          )}

          {/* SECTION 6: 機能一覧ガイド（使い方） */}
          {activeSection === "guide" && (
            <div className="space-y-3">
              <AppFeatureGuide />
            </div>
          )}

          {/* SECTION 7: お知らせ */}
          {activeSection === "announcements" && (
            <div className="space-y-3">
              <AnnouncementHistorySection />
            </div>
          )}

          {/* SECTION 8: 公式ブログ & Threads */}
          {activeSection === "community" && (
            <div className="bg-card rounded-2xl p-5 sm:p-7 border border-border shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">公式ブログ & ノウハウ & Threads</h3>
                  <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                    WPMを高めるトレーニング法や他社サービス比較、最新の英語学習Tips
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 pt-1">
                <Link
                  href="/blog"
                  className="p-4 rounded-xl border border-border bg-muted/30 hover:bg-muted/60 transition flex items-center justify-between group"
                >
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-foreground group-hover:text-primary transition block">
                      📝 公式ブログ（WPM・シャドーイング解説）
                    </span>
                    <span className="text-[11px] text-muted-foreground">記事一覧をチェック ↗</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition shrink-0" />
                </Link>

                <Link
                  href="/compare/shadoten"
                  className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 transition flex items-center justify-between group"
                >
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-amber-700 dark:text-amber-400 block">
                      ⚡ 他社サービスとの徹底比較
                    </span>
                    <span className="text-[11px] text-muted-foreground">料金・AIリアルタイム判定の違い ↗</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-amber-500 group-hover:translate-x-0.5 transition shrink-0" />
                </Link>

                <a
                  href="https://www.threads.net"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 rounded-xl border border-border bg-muted/30 hover:bg-muted/60 transition flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-black text-white dark:bg-white dark:text-black flex items-center justify-center font-black text-xs shrink-0">
                      @
                    </span>
                    <div>
                      <span className="text-xs sm:text-sm font-bold text-foreground group-hover:text-primary transition block">
                        公式Threads（シャドーイングTips）
                      </span>
                      <span className="text-[11px] text-muted-foreground">最新ノウハウを配信中 ↗</span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition shrink-0" />
                </a>
              </div>
            </div>
          )}

          {/* SECTION 9: 利用規約・プライバシー */}
          {activeSection === "legal" && (
            <div className="bg-card rounded-2xl p-5 sm:p-7 border border-border shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-500/10 text-slate-600 dark:text-slate-400 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">利用規約・プライバシーポリシー</h3>
                  <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                    安心してご利用いただくための各種規約および特定商取引法表記
                  </p>
                </div>
              </div>

              <div className="divide-y divide-border/60 rounded-xl border border-border overflow-hidden">
                <Link
                  href="/terms"
                  className="p-3.5 flex items-center justify-between hover:bg-muted/40 transition group"
                >
                  <span className="text-xs sm:text-sm font-medium text-foreground group-hover:text-primary">
                    利用規約
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary" />
                </Link>
                <Link
                  href="/privacy"
                  className="p-3.5 flex items-center justify-between hover:bg-muted/40 transition group"
                >
                  <span className="text-xs sm:text-sm font-medium text-foreground group-hover:text-primary">
                    プライバシーポリシー
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary" />
                </Link>
                <Link
                  href="/tokushoho"
                  className="p-3.5 flex items-center justify-between hover:bg-muted/40 transition group"
                >
                  <span className="text-xs sm:text-sm font-medium text-foreground group-hover:text-primary">
                    特定商取引法に基づく表記
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary" />
                </Link>
              </div>
            </div>
          )}

          {/* SECTION 10: 料金プラン */}
          {activeSection === "plans" && (
            <div className="space-y-3">
              <PlanComparisonSection
                currentPlan={ticketStatus?.plan || "free"}
                isRegistered={isLoggedIn}
                userEmail={userEmail}
              />
            </div>
          )}

          {/* SECTION 11: 不具合報告 */}
          {activeSection === "feedback" && (
            <div className="space-y-3">
              <FeedbackForm />
            </div>
          )}

          {/* SECTION 12: データの初期化 */}
          {activeSection === "reset" && (
            <div className="bg-card rounded-2xl p-5 sm:p-7 border border-border shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">学習データ・記録の初期化</h3>
                  <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                    累計発話数、学習履歴、苦手単語帳の記録をリセットして初期状態に戻します。
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleResetData}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-xs font-bold hover:bg-destructive/20 active:scale-95 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>学習記録と発話単語数をリセットする</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
