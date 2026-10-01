"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DifficultyLevel, Industry, normalizeIndustry } from "@/types";
import { AssessmentResult } from "@/lib/assessment/assessment-engine";
import {
  Settings,
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
  ChevronDown,
  ArrowUp,
  Megaphone,
  MessageSquare,
  BookOpen,
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
import { isAdminEmail } from "@/lib/auth/admin-checker";


export default function SettingsPage() {
  const router = useRouter();
  const [industry, setIndustry] = useState<Industry>("tech");
  const [level, setLevel] = useState<DifficultyLevel>("intermediate");
  const [isSaved, setIsSaved] = useState(false);
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | null>(null);
  const [assessmentDate, setAssessmentDate] = useState<string | null>(null);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedMicId, setSelectedMicId] = useState<string>("");

  // Accordion States (initially collapsed as requested)
  const [isIndustryOpen, setIsIndustryOpen] = useState(false);
  const [isLevelOpen, setIsLevelOpen] = useState(false);

  // Floating Back to Top State
  const [showScrollTop, setShowScrollTop] = useState(false);

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

  // Scroll listener for Floating Back to Top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const yOffset = -75; // sticky header compensation
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  const quickNavItems = [
    { id: "section-account", label: "アカウント", icon: User },
    { id: "section-announcements", label: "お知らせ", icon: Megaphone },
    { id: "section-assessment", label: "レベル判定", icon: Target },
    { id: "section-learning", label: "学習設定", icon: Briefcase },
    { id: "section-mic", label: "マイク設定", icon: Mic },
    { id: "section-feedback", label: "不具合報告", icon: MessageSquare },
    { id: "section-plans", label: "料金プラン", icon: Sparkles },
    { id: "section-reset", label: "初期化", icon: RotateCcw },
  ];

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

  const handleSave = () => {
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

  return (
    <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8 pb-16 sm:pb-8 relative">
      {/* Header */}
      <div className="space-y-3">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Settings className="w-5 h-5 sm:w-7 sm:h-7 text-primary" />
            設定・アカウント
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            アカウント情報の管理や学習分野・難易度レベル、マイク設定を行います。
          </p>
        </div>

        {/* ── 目次クイックジャンプ・バー ── */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none no-scrollbar -mx-1 px-1">
          {quickNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => scrollToSection(item.id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60 transition whitespace-nowrap active:scale-95 shrink-0"
              >
                <Icon className="w-3.5 h-3.5 text-primary/80" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 管理者専用導線 ── */}
      {isAdminEmail(userEmail) && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-amber-700 dark:text-amber-300">
              管理者アカウントとしてログイン中
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              登録ユーザーの学習状況（顧客管理）や知財コンプライアンス監査ログを確認・管理できます。
            </p>
          </div>
          <Link
            href="/admin/customers"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-sm transition-colors shrink-0"
          >
            🛡️ 管理者専用ダッシュボード ↗
          </Link>
        </div>
      )}

      {/* ── 1. アカウント情報セクション ── */}
      <div id="section-account" className="bg-card rounded-2xl p-5 sm:p-8 border border-border shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-foreground font-bold text-base sm:text-lg">
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
              未登録（ゲスト体験中）
            </span>
          )}
        </div>

        <div className="space-y-4 pt-1">
          {/* Email Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-xl bg-muted/40 border border-border/60">
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
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition shadow-xs shrink-0"
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
                className="flex-1 p-2.5 sm:p-3 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                maxLength={30}
              />
              <button
                type="button"
                onClick={handleSaveNickname}
                disabled={isSavingNickname}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 sm:py-3 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 active:scale-95 transition shadow-xs disabled:opacity-50 min-h-[42px] shrink-0"
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

          {/* Password Row */}
          {isLoggedIn && (
            <div className="pt-2 border-t border-border/60">
              {isGoogleUser ? (
                <div className="p-3.5 rounded-xl bg-blue-500/5 border border-blue-500/15 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">🌐</span>
                    <div>
                      <p className="text-xs font-bold text-foreground">
                        Googleアカウント連携中
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Googleアカウントで安全にログイン中のため、パスワードの変更は不要です。
                      </p>
                    </div>
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
                      className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      {isPasswordSectionOpen ? "閉じる" : "パスワードを変更する"}
                    </button>
                  </div>

                  {/* Password Change Form */}
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
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary/90 disabled:opacity-50 transition shadow-xs"
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

      {/* ── 2. お知らせ・キャンペーン履歴 ── */}
      <div id="section-announcements">
        <AnnouncementHistorySection />
      </div>

      {/* ── 3. レベル判定テスト ── */}
      <div id="section-assessment" className="bg-card rounded-2xl p-5 sm:p-8 border-2 border-primary/20 shadow-sm space-y-4 sm:space-y-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-5">
          <Target className="w-24 h-24 text-primary" />
        </div>

        <div className="flex items-center gap-2 text-foreground font-semibold">
          <Sparkles className="w-5 h-5 text-primary" />
          <span className="text-base sm:text-lg font-bold">レベル判定テスト</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
            アダプティブ (3〜5問)
          </span>
        </div>

        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          アダプティブ方式で最大5問のシャドーイングテストを実施。
          正確性と話速追従度の総合スコアからA1〜C1の5段階であなたの実力を判定します。
          所要時間は約2〜3分です。
        </p>

        {/* Previous result */}
        {assessmentResult && assessmentDate && (
          <div className="p-3 sm:p-4 rounded-xl bg-muted/50 border border-border space-y-2">
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
                <span
                  className={`px-3 py-1 rounded-lg border text-sm font-bold ${
                    (assessmentResult as unknown as Record<string, unknown>).recommendedLevel === "beginner"
                      ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-600"
                      : (assessmentResult as unknown as Record<string, unknown>).recommendedLevel === "intermediate"
                      ? "bg-blue-500/15 border-blue-500/30 text-blue-600"
                      : "bg-purple-500/15 border-purple-500/30 text-purple-600"
                  }`}
                >
                  {(assessmentResult as unknown as Record<string, unknown>).recommendedLevel === "beginner"
                    ? "初級"
                    : (assessmentResult as unknown as Record<string, unknown>).recommendedLevel === "intermediate"
                    ? "中級"
                    : "上級"}
                </span>
              )}
              <div className="flex items-center gap-2 text-[11px] sm:text-xs text-muted-foreground">
                {assessmentResult.overallComposite !== undefined ? (
                  <>
                    <span>総合 {assessmentResult.overallComposite}%</span>
                    <span className="text-border">|</span>
                    <span>正確性 {assessmentResult.overallAccuracy}%</span>
                    <span className="text-border">|</span>
                    <span>話速 {assessmentResult.overallWPMFollowRate}%</span>
                  </>
                ) : (
                  <>
                    <span>初級 {(assessmentResult as unknown as Record<string, unknown>).beginnerAvg as number}%</span>
                    <span className="text-border">|</span>
                    <span>中級 {(assessmentResult as unknown as Record<string, unknown>).intermediateAvg as number}%</span>
                    <span className="text-border">|</span>
                    <span>上級 {(assessmentResult as unknown as Record<string, unknown>).advancedAvg as number}%</span>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleStartAssessment}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 sm:py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition shadow-sm active:scale-95 min-h-[48px] text-base sm:text-sm"
        >
          <Target className="w-5 h-5" />
          {assessmentResult ? "再テストを受ける" : "判定テストを開始する"}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* ── 4. 学習する業種・ドメイン（アコーディオン） ── */}
      <div id="section-learning" className="space-y-3">
        <div className="bg-card rounded-2xl border border-border shadow-xs overflow-hidden transition-all duration-200">
          <button
            type="button"
            onClick={() => setIsIndustryOpen((prev) => !prev)}
            className="w-full p-4 sm:p-6 flex items-center justify-between gap-3 text-left hover:bg-muted/30 transition-colors"
            aria-expanded={isIndustryOpen}
          >
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Briefcase className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-foreground font-bold text-sm sm:text-base">
                    学習する業種・ドメイン
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                    現在: {industries.find((item) => item.key === industry)?.label || industry}
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                  IT、ビジネス、金融など学習する業界特有の表現を選択
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium shrink-0">
              <span className="hidden sm:inline">{isIndustryOpen ? "閉じる" : "変更する"}</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${
                  isIndustryOpen ? "rotate-180 text-primary" : "text-muted-foreground"
                }`}
              />
            </div>
          </button>

          {isIndustryOpen && (
            <div className="px-4 pb-5 sm:px-6 sm:pb-6 pt-1 border-t border-border/60 space-y-3 animate-in fade-in-50 duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                {industries.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setIndustry(item.key)}
                    className={`p-3.5 sm:p-4 rounded-xl border text-left transition min-h-[56px] ${
                      industry === item.key
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                        : "border-border hover:border-primary/40 bg-card"
                    }`}
                  >
                    <p className="font-bold text-sm text-foreground">{item.label}</p>
                    <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      {item.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── 5. 難易度レベルの手動選択（アコーディオン） ── */}
        <div className="bg-card rounded-2xl border border-border shadow-xs overflow-hidden transition-all duration-200">
          <button
            type="button"
            onClick={() => setIsLevelOpen((prev) => !prev)}
            className="w-full p-4 sm:p-6 flex items-center justify-between gap-3 text-left hover:bg-muted/30 transition-colors"
            aria-expanded={isLevelOpen}
          >
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <BarChart className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-foreground font-bold text-sm sm:text-base">
                    難易度レベルの手動選択
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                    現在: {levels.find((item) => item.key === level)?.label || level}
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                  初級・中級・上級のセンテンス長さや難易度を手動変更
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium shrink-0">
              <span className="hidden sm:inline">{isLevelOpen ? "閉じる" : "変更する"}</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${
                  isLevelOpen ? "rotate-180 text-primary" : "text-muted-foreground"
                }`}
              />
            </div>
          </button>

          {isLevelOpen && (
            <div className="px-4 pb-5 sm:px-6 sm:pb-6 pt-1 border-t border-border/60 space-y-2.5 sm:space-y-3 animate-in fade-in-50 duration-200">
              {levels.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setLevel(item.key)}
                  className={`w-full p-3.5 sm:p-4 rounded-xl border text-left transition min-h-[64px] flex items-center justify-between ${
                    level === item.key
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : "border-border hover:border-primary/40 bg-card"
                  }`}
                >
                  <div className="space-y-1 pr-2">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm text-foreground">{item.label}</p>
                      <span className="text-[11px] text-muted-foreground font-medium">
                        ({item.words})
                      </span>
                    </div>
                    <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                      level === item.key ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground"
                    }`}
                  >
                    {level === item.key && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── 6. 学習設定を保存するボタン ── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 sm:p-5 rounded-2xl bg-card border border-border shadow-xs">
          <div className="text-xs text-muted-foreground text-center sm:text-left">
            <p className="font-semibold text-foreground">学習ドメイン・難易度設定の保存</p>
            <p className="text-[11px] mt-0.5">変更した業種や難易度を次回の練習から適用します。</p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {isSaved && (
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                学習設定を保存しました
              </span>
            )}
            <button
              onClick={handleSave}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 sm:py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition shadow-sm active:scale-95 min-h-[44px] text-sm"
            >
              <Save className="w-4 h-4" />
              学習設定を保存する
            </button>
          </div>
        </div>
      </div>

      {/* ── 7. 録音マイクの設定 ── */}
      <div id="section-mic" className="bg-card rounded-2xl p-5 sm:p-8 border border-border shadow-sm space-y-4 sm:space-y-5">
        <div className="flex items-center gap-2 text-foreground font-semibold text-sm sm:text-base">
          <Mic className="w-5 h-5 text-primary" />
          <span>録音マイクの設定</span>
        </div>

        <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
          AirPodsなどのBluetoothイヤホンや外付けマイクを明示的に指定できます。ブラウザの標準マイクで問題ない場合は「システム既定」のままで動作します。
        </p>

        <div className="space-y-2">
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
            <p className="text-[10px] sm:text-xs text-primary font-medium pl-1">
              ✓ 選択したマイクは次回以降も自動で優先接続されます
            </p>
          )}
        </div>
      </div>

      {/* ── 8. 不具合報告・お問い合わせ ── */}
      <div id="section-feedback">
        <FeedbackForm />
      </div>

      {/* ── 9. 料金プラン・コース案内セクション ── */}
      <div id="section-plans">
        <PlanComparisonSection
          currentPlan={ticketStatus?.plan || "free"}
          isRegistered={isLoggedIn}
          userEmail={userEmail}
        />
      </div>

      {/* ── 10. 公式ノウハウ & サービス比較 ── */}
      <div className="bg-card rounded-2xl p-5 sm:p-8 border border-border shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-foreground font-semibold text-sm sm:text-base">
          <BookOpen className="w-5 h-5 text-primary" />
          <span>公式ブログ & ノウハウガイド</span>
        </div>
        <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
          WPMを高める「チャンク（意味の塊）」意識トレーニングや、他社サービスとの料金・機能比較記事を公開しています。
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <Link
            href="/blog"
            className="p-3.5 rounded-xl border border-border bg-muted/40 hover:bg-muted transition flex items-center justify-between group"
          >
            <div>
              <span className="text-xs font-bold text-foreground group-hover:text-primary transition block">
                公式ブログ（WPM・シャドーイング解説）
              </span>
              <span className="text-[10px] text-muted-foreground">記事一覧をチェック</span>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition" />
          </Link>

          <Link
            href="/compare/shadoten"
            className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 transition flex items-center justify-between group"
          >
            <div>
              <span className="text-xs font-bold text-amber-700 dark:text-amber-400 block">
                シャドテン vs ShadowLog 徹底比較
              </span>
              <span className="text-[10px] text-muted-foreground">料金・AIリアルタイム判定の違い</span>
            </div>
            <ArrowRight className="w-4 h-4 text-amber-500 group-hover:translate-x-0.5 transition" />
          </Link>
        </div>
      </div>

      {/* ── 11. 学習データ・記録の初期化 ── */}
      <div id="section-reset" className="bg-card rounded-2xl p-5 sm:p-8 border border-border shadow-sm space-y-4 sm:space-y-5">
        <div className="flex items-center gap-2 text-foreground font-semibold text-sm sm:text-base">
          <RotateCcw className="w-5 h-5 text-muted-foreground" />
          <span>学習データ・記録の初期化</span>
        </div>

        <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
          累計発話単語数、学習履歴、苦手単語帳の記録をリセットして0から再スタートできます。練習前の初期状態に戻したい場合にご利用ください。
        </p>

        <div>
          <button
            type="button"
            onClick={handleResetData}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-xs font-semibold hover:bg-destructive/20 active:scale-95 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            学習記録と発話単語数をリセットする
          </button>
        </div>
      </div>

      {/* ── ページ最下部 トップに戻る導線 ── */}
      <div className="pt-2 pb-4 flex justify-center">
        <button
          type="button"
          onClick={scrollToTop}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border bg-card/60 hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-bold transition shadow-xs active:scale-95"
        >
          <ArrowUp className="w-3.5 h-3.5 text-primary" />
          <span>ページ最上部へ戻る</span>
        </button>
      </div>

      {/* ── スクロール検知型 フローティング「TOP」ボタン ── */}
      {showScrollTop && (
        <button
          type="button"
          onClick={scrollToTop}
          aria-label="ページ最上部へ戻る"
          className="fixed bottom-20 right-4 sm:bottom-8 sm:right-8 z-40 px-3.5 py-2.5 sm:px-4 sm:py-2.5 rounded-full bg-card/95 border border-border shadow-xl backdrop-blur-md hover:bg-primary hover:text-primary-foreground hover:border-primary text-foreground transition-all duration-300 active:scale-95 flex items-center gap-1.5 group animate-in fade-in slide-in-from-bottom-3"
        >
          <ArrowUp className="w-4 h-4 text-primary group-hover:text-primary-foreground group-hover:-translate-y-0.5 transition-transform" />
          <span className="text-xs font-bold">TOP</span>
        </button>
      )}
    </div>
  );
}
