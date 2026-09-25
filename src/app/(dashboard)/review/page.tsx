"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  getWeakWords,
  getStoredSessions,
  toggleMasteredWeakWord,
  deleteWeakWord,
  deleteStoredSession,
  getPlanType,
  setPlanType,
  GUEST_MAX_WEAK_WORDS,
  GUEST_MAX_SESSIONS,
} from "@/lib/storage/user-learning-store";
import { WeakWord, StoredSession, UserPlanType } from "@/types";
import {
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  History,
  Sparkles,
  Lock,
  ArrowRight,
  RotateCcw,
  Volume2,
  Trash2,
  TrendingUp,
  Crown,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  Lightbulb,
  Check,
} from "lucide-react";

export default function ReviewPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"words" | "history" | "analytics">("words");
  const [plan, setPlan] = useState<UserPlanType>("guest");

  // Data states
  const [weakWords, setWeakWords] = useState<WeakWord[]>([]);
  const [totalWeakCount, setTotalWeakCount] = useState(0);
  const [isWordsLimited, setIsWordsLimited] = useState(false);

  const [sessions, setSessions] = useState<StoredSession[]>([]);
  const [totalSessionCount, setTotalSessionCount] = useState(0);
  const [clearedCount, setClearedCount] = useState(0);
  const [needsReviewCount, setNeedsReviewCount] = useState(0);
  const [isSessionsLimited, setIsSessionsLimited] = useState(false);

  // Filter states
  const [wordFilter, setWordFilter] = useState<"all" | "active" | "mastered">("all");
  const [historyFilter, setHistoryFilter] = useState<"all" | "cleared" | "needsReview">("all");
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [expandedSentenceIds, setExpandedSentenceIds] = useState<Record<string, boolean>>({});
  const [expandedWordSentenceIds, setExpandedWordSentenceIds] = useState<Record<string, boolean>>({});

  // Pro modal state
  const [showProModal, setShowProModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Detect initial offline state and listen for changes
    setIsOffline(!navigator.onLine);
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    // Sync URL search params for tab and targeted session
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      const sessionParam = params.get("session");
      if (tabParam === "history" || tabParam === "words" || tabParam === "analytics") {
        setActiveTab(tabParam);
      }
      if (sessionParam) {
        setExpandedSessionId(sessionParam);
        // Also expand sentence if jumped from dashboard
        setExpandedSentenceIds((prev) => ({ ...prev, [sessionParam]: true }));
      }
    }

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  // Load all learning records
  const loadData = useCallback(() => {
    const currentPlan = getPlanType();
    setPlan(currentPlan);

    const wordsData = getWeakWords();
    setWeakWords(wordsData.words);
    setTotalWeakCount(wordsData.totalCount);
    setIsWordsLimited(wordsData.isLimited);

    const sessionsData = getStoredSessions();
    setSessions(sessionsData.sessions);
    setTotalSessionCount(sessionsData.totalCount);
    setClearedCount(sessionsData.clearedCount);
    setNeedsReviewCount(sessionsData.needsReviewCount);
    setIsSessionsLimited(sessionsData.isLimited);
  }, []);

  useEffect(() => {
    loadData();

    // Background sync from Supabase if online
    if (typeof window !== "undefined" && navigator.onLine) {
      import("@/lib/storage/sync-service").then(({ syncSessionsFromSupabase, syncWeakWordsFromSupabase }) => {
        Promise.all([syncSessionsFromSupabase(), syncWeakWordsFromSupabase()]).then(() => {
          loadData();
        }).catch(() => {});
      });
    }
  }, [loadData]);

  // Toggle master status
  const handleToggleMastered = (id: string) => {
    toggleMasteredWeakWord(id);
    loadData();
  };

  // Delete word
  const handleDeleteWord = (id: string) => {
    deleteWeakWord(id);
    loadData();
  };

  // Delete practice session
  const handleDeleteSession = (id: string) => {
    if (confirm("この練習履歴を削除しますか？")) {
      deleteStoredSession(id);
      loadData();
    }
  };

  // Toggle sentence accordion expansion
  const toggleSentenceExpand = (id: string) => {
    setExpandedSentenceIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Toggle weak word sentence expansion
  const toggleWordSentenceExpand = (id: string) => {
    setExpandedWordSentenceIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Play audio of a word or sentence
  const handleSpeak = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  // Start practice with specific sentence
  const handlePracticeSentence = (item: StoredSession | WeakWord) => {
    const text = encodeURIComponent(item.sentence);
    const ja = encodeURIComponent(item.japanese || "");
    const ind = item.industry;
    const lvl = item.level;
    const mode = "mode" in item && item.mode ? item.mode : "sentence";
    router.push(`/practice?retryText=${text}&retryJa=${ja}&industry=${ind}&level=${lvl}&mode=${mode}`);
  };

  // Toggle plan for demonstration / testing
  const handleTogglePlan = () => {
    const nextPlan = plan === "pro" ? "guest" : "pro";
    setPlanType(nextPlan);
    setPlan(nextPlan);
    setShowProModal(false);
    loadData();
  };

  // Filtered weak words
  const filteredWords = weakWords.filter((w) => {
    if (wordFilter === "active") return !w.mastered;
    if (wordFilter === "mastered") return w.mastered;
    return true;
  });

  // Filtered sessions
  const filteredSessions = sessions.filter((s) => {
    if (historyFilter === "cleared") return s.isCleared;
    if (historyFilter === "needsReview") return !s.isCleared;
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-5 sm:space-y-8 pb-12 sm:pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <GraduationCap className="w-5 h-5 sm:w-7 sm:h-7 text-primary" />
            個人学習カルテ・復習
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            過去につまずいた単語やAIコーチの指導を復習し、確実に定着させましょう。
          </p>
        </div>

        {/* Plan Badge */}
        <div className="flex items-center gap-2">
          {plan === "pro" ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 shadow-xs">
              <Crown className="w-3.5 h-3.5 fill-amber-500" />
              Pro 会員（無制限利用中）
            </span>
          ) : (
            <button
              onClick={() => setShowProModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              体験版（制限あり）→ Proにアップグレード
            </button>
          )}
        </div>
      </div>

      {/* Offline indicator */}
      {isOffline && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-500/10 border border-slate-500/25 text-slate-600 dark:text-slate-400 text-xs font-medium animate-in fade-in-50">
          <span>📶</span>
          <span>オフライン利用可能 — ローカルキャッシュから復習中</span>
        </div>
      )}

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-card p-4 sm:p-5 rounded-2xl border border-border shadow-xs">
          <p className="text-[11px] sm:text-xs text-muted-foreground font-medium">累計練習数</p>
          <p className="text-2xl sm:text-3xl font-extrabold font-mono text-foreground mt-1">
            {totalSessionCount}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">セッション</p>
        </div>

        <div className="bg-card p-4 sm:p-5 rounded-2xl border border-border shadow-xs">
          <p className="text-[11px] sm:text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            クリア (80%+)
          </p>
          <p className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
            {clearedCount}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">文を習得</p>
        </div>

        <div className="bg-card p-4 sm:p-5 rounded-2xl border border-border shadow-xs">
          <p className="text-[11px] sm:text-xs text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            要復習 (&lt;80%)
          </p>
          <p className="text-2xl sm:text-3xl font-extrabold font-mono text-rose-600 dark:text-rose-400 mt-1">
            {needsReviewCount}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">リベンジ対象</p>
        </div>

        <div className="bg-card p-4 sm:p-5 rounded-2xl border border-border shadow-xs">
          <p className="text-[11px] sm:text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
            <BookOpen className="w-3 h-3" />
            つまずき単語
          </p>
          <p className="text-2xl sm:text-3xl font-extrabold font-mono text-amber-600 dark:text-amber-400 mt-1">
            {totalWeakCount}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">単語を記録中</p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-border text-sm font-medium gap-2 sm:gap-4 overflow-x-auto scrollbar-hide">
        <button
          onClick={() => setActiveTab("words")}
          className={`pb-3 px-1 sm:px-2 border-b-2 font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === "words"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          つまずき単語帳
          <span className="text-xs px-2 py-0.5 rounded-full bg-muted font-mono font-normal">
            {totalWeakCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className={`pb-3 px-1 sm:px-2 border-b-2 font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === "history"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <History className="w-4 h-4" />
          練習履歴＆コーチ指導
          <span className="text-xs px-2 py-0.5 rounded-full bg-muted font-mono font-normal">
            {totalSessionCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("analytics")}
          className={`pb-3 px-1 sm:px-2 border-b-2 font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === "analytics"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          弱点分析＆Pro機能
        </button>
      </div>

      {/* TAB 1: WEAK WORDS NOTEBOOK */}
      {activeTab === "words" && (
        <div className="space-y-4">
          {/* Word Filters */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-xl text-xs font-medium">
              <button
                onClick={() => setWordFilter("all")}
                className={`px-3 py-1.5 rounded-lg transition ${
                  wordFilter === "all" ? "bg-card text-foreground shadow-xs font-bold" : "text-muted-foreground"
                }`}
              >
                すべて ({weakWords.length})
              </button>
              <button
                onClick={() => setWordFilter("active")}
                className={`px-3 py-1.5 rounded-lg transition ${
                  wordFilter === "active" ? "bg-card text-foreground shadow-xs font-bold" : "text-muted-foreground"
                }`}
              >
                要復習 ({weakWords.filter((w) => !w.mastered).length})
              </button>
              <button
                onClick={() => setWordFilter("mastered")}
                className={`px-3 py-1.5 rounded-lg transition ${
                  wordFilter === "mastered" ? "bg-card text-foreground shadow-xs font-bold" : "text-muted-foreground"
                }`}
              >
                克服済み ({weakWords.filter((w) => w.mastered).length})
              </button>
            </div>

            {isWordsLimited && (
              <span className="text-xs text-muted-foreground">
                体験版: 最新 {GUEST_MAX_WEAK_WORDS} 語を表示中（全 {totalWeakCount} 語）
              </span>
            )}
          </div>

          {filteredWords.length === 0 ? (
            <div className="bg-card rounded-2xl p-8 sm:p-12 border border-border text-center space-y-3">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-foreground">つまずき単語はありません</h3>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto">
                シャドーイング練習中に聞き取られなかった単語や発音がズレた単語が自動でここに蓄積されます。
              </p>
              <button
                onClick={() => router.push("/practice")}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-xs font-bold rounded-xl shadow-xs hover:bg-primary/90 transition"
              >
                練習を始める
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {filteredWords.map((word) => (
                <div
                  key={word.id}
                  className={`bg-card rounded-2xl p-3.5 sm:p-4 border transition shadow-xs flex flex-col justify-between gap-2.5 ${
                    word.mastered ? "border-emerald-500/30 bg-emerald-500/5 opacity-85" : "border-border"
                  }`}
                >
                  <div className="space-y-2">
                    {/* Header Row: Word, Audio icon, Actions (Mastered, Practice) & Badges/Delete */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap flex-1">
                        <span className="text-base sm:text-lg font-bold font-mono tracking-tight text-foreground">
                          {word.word}
                        </span>
                        <button
                          onClick={() => handleSpeak(word.word)}
                          className="p-1 rounded-lg text-muted-foreground hover:text-primary hover:bg-muted transition shrink-0"
                          title="発音を聴く"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>

                        {/* Action buttons directly next to speaker icon */}
                        <button
                          onClick={() => handleToggleMastered(word.id)}
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg transition shrink-0 ${
                            word.mastered
                              ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                              : "bg-muted hover:bg-muted/80 text-foreground"
                          }`}
                        >
                          <Check className="w-3 h-3" />
                          {word.mastered ? "克服済み" : "克服済みにする"}
                        </button>

                        <button
                          onClick={() => handlePracticeSentence(word)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:bg-primary/10 px-2 py-1 rounded-lg transition shrink-0"
                          title="この文を再練習"
                        >
                          <RotateCcw className="w-3 h-3" />
                          再練習
                        </button>
                      </div>

                      {/* Right-aligned tags and delete button */}
                      <div className="flex items-center gap-1 shrink-0">
                        {word.errorCount > 1 && (
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-600 border border-rose-500/20">
                            ミス{word.errorCount}
                          </span>
                        )}
                        <span
                          className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                            word.type === "missing"
                              ? "bg-rose-500/10 text-rose-600"
                              : "bg-amber-500/10 text-amber-600"
                          }`}
                        >
                          {word.type === "missing" ? "脱落" : "ズレ"}
                        </span>
                        <button
                          onClick={() => handleDeleteWord(word.id)}
                          className="p-1 text-muted-foreground hover:text-destructive rounded-lg transition"
                          title="単語帳から削除"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {word.type === "mismatch" && word.spokenWord && (
                      <p className="text-[11px] text-amber-600 dark:text-amber-400 font-mono">
                        認識音: &ldquo;{word.spokenWord}&rdquo;
                      </p>
                    )}

                    {/* Compact Example Sentence with Tap to Expand */}
                    <div
                      onClick={() => toggleWordSentenceExpand(word.id)}
                      className="bg-muted/30 hover:bg-muted/50 p-2.5 rounded-xl border border-border/60 text-xs space-y-1 cursor-pointer transition-colors group/sent"
                      title={expandedWordSentenceIds[word.id] ? "タップで折りたたむ" : "タップで全文を表示"}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <p
                          className={`text-foreground font-medium italic leading-snug break-words ${
                            !expandedWordSentenceIds[word.id] ? "line-clamp-2" : ""
                          }`}
                        >
                          &ldquo;{word.sentence}&rdquo;
                        </p>
                        <span className="text-[10px] text-muted-foreground/60 group-hover/sent:text-primary transition-colors shrink-0 ml-1 mt-0.5 font-bold">
                          {expandedWordSentenceIds[word.id] ? "⌃" : "⌄"}
                        </span>
                      </div>
                      {word.japanese && (
                        <p
                          className={`text-muted-foreground text-[11px] break-words ${
                            !expandedWordSentenceIds[word.id] ? "line-clamp-1" : ""
                          }`}
                        >
                          {word.japanese}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pro Upgrade Banner for Weak Words */}
          {isWordsLimited && (
            <div className="rounded-2xl p-5 sm:p-6 bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <h4 className="font-bold text-base flex items-center justify-center sm:justify-start gap-2">
                  <Lock className="w-4 h-4 text-amber-300" />
                  残りの {totalWeakCount - GUEST_MAX_WEAK_WORDS} 単語がロックされています
                </h4>
                <p className="text-xs text-blue-100">
                  有料会員（Proプラン）にアップグレードすると、過去の全つまずき単語が無制限に蓄積され、克服状態を管理できます。
                </p>
              </div>
              <button
                onClick={() => setShowProModal(true)}
                className="shrink-0 px-5 py-2.5 bg-white text-primary font-bold rounded-xl text-xs hover:bg-white/90 transition shadow-sm"
              >
                Pro プランを見る
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SESSION HISTORY & COACH REVIEW */}
      {activeTab === "history" && (
        <div className="space-y-4">
          {/* History Filters */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-xl text-xs font-medium">
              <button
                onClick={() => setHistoryFilter("all")}
                className={`px-3 py-1.5 rounded-lg transition ${
                  historyFilter === "all" ? "bg-card text-foreground shadow-xs font-bold" : "text-muted-foreground"
                }`}
              >
                すべて ({sessions.length})
              </button>
              <button
                onClick={() => setHistoryFilter("cleared")}
                className={`px-3 py-1.5 rounded-lg transition ${
                  historyFilter === "cleared" ? "bg-card text-foreground shadow-xs font-bold" : "text-muted-foreground"
                }`}
              >
                クリア済み ({sessions.filter((s) => s.isCleared).length})
              </button>
              <button
                onClick={() => setHistoryFilter("needsReview")}
                className={`px-3 py-1.5 rounded-lg transition ${
                  historyFilter === "needsReview" ? "bg-card text-foreground shadow-xs font-bold" : "text-muted-foreground"
                }`}
              >
                要復習 ({sessions.filter((s) => !s.isCleared).length})
              </button>
            </div>

            {isSessionsLimited && (
              <span className="text-xs text-muted-foreground">
                体験版: 直近 {GUEST_MAX_SESSIONS} 件を表示中（全 {totalSessionCount} 件）
              </span>
            )}
          </div>

          {filteredSessions.length === 0 ? (
            <div className="bg-card rounded-2xl p-8 sm:p-12 border border-border text-center space-y-3">
              <p className="text-sm text-muted-foreground">該当する学習履歴がありません。</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSessions.map((session) => {
                const isExpanded = expandedSessionId === session.id;
                const isSentenceExpanded = !!expandedSentenceIds[session.id];
                return (
                  <div
                    key={session.id}
                    className="bg-card rounded-2xl p-4 sm:p-5 border border-border shadow-xs space-y-3 relative"
                  >
                    {/* Header Row: Badges on left, Re-practice & Delete on right */}
                    <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-border/40">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        <span
                          className={`px-2.5 py-0.5 rounded-lg font-bold text-xs ${
                            session.isCleared
                              ? "bg-emerald-500/15 text-emerald-600"
                              : "bg-rose-500/15 text-rose-600"
                          }`}
                        >
                          {session.accuracyScore}% {session.isCleared ? "クリア" : "要復習"}
                        </span>
                        {session.mode === "passage" && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/20">
                            <Crown className="w-3 h-3 fill-amber-500" />
                            長文スピーチ
                          </span>
                        )}
                        {typeof session.wpm === "number" && (
                          <span className="text-[10px] font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full font-mono border border-blue-500/20">
                            {session.wpm} WPM
                          </span>
                        )}
                        <span className="text-[11px] text-muted-foreground">
                          {new Date(session.createdAt).toLocaleDateString("ja-JP", {
                            month: "numeric",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {session.retryCount > 0 && (
                          <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                            リトライ {session.retryCount}回
                          </span>
                        )}
                      </div>

                      {/* Header Right Actions: Re-practice & Delete Button */}
                      <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                        <button
                          onClick={() => handlePracticeSentence(session)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow-xs hover:bg-primary/90 transition cursor-pointer"
                          title="この文を再シャドーイング"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          再練習
                        </button>
                        <button
                          onClick={() => handleDeleteSession(session.id)}
                          className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition cursor-pointer"
                          title="この練習履歴を削除"
                          aria-label="この練習履歴を削除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Sentence Body: spans 100% of card width */}
                    <div className="w-full space-y-1.5">
                      <p
                        className={`text-sm sm:text-base font-semibold text-foreground leading-relaxed break-words w-full ${
                          !isSentenceExpanded ? "line-clamp-2" : ""
                        }`}
                      >
                        {session.sentence}
                      </p>
                      <button
                        type="button"
                        onClick={() => toggleSentenceExpand(session.id)}
                        className="inline-flex items-center gap-0.5 text-[11px] font-bold text-primary hover:underline cursor-pointer"
                      >
                        {isSentenceExpanded ? (
                          <>
                            折りたたむ <ChevronUp className="w-3 h-3" />
                          </>
                        ) : (
                          <>
                            全文を展開 <ChevronDown className="w-3 h-3" />
                          </>
                        )}
                      </button>

                      {session.japanese && (
                        <p className={`text-xs text-muted-foreground break-words w-full ${!isSentenceExpanded ? "line-clamp-1" : ""}`}>
                          {session.japanese}
                        </p>
                      )}
                      <p className={`text-xs text-muted-foreground font-mono break-words w-full ${!isSentenceExpanded ? "truncate" : ""}`}>
                        認識: &ldquo;{session.transcription}&rdquo;
                      </p>
                    </div>

                    {/* Coach Feedback Expandable Accordion */}
                    {session.coachFeedback && (
                      <div className="pt-2 border-t border-border">
                        <button
                          onClick={() =>
                            setExpandedSessionId(isExpanded ? null : session.id)
                          }
                          className="w-full flex items-center justify-between text-xs font-semibold text-blue-600 dark:text-blue-400 py-1 hover:opacity-80"
                        >
                          <span className="flex items-center gap-1.5">
                            <GraduationCap className="w-4 h-4" />
                            当時のAIコーチ指導レビュー
                          </span>
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>

                        {isExpanded && (
                          <div className="mt-2.5 p-3.5 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 rounded-xl space-y-2 text-xs leading-relaxed animate-in fade-in-50">
                            <p className="font-medium text-foreground">
                              {session.coachFeedback.overallComment}
                            </p>
                            <p className="text-muted-foreground">
                              {session.coachFeedback.pronunciationAdvice}
                            </p>
                            {session.coachFeedback.pacingAdvice && (
                              <p className="text-blue-700 dark:text-blue-300 font-medium">
                                ⏱️ {session.coachFeedback.pacingAdvice}
                              </p>
                            )}
                            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-900 dark:text-amber-200 flex items-center gap-2">
                              <Lightbulb className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span>{session.coachFeedback.retryFocusPoint}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Pro Upgrade Banner for Sessions */}
          {isSessionsLimited && (
            <div className="rounded-2xl p-5 sm:p-6 bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <h4 className="font-bold text-base flex items-center justify-center sm:justify-start gap-2">
                  <Lock className="w-4 h-4 text-amber-300" />
                  残りの {totalSessionCount - GUEST_MAX_SESSIONS} 件の履歴がロックされています
                </h4>
                <p className="text-xs text-blue-100">
                  Proプランなら過去の全シャドーイング履歴とAIコーチの助言をいつでも読み返せます。
                </p>
              </div>
              <button
                onClick={() => setShowProModal(true)}
                className="shrink-0 px-5 py-2.5 bg-white text-primary font-bold rounded-xl text-xs hover:bg-white/90 transition shadow-sm"
              >
                Pro プランを見る
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ANALYTICS & PRO PREVIEW */}
      {activeTab === "analytics" && (
        <div className="space-y-5">
          <div className="bg-card rounded-2xl p-6 border border-border shadow-xs space-y-4">
            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              学習進捗＆クリア率
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span>総合クリア率 (80%以上達成)</span>
                <span className="font-mono text-primary">
                  {totalSessionCount > 0 ? Math.round((clearedCount / totalSessionCount) * 100) : 0}%
                </span>
              </div>
              <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${totalSessionCount > 0 ? (clearedCount / totalSessionCount) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Pro Feature Comparison Card */}
          <div className="bg-card rounded-2xl p-6 sm:p-8 border-2 border-primary/20 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600 border border-amber-500/30">
                  有料会員プラン
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-foreground mt-1">
                  ShadowLog Pro で英語力を最大化
                </h3>
              </div>
              <Crown className="w-8 h-8 text-amber-500 shrink-0" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
              <div className="p-3 rounded-xl bg-muted/40 border border-border flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>つまずき単語帳の無制限蓄積:</strong> 何語でも記録し、克服まで追跡</span>
              </div>
              <div className="p-3 rounded-xl bg-muted/40 border border-border flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>全練習履歴＆コーチ指導の無制限保存:</strong> 過去の全アドバイスを復習</span>
              </div>
              <div className="p-3 rounded-xl bg-muted/40 border border-border flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>PC・スマホ間の自動同期:</strong> クラウド連携でどこでも学習カルテを共有</span>
              </div>
              <div className="p-3 rounded-xl bg-muted/40 border border-border flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>苦手な音・リンキングの弱点分析:</strong> 音声変化の傾向を可視化</span>
              </div>
            </div>

            {/* Test Plan Toggle */}
            <div className="p-4 rounded-xl bg-muted/60 border border-border flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-foreground">プラン切り替え（動作確認用）</p>
                <p className="text-[11px] text-muted-foreground">
                  現在のステータス: <span className="font-bold text-primary">{plan === "pro" ? "Pro会員 (無制限)" : "体験版 (制限あり)"}</span>
                </p>
              </div>
              <button
                onClick={handleTogglePlan}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition shadow-xs"
              >
                {plan === "pro" ? "体験版に戻す" : "Pro会員に切り替える（制限解除）"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pro Modal */}
      {showProModal && mounted && createPortal(
        <div
          onClick={() => setShowProModal(false)}
          className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in-50"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-card w-full max-w-md rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-border shadow-2xl space-y-5 relative my-auto max-h-[90vh] overflow-y-auto"
          >
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500">
                <Crown className="w-7 h-7" />
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold text-foreground">
                ShadowLog Pro にアップグレード
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                体験版の制限を解除し、つまずき単語帳やAIコーチの復習ログを無制限に活用しましょう。
              </p>
            </div>

            <div className="space-y-2.5 text-xs text-foreground bg-muted/30 p-4 rounded-2xl border border-border">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>つまずき単語帳の無制限蓄積・復習</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>過去の全セッション＆AIコーチ指導を読み返し</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>PCとスマホのクラウド完全同期</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={handleTogglePlan}
                className="w-full py-3.5 bg-primary text-primary-foreground font-bold rounded-xl text-sm shadow-md hover:bg-primary/90 transition"
              >
                Pro プランを有効化する（デモ切り替え）
              </button>
              <button
                onClick={() => setShowProModal(false)}
                className="w-full py-2.5 text-xs text-muted-foreground hover:text-foreground transition"
              >
                今は体験版のまま続ける
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
