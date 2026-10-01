"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { SentenceCard } from "@/components/features/practice/SentenceCard";
import { AudioRecorder } from "@/components/features/practice/AudioRecorder";
import { DiffViewer } from "@/components/features/practice/DiffViewer";
import {
  getInitialQuestion,
  getNextQuestion,
  calculateAssessmentResult,
  calculateWPMFollowRate,
  calculateCompositeScore,
  ASSESSMENT_LEVELS,
  AssessmentQuestion,
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
  Mic,
  Square,
  Target,
  Timer,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";

const MAX_QUESTIONS = 5;

export default function AssessmentPage() {
  const router = useRouter();

  // Assessment state
  const [currentQuestion, setCurrentQuestion] =
    useState<AssessmentQuestion | null>(null);
  const [answers, setAnswers] = useState<AssessmentAnswer[]>([]);
  const [result, setResult] = useState<AssessmentResult | null>(null);

  // Per-question state
  const [sentence, setSentence] = useState<SentenceResponse | null>(null);
  const [isLoadingSentence, setIsLoadingSentence] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [diffResult, setDiffResult] = useState<DiffResult | null>(null);
  const [transcription, setTranscription] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Floating recording bar state
  const [floatIsRecording, setFloatIsRecording] = useState(false);
  const [floatHasBlob, setFloatHasBlob] = useState(false);
  const recorderControlsRef = useRef<{
    start: () => void;
    stop: () => void;
    reset?: () => void;
  } | null>(null);
  const lastRecordingDurationRef = useRef<number>(0);

  const isComplete = result !== null;

  // Initialize first question on mount
  useEffect(() => {
    const q = getInitialQuestion();
    setCurrentQuestion(q);
  }, []);

  // Fetch sentence for current question
  const fetchSentence = useCallback(async () => {
    if (!currentQuestion) return;

    setIsLoadingSentence(true);
    setDiffResult(null);
    setTranscription("");
    setErrorMessage(null);
    // Reset recorder
    recorderControlsRef.current?.reset?.();
    setFloatHasBlob(false);
    setFloatIsRecording(false);

    try {
      const res = await fetch("/api/generate-sentence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          industry: "daily",
          level: currentQuestion.difficultyLevel,
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

  // Load sentence when question changes
  useEffect(() => {
    if (currentQuestion) {
      fetchSentence();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestion?.questionNumber]);

  // Handle audio recording result — now accepts durationSeconds
  const handleAudioReady = async (audioBlob: Blob, durationSeconds: number) => {
    if (!sentence) return;
    setIsTranscribing(true);
    setErrorMessage(null);
    // Store duration for WPM calculation in handleNext
    lastRecordingDurationRef.current = durationSeconds;

    try {
      const formData = new FormData();
      const mimeType = audioBlob.type || "audio/webm";
      const ext = mimeType.includes("mp4")
        ? "mp4"
        : mimeType.includes("aac")
          ? "aac"
          : "webm";
      formData.append("audio", audioBlob, `recording.${ext}`);
      formData.append("originalText", sentence.english);
      formData.append("durationSeconds", String(durationSeconds));

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

    const wordCount = diffResult.originalWordCount;
    const spokenWordCount = diffResult.spokenWordCount || wordCount;
    // Use actual recording duration stored from handleAudioReady
    const durationSec = Math.max(1, lastRecordingDurationRef.current || 1);
    const userWPM = Math.round((spokenWordCount / durationSec) * 60);

    const wpmFollowRate = calculateWPMFollowRate(
      userWPM,
      currentQuestion.assessmentLevel
    );
    const compositeScore = calculateCompositeScore(
      diffResult.accuracyScore,
      wpmFollowRate
    );

    const answer: AssessmentAnswer = {
      questionNumber: currentQuestion.questionNumber,
      assessmentLevel: currentQuestion.assessmentLevel,
      accuracyScore: diffResult.accuracyScore,
      wpmFollowRate,
      compositeScore,
      userWPM,
      durationSeconds: durationSec,
      wordCount,
    };

    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);

    // Check if test is done
    const nextQ = getNextQuestion(newAnswers);

    if (!nextQ) {
      // Assessment complete
      const assessmentResult = calculateAssessmentResult(newAnswers);
      setResult(assessmentResult);

      // Save to localStorage — store the assessment level for display
      // and map to DifficultyLevel for practice sentence generation
      try {
        localStorage.setItem(
          "shadowlog_level",
          assessmentResult.levelInfo.difficultyLevel
        );
        localStorage.setItem(
          "shadowlog_assessment_date",
          new Date().toISOString()
        );
        localStorage.setItem(
          "shadowlog_assessment_result",
          JSON.stringify(assessmentResult)
        );
      } catch {
        // ignore localStorage errors
      }
    } else {
      // Move to next question
      setSentence(null);
      setDiffResult(null);
      setTranscription("");
      setCurrentQuestion(nextQ);
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

  // ── Result Screen ──
  if (isComplete && result) {
    const recLevel = result.levelInfo;
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
            {result.answers.length}問のアダプティブテストから、あなたに最適なレベルを判定しました。
          </p>
        </div>

        {/* Recommended Level */}
        <div className="bg-card rounded-2xl p-6 sm:p-8 border border-border shadow-sm text-center space-y-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            あなたの推奨レベル
          </p>
          <div
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-2xl border text-xl font-bold ${recLevel.bg} ${recLevel.color}`}
          >
            <Target className="w-6 h-6" />
            {recLevel.label}
          </div>
          <p className="text-sm text-muted-foreground">
            設定に自動反映済みです。いつでも変更できます。
          </p>
        </div>

        {/* Score Breakdown — composite, accuracy, WPM */}
        <div className="bg-card rounded-2xl p-5 sm:p-8 border border-border shadow-sm space-y-5">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            スコア詳細
          </h3>

          <div className="grid grid-cols-3 gap-3">
            {/* Overall Composite */}
            <div className="text-center p-3 sm:p-4 rounded-xl border border-border bg-primary/5">
              <p className="text-[11px] sm:text-xs text-muted-foreground font-medium mb-1">
                総合スコア
              </p>
              <p
                className={`text-2xl sm:text-3xl font-extrabold font-mono ${
                  result.overallComposite >= 70
                    ? "text-emerald-600"
                    : result.overallComposite >= 50
                      ? "text-amber-600"
                      : "text-rose-600"
                }`}
              >
                {result.overallComposite}%
              </p>
            </div>
            {/* Accuracy */}
            <div className="text-center p-3 sm:p-4 rounded-xl border border-border">
              <p className="text-[11px] sm:text-xs text-muted-foreground font-medium mb-1 flex items-center justify-center gap-1">
                <Zap className="w-3 h-3" />
                正確性
              </p>
              <p className="text-xl sm:text-2xl font-bold font-mono text-foreground">
                {result.overallAccuracy}%
              </p>
            </div>
            {/* WPM Follow Rate */}
            <div className="text-center p-3 sm:p-4 rounded-xl border border-border">
              <p className="text-[11px] sm:text-xs text-muted-foreground font-medium mb-1 flex items-center justify-center gap-1">
                <Timer className="w-3 h-3" />
                話速追従
              </p>
              <p className="text-xl sm:text-2xl font-bold font-mono text-foreground">
                {result.overallWPMFollowRate}%
              </p>
            </div>
          </div>

          {/* Per-question detail */}
          <div className="space-y-2 pt-2 border-t border-border">
            <p className="text-xs font-semibold text-muted-foreground">
              各問スコア
            </p>
            <div className="flex flex-wrap gap-2">
              {result.answers.map((a) => {
                const lvlInfo = ASSESSMENT_LEVELS[a.assessmentLevel];
                return (
                  <div
                    key={a.questionNumber}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium ${
                      a.compositeScore >= 70
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700"
                        : a.compositeScore >= 50
                          ? "bg-amber-500/10 border-amber-500/30 text-amber-700"
                          : "bg-rose-500/10 border-rose-500/30 text-rose-700"
                    }`}
                  >
                    <span className="opacity-60">Q{a.questionNumber}</span>
                    <span
                      className={`text-[10px] font-bold ${lvlInfo.color}`}
                    >
                      {lvlInfo.labelShort}
                    </span>
                    <span className="font-bold">{a.compositeScore}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Level flow visualization */}
          <div className="space-y-1 pt-2 border-t border-border">
            <p className="text-xs font-semibold text-muted-foreground">
              レベル推移
            </p>
            <div className="flex items-center gap-1 flex-wrap">
              {result.answers.map((a, i) => {
                const lvl = ASSESSMENT_LEVELS[a.assessmentLevel];
                return (
                  <div key={a.questionNumber} className="flex items-center gap-1">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${lvl.bg} ${lvl.color}`}
                    >
                      {lvl.labelShort}
                    </span>
                    {i < result.answers.length - 1 && (
                      <ArrowRight className="w-3 h-3 text-muted-foreground/50" />
                    )}
                  </div>
                );
              })}
              <ArrowRight className="w-3 h-3 text-primary" />
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ring-2 ring-primary/30 ${recLevel.bg} ${recLevel.color}`}
              >
                ★ {recLevel.labelShort}
              </span>
            </div>
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

  // ── Test Flow Screen ──
  if (!currentQuestion) return null;

  const levelInfo = ASSESSMENT_LEVELS[currentQuestion.assessmentLevel];
  // Progress: show answered + current out of max
  const answeredCount = answers.length;
  const progressPercent = (answeredCount / MAX_QUESTIONS) * 100;

  return (
    <div className="max-w-3xl mx-auto space-y-5 sm:space-y-6 pb-32 sm:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-foreground flex items-center gap-2">
            <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            レベル判定テスト
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            アダプティブ方式で最大{MAX_QUESTIONS}問 — 約2〜3分で完了
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
              Q{answeredCount + 1} / 最大{MAX_QUESTIONS}
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${levelInfo.bg} ${levelInfo.color}`}
            >
              {levelInfo.label}
            </span>
          </div>
          <span className="text-muted-foreground">
            {Math.round(progressPercent)}%
          </span>
        </div>
        <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        {/* Answered question dots + current */}
        <div className="flex items-center gap-1 justify-center pt-1">
          {answers.map((a) => (
            <div
              key={a.questionNumber}
              className={`w-2 h-2 rounded-full transition-all ${
                a.compositeScore >= 60 ? "bg-emerald-500" : "bg-rose-400"
              }`}
              title={`Q${a.questionNumber}: ${a.compositeScore}%`}
            />
          ))}
          {/* Current question dot */}
          <div className="w-3 h-3 rounded-full bg-primary" />
          {/* Remaining placeholder dots */}
          {Array.from({
            length: Math.max(0, MAX_QUESTIONS - answeredCount - 1),
          }).map((_, i) => (
            <div
              key={`future-${i}`}
              className="w-2 h-2 rounded-full bg-muted-foreground/20"
            />
          ))}
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs sm:text-sm flex items-center justify-between">
          <p>{errorMessage}</p>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-xs underline font-medium"
          >
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
          key={`assessment-${currentQuestion.questionNumber}`}
          onAudioReady={handleAudioReady}
          isTranscribing={isTranscribing}
          onRecordingStateChange={(rec, hasBlob) => {
            setFloatIsRecording(rec);
            setFloatHasBlob(hasBlob);
          }}
          onRegisterControls={(controls) => {
            recorderControlsRef.current = controls;
          }}
        />
      )}

      {/* Step 3: Diff Result */}
      {diffResult && (
        <>
          <DiffViewer diff={diffResult} transcription={transcription} />

          {/* Next question button */}
          <div className="flex justify-center pt-2">
            <button
              onClick={handleNext}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition shadow-sm min-h-[48px] text-base sm:text-sm"
            >
              {(() => {
                // Check if this will be the last question
                // We can't know for sure until handleNext runs, but we can preview
                const tempAnswer: AssessmentAnswer = {
                  questionNumber: currentQuestion.questionNumber,
                  assessmentLevel: currentQuestion.assessmentLevel,
                  accuracyScore: diffResult.accuracyScore,
                  wpmFollowRate: 50,
                  compositeScore: diffResult.accuracyScore,
                  userWPM: 0,
                  durationSeconds: 0,
                  wordCount: diffResult.originalWordCount,
                };
                const tempAnswers = [...answers, tempAnswer];
                const nextQ = getNextQuestion(tempAnswers);
                return nextQ === null ? (
                  <>
                    <Award className="w-5 h-5" />
                    結果を見る
                  </>
                ) : (
                  <>
                    次の問題へ
                    <ArrowRight className="w-4 h-4" />
                  </>
                );
              })()}
            </button>
          </div>
        </>
      )}

      {/* ── Floating Recording Bar ── */}
      {sentence && !diffResult && !floatHasBlob && (
        <div className="fixed bottom-24 sm:bottom-10 left-0 right-0 mx-auto flex justify-center z-50 pointer-events-none w-full max-w-md px-4 [transform:translateZ(0)] [-webkit-transform:translateZ(0)]">
          <div className="pointer-events-auto flex items-center justify-between gap-3 px-5 py-3 rounded-2xl bg-card/90 backdrop-blur-xl border border-primary/25 shadow-2xl shadow-primary/20 ring-1 ring-white/20 w-full duration-300">
            {/* Status indicator */}
            <div className="flex items-center gap-2">
              {floatIsRecording ? (
                <span className="flex items-center gap-2 text-xs font-bold text-destructive animate-pulse">
                  <span className="w-2.5 h-2.5 rounded-full bg-destructive" />
                  録音中...
                </span>
              ) : (
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  準備完了
                </span>
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              {!floatIsRecording ? (
                <button
                  onClick={() => recorderControlsRef.current?.start()}
                  disabled={isLoadingSentence || isTranscribing}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition shadow-lg active:scale-95 min-h-[44px]"
                >
                  <Mic className="w-4 h-4" />
                  シャドーイングを開始
                </button>
              ) : (
                <button
                  onClick={() => recorderControlsRef.current?.stop()}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm bg-destructive text-destructive-foreground hover:bg-destructive/90 transition shadow-lg active:scale-95 min-h-[44px]"
                >
                  <Square className="w-4 h-4 fill-current" />
                  録音を終了
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
