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
  getPlanType,
  setPlanType,
} from "@/lib/storage/user-learning-store";
import {
  ArrowRight,
  BookOpen,
  Lightbulb,
  RotateCcw,
  Crown,
  Sparkles,
  Check,
} from "lucide-react";

export default function PracticePage() {
  const [industry, setIndustry] = useState<Industry>("tech");
  const [level, setLevel] = useState<DifficultyLevel>("intermediate");
  const [practiceMode, setPracticeMode] = useState<PracticeMode>("sentence");
  const [plan, setPlan] = useState<UserPlanType>("guest");
  const [showProModal, setShowProModal] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

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

  // Sync current user plan from storage
  useEffect(() => {
    setPlan(getPlanType());
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

  // Switch practice mode (sentence vs passage)
  const handleModeChange = (targetMode: PracticeMode) => {
    if (targetMode === "passage") {
      const currentPlan = getPlanType();
      if (currentPlan !== "pro") {
        setShowProModal(true);
        return;
      }
    }
    setPracticeMode(targetMode);
    fetchNewSentence(undefined, undefined, targetMode);
  };

  // Toggle plan from Pro modal
  const handleEnableProPlan = () => {
    setPlanType("pro");
    setPlan("pro");
    setShowProModal(false);
    setPracticeMode("passage");
    fetchNewSentence(undefined, undefined, "passage");
  };

  // Load preferences from localStorage on mount and fetch initial sentence ONCE with saved settings
  useEffect(() => {
    let savedInd: Industry = "tech";
    let savedLvl: DifficultyLevel = "intermediate";

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
        setIsInitialized(true);
        return;
      }
    }

    try {
      const storedInd = localStorage.getItem("shadowlog_industry") as Industry;
      const storedLvl = localStorage.getItem("shadowlog_level") as DifficultyLevel;
      if (storedInd) {
        savedInd = storedInd;
        setIndustry(storedInd);
      }
      if (storedLvl) {
        savedLvl = storedLvl;
        setLevel(storedLvl);
      }
    } catch {
      // localStorage may fail in restricted environments
    }

    setIsInitialized(true);
    // Fetch initial sentence using the explicitly loaded preferences (avoids race condition)
    fetchNewSentence(savedInd, savedLvl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      recordPracticeSession({
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

      // 2. Save stats to API / Supabase
      const res = await fetch("/api/stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
            模範音声を聴きながら同時に発話して、正確な英語の音とリズムを身につけましょう。
          </p>
        </div>

        {/* Mode Switcher Tabs & Plan Status */}
        <div className="flex items-center gap-2 flex-wrap">
          {plan === "pro" ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
              <Crown className="w-3.5 h-3.5 fill-amber-500" />
              Pro
            </span>
          ) : (
            <button
              onClick={() => setShowProModal(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition"
              title="Proプラン詳細"
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
            {practiceMode === "passage" ? "長文スピーチ原稿・模範音声" : "例文確認・模範音声"}
          </div>
          {retryCount > 0 && (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
              <RotateCcw className="w-3 h-3" />
              復習中 ({retryCount}回目)
            </span>
          )}
        </div>

        <SentenceCard
          sentence={sentence}
          isLoading={!isInitialized || isLoadingSentence}
          onRefresh={() => fetchNewSentence()}
        />
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
            <span>{practiceMode === "passage" ? "次の長文スピーチへ" : "次の例文へ"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Pro Modal */}
      {showProModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in-50">
          <div className="bg-card w-full max-w-md rounded-3xl p-6 sm:p-8 border border-border shadow-2xl space-y-5 relative">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500">
                <Crown className="w-7 h-7" />
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold text-foreground">
                長文スピーチモード (Pro専用)
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                60〜100語の実践的なプレゼン原稿を通しでシャドーイングし、話速（WPM）や息継ぎをプロレベルに引き上げましょう。
              </p>
            </div>

            <div className="space-y-2.5 text-xs text-foreground bg-muted/30 p-4 rounded-2xl border border-border">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>60〜100語のプレゼン・スピーチ長文通し発話</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>話速 WPM（Words Per Minute）のリアルタイム測定</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>息継ぎ（チャンキング）＆スタミナ維持のAI指導</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>つまずき単語帳＆学習履歴の無制限保存</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={handleEnableProPlan}
                className="w-full py-3.5 bg-primary text-primary-foreground font-bold rounded-xl text-sm shadow-md hover:bg-primary/90 transition"
              >
                Pro プランを有効化して長文モードを試す
              </button>
              <button
                onClick={() => setShowProModal(false)}
                className="w-full py-2.5 text-xs text-muted-foreground hover:text-foreground transition"
              >
                今は短文モードを続ける
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
