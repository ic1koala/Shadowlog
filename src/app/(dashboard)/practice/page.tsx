"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { SentenceCard } from "@/components/features/practice/SentenceCard";
import { AudioRecorder } from "@/components/features/practice/AudioRecorder";
import { DiffViewer } from "@/components/features/practice/DiffViewer";
import {
  DiffResult,
  DifficultyLevel,
  Industry,
  SentenceResponse,
  TranscribeDiffResponse,
  CoachFeedback,
  PracticeMode,
  WPMInfo,
  UserPlanType,
} from "@/types";
import {
  recordPracticeSession,
  setPlanType,
} from "@/lib/storage/user-learning-store";
import {
  getTicketStatus,
  consumeTicket,
  TicketStatus,
  getCurrentUserEmail,
} from "@/lib/storage/ticket-store";
import { UpgradeModal } from "@/components/features/subscription/UpgradeModal";
import {
  ArrowRight,
  BookOpen,
  Lightbulb,
  RotateCcw,
  Crown,
  Sparkles,
} from "lucide-react";

export default function PracticePage() {
  const [industry, setIndustry] = useState<Industry>("tech");
  const [level, setLevel] = useState<DifficultyLevel>("intermediate");
  const [practiceMode, setPracticeMode] = useState<PracticeMode>("sentence");
  const [plan, setPlan] = useState<UserPlanType>("guest");
  const [showProModal, setShowProModal] = useState(false);
  const [ticketStatus, setTicketStatus] = useState<TicketStatus | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [upgradeSuccess, setUpgradeSuccess] = useState<string | null>(null);

  const [sentence, setSentence] = useState<SentenceResponse | null>(null);
  const [isLoadingSentence, setIsLoadingSentence] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [diffResult, setDiffResult] = useState<DiffResult | null>(null);
  const [transcription, setTranscription] = useState("");
  const [coachFeedback, setCoachFeedback] = useState<CoachFeedback | undefined>(undefined);
  const [wpmInfo, setWpmInfo] = useState<WPMInfo | undefined>(undefined);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [activeRetryTip, setActiveRetryTip] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recorderSectionRef = useRef<HTMLDivElement | null>(null);
  const activeRequestIdRef = useRef<number>(0);

  // Sync current user plan and tickets from storage
  useEffect(() => {
    const s = getTicketStatus();
    setTicketStatus(s);
    setPlan(s.plan);
    setUserEmail(getCurrentUserEmail());

    // Check URL search params for Stripe success
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("upgrade") === "success") {
        const upgradedPlan = urlParams.get("plan") || "pro";
        setPlanType(upgradedPlan as UserPlanType);
        setPlan(upgradedPlan as UserPlanType);
        setUpgradeSuccess(`🎉 ${upgradedPlan === "pro" ? "Proプラン" : "ベースプラン"} へのアップグレードが完了しました！`);
        const updatedStatus = getTicketStatus();
        setTicketStatus(updatedStatus);
        window.dispatchEvent(new Event("shadowlog:ticket-update"));

        // Clean up URL parameters so refresh doesn't trigger repeatedly
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, "", cleanUrl);
      }
    }
  }, []);

  const fetchNewSentence = useCallback(
    async (
      overrideIndustry?: Industry,
      overrideLevel?: DifficultyLevel,
      overrideMode?: PracticeMode
    ) => {
      const targetIndustry = overrideIndustry || industry;
      const targetLevel = overrideLevel || level;
      const targetMode = overrideMode || practiceMode;

      // Check ticket limits before generating
      const currentStatus = getTicketStatus();
      setTicketStatus(currentStatus);

      if (targetMode === "sentence" && !currentStatus.canPracticeShort) {
        setShowProModal(true);
        return;
      }
      if (targetMode === "passage" && !currentStatus.canPracticePro) {
        setShowProModal(true);
        return;
      }

      const requestId = ++activeRequestIdRef.current;
      setIsLoadingSentence(true);
      setDiffResult(null);
      setTranscription("");
      setCoachFeedback(undefined);
      setWpmInfo(undefined);
      setRetryCount(0);
      setActiveRetryTip(null);
      setIsSaved(false);
      setErrorMessage(null);

      try {
        const res = await fetch("/api/generate-sentence", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            industry: targetIndustry,
            level: targetLevel,
            mode: targetMode,
          }),
        });

        // Ignore response if a newer request has been triggered
        if (requestId !== activeRequestIdRef.current) return;

        if (!res.ok) {
          throw new Error(`英文の生成に失敗しました (status: ${res.status})`);
        }

        const data: SentenceResponse = await res.json();
        if (requestId === activeRequestIdRef.current) {
          setSentence(data);
        }
      } catch (err: unknown) {
        if (requestId === activeRequestIdRef.current) {
          const msg = err instanceof Error ? err.message : "英文生成中にエラーが発生しました";
          setErrorMessage(msg);
        }
      } finally {
        if (requestId === activeRequestIdRef.current) {
          setIsLoadingSentence(false);
        }
      }
    },
    [industry, level, practiceMode]
  );

const INDUSTRY_OPTIONS: Array<{ key: Industry; label: string }> = [
  { key: "tech", label: "Tech / IT" },
  { key: "business", label: "Business (ビジネス全般)" },
  { key: "finance", label: "Finance (金融・財務)" },
  { key: "medical", label: "Medical (医療・バイオ)" },
  { key: "marketing", label: "Marketing (マーケティング)" },
  { key: "daily", label: "Daily (日常・一般)" },
];

const LEVEL_OPTIONS: Array<{ key: DifficultyLevel; label: string }> = [
  { key: "beginner", label: "初級 (6〜10語)" },
  { key: "intermediate", label: "中級 (12〜18語)" },
  { key: "advanced", label: "上級 (20語〜)" },
];

  // Switch practice mode (sentence vs passage)
  const handleModeChange = (targetMode: PracticeMode) => {
    const currentStatus = getTicketStatus();
    setTicketStatus(currentStatus);

    if (targetMode === "passage") {
      if (!currentStatus.canPracticePro) {
        setShowProModal(true);
        return;
      }
    } else {
      if (!currentStatus.canPracticeShort) {
        setShowProModal(true);
        return;
      }
    }

    setPracticeMode(targetMode);
    if (sentence) {
      fetchNewSentence(undefined, undefined, targetMode);
    }
  };

  const handleIndustryChange = (newInd: Industry) => {
    setIndustry(newInd);
    try {
      localStorage.setItem("shadowlog_industry", newInd);
    } catch {}
  };

  const handleLevelChange = (newLvl: DifficultyLevel) => {
    setLevel(newLvl);
    try {
      localStorage.setItem("shadowlog_level", newLvl);
    } catch {}
  };

  // Load preferences from localStorage on mount (DO NOT auto-generate sentence to prevent token waste)
  useEffect(() => {
    // Check URL search params for direct review repetition
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const retryText = urlParams.get("retryText");
      const retryJa = urlParams.get("retryJa");
      const indParam = urlParams.get("industry") as Industry;
      const lvlParam = urlParams.get("level") as DifficultyLevel;
      const modeParam = urlParams.get("mode") as PracticeMode;

      if (retryText) {
        const ind = indParam || "tech";
        const lvl = lvlParam || "intermediate";
        const mode = modeParam === "passage" ? "passage" : "sentence";
        setIndustry(ind);
        setLevel(lvl);
        setPracticeMode(mode);
        setSentence({
          id: `review-${Date.now()}`,
          english: decodeURIComponent(retryText),
          japanese: retryJa ? decodeURIComponent(retryJa) : "",
          wordCount: decodeURIComponent(retryText).trim().split(/\s+/).length,
          industry: ind,
          level: lvl,
          mode: mode,
        });
        return;
      }
    }

    try {
      const storedInd = localStorage.getItem("shadowlog_industry") as Industry;
      const storedLvl = localStorage.getItem("shadowlog_level") as DifficultyLevel;
      if (storedInd) {
        setIndustry(storedInd);
      }
      if (storedLvl) {
        setLevel(storedLvl);
      }
    } catch {
      // localStorage may fail in restricted environments
    }

    // Intentionally omitted fetchNewSentence: User clicks "この条件で生成開始"
  }, []); // Run ONCE on mount

  const handleAudioReady = async (audioBlob: Blob, durationSeconds: number) => {
    if (!sentence) return;

    setIsTranscribing(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      // Determine correct file extension from MIME type (iOS Safari uses audio/mp4)
      const mimeType = audioBlob.type || "audio/webm";
      const ext = mimeType.includes("mp4") ? "mp4" : mimeType.includes("aac") ? "aac" : "webm";
      formData.append("audio", audioBlob, `recording.${ext}`);
      formData.append("originalText", sentence.english);
      formData.append("durationSeconds", String(durationSeconds));
      formData.append("mode", practiceMode);

      const res = await fetch("/api/transcribe-diff", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "文字起こし・判定に失敗しました。");
      }

      const data: TranscribeDiffResponse = await res.json();
      setTranscription(data.transcription);
      setDiffResult(data.diff);
      setCoachFeedback(data.coachFeedback);
      setWpmInfo(data.wpmInfo);

      // Consume ticket upon successful analysis and notify components
      consumeTicket(practiceMode === "passage" ? "long" : "short");
      const updatedStatus = getTicketStatus();
      setTicketStatus(updatedStatus);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("shadowlog:ticket-update"));
      }

      // Auto-save session immediately so dashboard/stats are updated without manual button click
      try {
        setIsSaving(true);
        const saved = recordPracticeSession({
          sentence: sentence.english,
          japanese: sentence.japanese,
          transcription: data.transcription,
          industry,
          level,
          wordCount: data.diff.originalWordCount,
          matchedWordCount: data.diff.matchedWordCount,
          accuracyScore: data.diff.accuracyScore,
          retryCount,
          diff: data.diff,
          coachFeedback: data.coachFeedback,
          mode: practiceMode,
          wpm: data.wpmInfo?.wpm,
        });

        await fetch("/api/stats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: saved.session.id,
            sentence: sentence.english,
            transcription: data.transcription,
            wordCount: data.diff.originalWordCount,
            matchedWordCount: data.diff.matchedWordCount,
            accuracyScore: data.diff.accuracyScore,
          }),
        });

        setIsSaved(true);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("shadowlog:session-update"));
        }
      } catch (saveErr) {
        console.warn("Auto-save session failed:", saveErr);
      } finally {
        setIsSaving(false);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "音声解析エラーが発生しました";
      setErrorMessage(msg);
    } finally {
      setIsTranscribing(false);
    }
  };

  // Handler for retry/repeat review on the same sentence
  const handleRetry = () => {
    if (coachFeedback?.retryFocusPoint) {
      setActiveRetryTip(coachFeedback.retryFocusPoint);
    }
    setDiffResult(null);
    setTranscription("");
    setWpmInfo(undefined);
    setIsSaved(false);
    setRetryCount((prev) => prev + 1);

    // Smooth scroll to recording section
    setTimeout(() => {
      recorderSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  };

  const handleSaveSession = async () => {
    if (!sentence || !diffResult) return;

    setIsSaving(true);
    try {
      // 1. Save to user learning store (records weak words and stored session)
      const saved = recordPracticeSession({
        sentence: sentence.english,
        japanese: sentence.japanese,
        transcription,
        industry,
        level,
        wordCount: diffResult.originalWordCount,
        matchedWordCount: diffResult.matchedWordCount,
        accuracyScore: diffResult.accuracyScore,
        retryCount,
        diff: diffResult,
        coachFeedback,
        mode: practiceMode,
        wpm: wpmInfo?.wpm,
      });

      // 2. Save stats to API / Supabase with the same session id to prevent duplicate counts
      const res = await fetch("/api/stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: saved.session.id,
          sentence: sentence.english,
          transcription,
          wordCount: diffResult.originalWordCount,
          matchedWordCount: diffResult.matchedWordCount,
          accuracyScore: diffResult.accuracyScore,
        }),
      });

      if (!res.ok) {
        throw new Error("記録の保存に失敗しました");
      }
      setIsSaved(true);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("shadowlog:session-update"));
      }
    } catch (err: unknown) {
      console.error(err);
      alert("学習記録の保存に失敗しました。時間をおいて再試行してください。");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5 sm:space-y-8 pb-8 sm:pb-16">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BookOpen className="w-5 h-5 sm:w-7 sm:h-7 text-primary" />
            シャドーイング実践
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            フレーズ音声を聴きながら同時に発話して、正確な英語の音とリズムを身につけましょう。
          </p>
        </div>

        {/* Mode Switcher Tabs & Plan Status */}
        <div className="flex items-center gap-2 flex-wrap">
          {plan === "pro" ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
              <Crown className="w-3.5 h-3.5 fill-amber-500" />
              Pro
            </span>
          ) : plan === "base" ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              Base
            </span>
          ) : (
            <button
              onClick={() => setShowProModal(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition"
              title="プラン詳細"
            >
              <Sparkles className="w-3.5 h-3.5" />
              体験版
            </button>
          )}

          <div className="flex items-center bg-muted/60 p-1 rounded-2xl border border-border text-xs font-semibold">
            <button
              onClick={() => handleModeChange("sentence")}
              className={`px-3.5 py-2 rounded-xl transition ${
                practiceMode === "sentence"
                  ? "bg-card text-foreground shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              短文モード (1文)
            </button>
            <button
              onClick={() => handleModeChange("passage")}
              className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
                practiceMode === "passage"
                  ? "bg-primary text-primary-foreground shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              長文スピーチ (Pro)
            </button>
          </div>
        </div>
      </div>

      {/* Global Error Banner */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center justify-between">
          <p>{errorMessage}</p>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-xs underline font-medium hover:opacity-80"
          >
            閉じる
          </button>
        </div>
      )}

      {/* Step 1: Sentence / Passage Card */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">
              1
            </span>
            {practiceMode === "passage" ? "長文スピーチ原稿・フレーズ音声" : "フレーズ確認・フレーズ音声"}
          </div>
          {retryCount > 0 && (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
              <RotateCcw className="w-3 h-3" />
              復習中 ({retryCount}回目)
            </span>
          )}
        </div>

        {!sentence ? (
          <div className="w-full bg-card rounded-2xl p-5 sm:p-7 border border-border shadow-xs space-y-5 animate-in fade-in-50">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold text-[11px]">
                  設定読み込み済み
                </span>
                <span className="text-xs text-muted-foreground">
                  {practiceMode === "passage" ? "長文スピーチ（60〜90語）" : "短文シャドーイング（1文）"}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-foreground pt-0.5">
                シャドーイングフレーズの生成
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                保存されている業種・難易度設定を読み込みました。条件を確認し、「この条件で生成開始」ボタンを押してください。
              </p>
            </div>

            {/* Condition Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  業種・ジャンル
                </label>
                <select
                  value={industry}
                  onChange={(e) => handleIndustryChange(e.target.value as Industry)}
                  className="w-full p-2.5 rounded-xl border border-border bg-background text-xs sm:text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                >
                  {INDUSTRY_OPTIONS.map((opt) => (
                    <option key={opt.key} value={opt.key}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  難易度
                </label>
                <select
                  value={level}
                  onChange={(e) => handleLevelChange(e.target.value as DifficultyLevel)}
                  className="w-full p-2.5 rounded-xl border border-border bg-background text-xs sm:text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                >
                  {LEVEL_OPTIONS.map((opt) => (
                    <option key={opt.key} value={opt.key}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Start Generation Button */}
            <div className="pt-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-border">
              <div className="text-xs text-muted-foreground">
                選択中: <span className="font-bold text-foreground">{INDUSTRY_OPTIONS.find((i) => i.key === industry)?.label}</span> /{" "}
                <span className="font-bold text-foreground">{LEVEL_OPTIONS.find((l) => l.key === level)?.label}</span>
              </div>
              <button
                onClick={() => fetchNewSentence(industry, level, practiceMode)}
                disabled={isLoadingSentence}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-bold text-sm rounded-xl hover:bg-primary/90 transition shadow-sm hover:shadow-md disabled:opacity-50 min-h-[46px]"
              >
                {isLoadingSentence ? (
                  <>
                    <span className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    フレーズを生成中...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    この条件で生成開始
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {/* Quick condition bar when sentence is active */}
            <div className="flex items-center justify-between px-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span>設定:</span>
                <span className="font-bold text-foreground">
                  {INDUSTRY_OPTIONS.find((i) => i.key === industry)?.label}
                </span>
                <span>/</span>
                <span className="font-bold text-foreground">
                  {LEVEL_OPTIONS.find((l) => l.key === level)?.label}
                </span>
              </div>
              <button
                onClick={() => {
                  setSentence(null);
                  setDiffResult(null);
                  setTranscription("");
                  setWpmInfo(undefined);
                }}
                className="text-primary hover:underline font-bold text-xs"
              >
                条件を変更する
              </button>
            </div>

            <SentenceCard
              sentence={sentence}
              isLoading={isLoadingSentence}
              onRefresh={() => fetchNewSentence()}
            />
          </div>
        )}
      </section>

      {/* Step 2: Audio Recorder */}
      {sentence && (
        <section ref={recorderSectionRef} className="space-y-2 sm:space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">
              2
            </span>
            {practiceMode === "passage" ? "長文通しシャドーイング録音" : "シャドーイング録音"}
          </div>

          {/* Active Retry Coach Tip */}
          {activeRetryTip && !diffResult && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs sm:text-sm animate-in fade-in-50">
              <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold mr-1">前回のコーチアドバイス:</span>
                <span>{activeRetryTip}</span>
              </div>
            </div>
          )}

          <AudioRecorder
            onAudioReady={handleAudioReady}
            isTranscribing={isTranscribing}
            disabled={isLoadingSentence}
          />
        </section>
      )}

      {/* Step 3: Diff Result & AI Coach Review */}
      {diffResult && (
        <section className="space-y-2 sm:space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">
              3
            </span>
            {practiceMode === "passage" ? "長文総合診断＆話速レポート" : "判定＆英会話コーチレビュー"}
          </div>
          <DiffViewer
            diff={diffResult}
            transcription={transcription}
            coachFeedback={coachFeedback}
            wpmInfo={wpmInfo}
            mode={practiceMode}
            onSaveSession={handleSaveSession}
            onRetry={handleRetry}
            isSaving={isSaving}
            isSaved={isSaved}
            retryCount={retryCount}
          />
        </section>
      )}

      {/* Next Sentence Button */}
      {sentence && diffResult && (
        <div className="flex justify-end pt-2">
          <button
            onClick={() => fetchNewSentence()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 sm:py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition shadow-sm min-h-[48px] text-sm"
          >
            <span>{practiceMode === "passage" ? "次の長文スピーチへ" : "次のフレーズへ"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Upgrade Success Notification */}
      {upgradeSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold flex items-center justify-between shadow-sm">
          <span>{upgradeSuccess}</span>
          <button
            onClick={() => setUpgradeSuccess(null)}
            className="text-xs text-emerald-600 hover:text-emerald-800 underline"
          >
            閉じる
          </button>
        </div>
      )}

      {/* Upgrade Modal */}
      {ticketStatus && (
        <UpgradeModal
          isOpen={showProModal}
          onClose={() => setShowProModal(false)}
          ticketStatus={ticketStatus}
          userEmail={userEmail}
        />
      )}
    </div>
  );
}
