"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SentenceCard } from "@/components/features/practice/SentenceCard";
import { AudioRecorder } from "@/components/features/practice/AudioRecorder";
import { DiffViewer } from "@/components/features/practice/DiffViewer";
import {
  ASSESSMENT_PLAN,
  calculateAssessmentResult,
  AssessmentAnswer,
  AssessmentResult,
} from "@/lib/assessment/assessment-engine";
import {
  DiffResult,
  SentenceResponse,
  TranscribeDiffResponse,
} from "@/types";
import {
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  Flame,
  Target,
  TrendingUp,
  X,
} from "lucide-react";

const LEVEL_LABELS = {
  beginner: { label: "初級 (Beginner)", color: "text-emerald-600", bg: "bg-emerald-500/15 border-emerald-500/30" },
  intermediate: { label: "中級 (Intermediate)", color: "text-blue-600", bg: "bg-blue-500/15 border-blue-500/30" },
  advanced: { label: "上級 (Advanced)", color: "text-purple-600", bg: "bg-purple-500/15 border-purple-500/30" },
};

export default function AssessmentPage() {
  const router = useRouter();

  // Assessment state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<AssessmentAnswer[]>([]);
  const [result, setResult] = useState<AssessmentResult | null>(null);

  // Per-question state
  const [sentence, setSentence] = useState<SentenceResponse | null>(null);
  const [isLoadingSentence, setIsLoadingSentence] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [diffResult, setDiffResult] = useState<DiffResult | null>(null);
  const [transcription, setTranscription] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const currentQuestion = ASSESSMENT_PLAN[currentIndex];
  const totalQuestions = ASSESSMENT_PLAN.length;
  const isComplete = result !== null;

  // Fetch sentence for current question
  const fetchSentence = useCallback(async () => {
    if (!currentQuestion) return;

    setIsLoadingSentence(true);
    setDiffResult(null);
    setTranscription("");
    setErrorMessage(null);

    try {
      const res = await fetch("/api/generate-sentence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          industry: "daily",
          level: currentQuestion.level,
        }),
      });

      if (!res.ok) throw new Error("例文の生成に失敗しました");
      const data: SentenceResponse = await res.json();
      setSentence(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "例文生成エラー";
      setErrorMessage(msg);
    } finally {
      setIsLoadingSentence(false);
    }
  }, [currentQuestion]);

  // Load first question on mount
  useEffect(() => {
    fetchSentence();
  }, [fetchSentence]);

  // Handle audio recording result
  const handleAudioReady = async (audioBlob: Blob) => {
    if (!sentence) return;
    setIsTranscribing(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      const mimeType = audioBlob.type || "audio/webm";
      const ext = mimeType.includes("mp4") ? "mp4" : mimeType.includes("aac") ? "aac" : "webm";
      formData.append("audio", audioBlob, `recording.${ext}`);
      formData.append("originalText", sentence.english);

      const res = await fetch("/api/transcribe-diff", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "文字起こしに失敗しました");
      }

      const data: TranscribeDiffResponse = await res.json();
      setTranscription(data.transcription);
      setDiffResult(data.diff);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "音声解析エラー";
      setErrorMessage(msg);
    } finally {
      setIsTranscribing(false);
    }
  };

  // Proceed to next question or finish
  const handleNext = () => {
    if (!diffResult || !currentQuestion || !sentence) return;

    const answer: AssessmentAnswer = {
      questionNumber: currentQuestion.questionNumber,
      level: currentQuestion.level,
      accuracyScore: diffResult.accuracyScore,
      matchedWordCount: diffResult.matchedWordCount,
      wordCount: diffResult.originalWordCount,
    };

    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);

    if (currentIndex + 1 >= totalQuestions) {
      // Assessment complete
      const assessmentResult = calculateAssessmentResult(newAnswers);
      setResult(assessmentResult);

      // Save recommended level to localStorage
      try {
        localStorage.setItem("shadowlog_level", assessmentResult.recommendedLevel);
        localStorage.setItem("shadowlog_assessment_date", new Date().toISOString());
        localStorage.setItem("shadowlog_assessment_result", JSON.stringify(assessmentResult));
      } catch {
        // ignore localStorage errors
      }
    } else {
      // Next question
      setCurrentIndex(currentIndex + 1);
      setSentence(null);
      setDiffResult(null);
      setTranscription("");
    }
  };

  // Cancel assessment
  const handleCancel = () => {
    router.push("/settings");
  };

  // Apply result and go to settings
  const handleApplyResult = () => {
    router.push("/settings");
  };

  // Result screen
  if (isComplete && result) {
    const recLevel = LEVEL_LABELS[result.recommendedLevel];
    return (
      <div className="max-w-2xl mx-auto space-y-6 pb-16 sm:pb-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
            <Award className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            レベル判定完了！
          </h1>
          <p className="text-sm text-muted-foreground">
            10問のテスト結果から、あなたに最適なレベルを判定しました。
          </p>
        </div>

        {/* Recommended Level */}
        <div className="bg-card rounded-2xl p-6 sm:p-8 border border-border shadow-sm text-center space-y-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            あなたの推奨レベル
          </p>
          <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-2xl border text-xl font-bold ${recLevel.bg} ${recLevel.color}`}>
            <Target className="w-6 h-6" />
            {recLevel.label}
          </div>
          <p className="text-sm text-muted-foreground">
            設定に自動反映済みです。いつでも変更できます。
          </p>
        </div>

        {/* Score Breakdown */}
        <div className="bg-card rounded-2xl p-5 sm:p-8 border border-border shadow-sm space-y-5">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            レベル別スコア
          </h3>

          <div className="grid grid-cols-3 gap-3">
            {(["beginner", "intermediate", "advanced"] as const).map((level) => {
              const avg = level === "beginner" ? result.beginnerAvg
                : level === "intermediate" ? result.intermediateAvg
                : result.advancedAvg;
              const info = LEVEL_LABELS[level];
              const isRecommended = level === result.recommendedLevel;
              return (
                <div
                  key={level}
                  className={`text-center p-3 sm:p-4 rounded-xl border transition ${
                    isRecommended ? `${info.bg} ring-2 ring-primary/20` : "border-border"
                  }`}
                >
                  <p className="text-[11px] sm:text-xs text-muted-foreground font-medium mb-1">
                    {level === "beginner" ? "初級" : level === "intermediate" ? "中級" : "上級"}
                  </p>
                  <p className={`text-2xl sm:text-3xl font-extrabold font-mono ${
                    avg >= 70 ? "text-emerald-600" : avg >= 50 ? "text-amber-600" : "text-rose-600"
                  }`}>
                    {avg}%
                  </p>
                  {isRecommended && (
                    <p className="text-[10px] font-bold text-primary mt-1">★ 推奨</p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Per-question detail */}
          <div className="space-y-2 pt-2 border-t border-border">
            <p className="text-xs font-semibold text-muted-foreground">各問スコア</p>
            <div className="flex flex-wrap gap-2">
              {result.answers.map((a) => (
                <div
                  key={a.questionNumber}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium ${
                    a.accuracyScore >= 70
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700"
                      : a.accuracyScore >= 50
                      ? "bg-amber-500/10 border-amber-500/30 text-amber-700"
                      : "bg-rose-500/10 border-rose-500/30 text-rose-700"
                  }`}
                >
                  <span className="opacity-60">Q{a.questionNumber}</span>
                  <span className="font-bold">{a.accuracyScore}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center pt-2">
            <p className="text-sm font-semibold text-foreground">
              総合スコア: <span className="text-primary text-lg font-mono">{result.overallAvg}%</span>
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={handleApplyResult}
            className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition shadow-sm min-h-[48px]"
          >
            <CheckCircle2 className="w-5 h-5" />
            設定画面に戻る
          </button>
          <button
            onClick={() => router.push("/practice")}
            className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-secondary text-secondary-foreground font-bold rounded-xl hover:bg-secondary/80 transition min-h-[48px]"
          >
            <Flame className="w-5 h-5" />
            早速練習を始める
          </button>
        </div>
      </div>
    );
  }

  // Test flow screen
  const progressPercent = (currentIndex / totalQuestions) * 100;
  const levelLabel = currentQuestion
    ? currentQuestion.level === "beginner" ? "初級"
      : currentQuestion.level === "intermediate" ? "中級"
      : "上級"
    : "";

  return (
    <div className="max-w-3xl mx-auto space-y-5 sm:space-y-6 pb-16 sm:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-foreground flex items-center gap-2">
            <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            レベル判定テスト
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            10問の英語シャドーイングであなたの実力を測定します
          </p>
        </div>
        <button
          onClick={handleCancel}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition min-h-[44px] min-w-[44px] flex items-center justify-center"
          title="テストを中断"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-medium">
          <div className="flex items-center gap-2">
            <span className="text-foreground">
              Q{currentIndex + 1} / {totalQuestions}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
              LEVEL_LABELS[currentQuestion?.level || "beginner"].bg
            } ${LEVEL_LABELS[currentQuestion?.level || "beginner"].color}`}>
              {levelLabel}
            </span>
          </div>
          <span className="text-muted-foreground">{Math.round(progressPercent)}%</span>
        </div>
        <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        {/* Question dots */}
        <div className="flex items-center gap-1 justify-center pt-1">
          {ASSESSMENT_PLAN.map((q, i) => (
            <div
              key={q.questionNumber}
              className={`w-2 h-2 rounded-full transition-all ${
                i < currentIndex
                  ? answers[i] && answers[i].accuracyScore >= 60
                    ? "bg-emerald-500"
                    : "bg-rose-400"
                  : i === currentIndex
                  ? "bg-primary w-3 h-3"
                  : "bg-muted-foreground/30"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs sm:text-sm flex items-center justify-between">
          <p>{errorMessage}</p>
          <button onClick={() => setErrorMessage(null)} className="text-xs underline font-medium">
            閉じる
          </button>
        </div>
      )}

      {/* Step 1: Sentence */}
      <SentenceCard
        sentence={sentence}
        isLoading={isLoadingSentence}
        onRefresh={fetchSentence}
      />

      {/* Step 2: Record */}
      {sentence && !diffResult && (
        <AudioRecorder
          onAudioReady={handleAudioReady}
          isTranscribing={isTranscribing}
          disabled={isLoadingSentence}
        />
      )}

      {/* Step 3: Diff Result */}
      {diffResult && (
        <>
          <DiffViewer
            diff={diffResult}
            transcription={transcription}
          />

          {/* Next question button */}
          <div className="flex justify-center pt-2">
            <button
              onClick={handleNext}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition shadow-sm min-h-[48px] text-base sm:text-sm"
            >
              {currentIndex + 1 >= totalQuestions ? (
                <>
                  <Award className="w-5 h-5" />
                  結果を見る
                </>
              ) : (
                <>
                  次の問題へ
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
