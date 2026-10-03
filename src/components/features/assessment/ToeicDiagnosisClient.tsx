"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SentenceCard } from "@/components/features/practice/SentenceCard";
import { AudioRecorder } from "@/components/features/practice/AudioRecorder";
import { DiffViewer } from "@/components/features/practice/DiffViewer";
import { VipRemainingBadge } from "@/components/features/waitlist/VipRemainingBadge";
import {
  getInitialQuestion,
  getNextQuestion,
  getBenchmarkSentence,
  analyzeDiffWordsForToeic,
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
  WPMInfo,
} from "@/types";
import {
  ArrowRight,
  Award,
  Crown,
  ExternalLink,
  RotateCcw,
  Share2,
  Sparkles,
  Target,
  X,
  Zap,
} from "lucide-react";

const MAX_QUESTIONS = 3;

interface ToeicDiagnosisClientProps {
  mode?: "public" | "settings";
}

export function ToeicDiagnosisClient({
  mode = "public",
}: ToeicDiagnosisClientProps) {
  const router = useRouter();

  // Assessment state
  const [currentQuestion, setCurrentQuestion] =
    useState<AssessmentQuestion | null>(null);
  const [answers, setAnswers] = useState<AssessmentAnswer[]>([]);
  const [result, setResult] = useState<AssessmentResult | null>(null);

  // Per-question state
  const [sentence, setSentence] = useState<SentenceResponse | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [diffResult, setDiffResult] = useState<DiffResult | null>(null);
  const [wpmInfo, setWpmInfo] = useState<WPMInfo | undefined>(undefined);
  const [transcription, setTranscription] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [recordingModeUsed, setRecordingModeUsed] = useState<
    "repeating" | "shadowing"
  >("repeating");

  // Floating recording bar state
  const [floatIsRecording, setFloatIsRecording] = useState(false);
  const [, setFloatHasBlob] = useState(false);
  const recorderControlsRef = useRef<{
    start: (mode?: "repeating" | "shadowing") => void;
    stop: () => void;
    reset: () => void;
    submit: () => void;
  } | null>(null);
  const lastRecordingDurationRef = useRef<number>(0);

  const isComplete = result !== null;

  // Initialize first question on mount
  useEffect(() => {
    const q = getInitialQuestion();
    setCurrentQuestion(q);
  }, []);

  // Load curated TOEIC benchmark sentence instantaneously (0ms wait)
  const loadQuestionSentence = useCallback(() => {
    if (!currentQuestion) return;

    setDiffResult(null);
    setWpmInfo(undefined);
    setTranscription("");
    setErrorMessage(null);
    setRecordingModeUsed("repeating");
    recorderControlsRef.current?.reset?.();
    setFloatHasBlob(false);
    setFloatIsRecording(false);

    const bench = getBenchmarkSentence(
      currentQuestion.assessmentLevel,
      currentQuestion.questionNumber
    );
    setSentence(bench);
  }, [currentQuestion]);

  useEffect(() => {
    if (currentQuestion) {
      loadQuestionSentence();
    }
  }, [currentQuestion, loadQuestionSentence]);

  // Handle audio recording result
  const handleAudioReady = async (audioBlob: Blob, durationSeconds: number) => {
    if (!sentence) return;
    setIsTranscribing(true);
    setErrorMessage(null);
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
      setWpmInfo(data.wpmInfo);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "音声解析エラー";
      setErrorMessage(msg);
    } finally {
      setIsTranscribing(false);
    }
  };

  // Proceed to next question or finish 3-step test
  const handleNext = () => {
    if (!diffResult || !currentQuestion || !sentence) return;

    const wordCount = diffResult.originalWordCount;
    const spokenWordCount = diffResult.spokenWordCount || wordCount;
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

    const toeicWordBreakdown = analyzeDiffWordsForToeic(
      diffResult.tokens || []
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
      contentWordAccuracy: toeicWordBreakdown.contentWordAccuracy,
      linkingAccuracy: toeicWordBreakdown.linkingAccuracy,
      recordingMode: recordingModeUsed,
      missedLinkingWords: toeicWordBreakdown.missedLinkingWords,
      missedContentWords: toeicWordBreakdown.missedContentWords,
    };

    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);

    // 3-Step adaptive routing (stops at 3 questions)
    const nextQ = getNextQuestion(newAnswers, MAX_QUESTIONS);

    if (!nextQ) {
      const assessmentResult = calculateAssessmentResult(newAnswers);
      setResult(assessmentResult);

      try {
        localStorage.setItem(
          "shadowlog_level",
          assessmentResult.levelInfo.difficultyLevel
        );
        localStorage.setItem(
          "shadowlog_assessment_level",
          assessmentResult.recommendedLevel
        );
        localStorage.setItem(
          "shadowlog_assessment_result",
          JSON.stringify({
            ...assessmentResult,
            completedAt: new Date().toISOString(),
          })
        );
      } catch {
        // Ignore storage errors
      }
    } else {
      setCurrentQuestion(nextQ);
    }
  };

  const handleRestart = () => {
    setAnswers([]);
    setResult(null);
    setDiffResult(null);
    setWpmInfo(undefined);
    setTranscription("");
    setCurrentQuestion(getInitialQuestion());
  };

  // ── Result Screen (3問完了後の高精度TOEIC診断カルテ) ──
  if (isComplete && result) {
    const shareText = encodeURIComponent(
      `🎙️ AI英語発話診断の結果、私の推定TOEICスコアは【${result.estimatedToeicScore}点相当】（実効速度: ${result.effectiveWPM} WPM / CEFR ${result.recommendedLevel}・上位${result.percentileTop}%）でした！\n\n30秒で自分の英語スピードと弱点リンキングが測れます👇\nhttps://shadowlog.vercel.app/diagnosis\n#ShadowLog #英語学習 #TOEIC #シャドーイング`
    );
    const threadsShareUrl = `https://www.threads.net/intent/post?text=${shareText}`;
    const xShareUrl = `https://twitter.com/intent/tweet?text=${shareText}`;

    return (
      <div className="max-w-2xl mx-auto space-y-6 pb-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* 1. Main Hero TOEIC Score Card */}
        <div className="bg-card rounded-3xl p-6 sm:p-8 border-2 border-primary/30 shadow-xl text-center space-y-5 relative overflow-hidden">
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-96 h-40 bg-primary/15 rounded-full blur-3xl pointer-events-none" />

          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-extrabold border border-primary/20">
            <Award className="w-4 h-4" />
            <span>AI 3ステップ実力診断カルテ</span>
          </div>

          <div className="space-y-1">
            <p className="text-xs sm:text-sm font-bold text-muted-foreground">
              あなたの発話速度・リンキング再現力からの推定スコア
            </p>
            <div className="flex items-baseline justify-center gap-2 pt-1">
              <span className="text-xs sm:text-sm font-bold text-primary">
                推定TOEIC
              </span>
              <span className="text-5xl sm:text-6xl font-black tracking-tight text-foreground">
                {result.estimatedToeicScore}
              </span>
              <span className="text-base sm:text-lg font-bold text-muted-foreground">
                点相当
              </span>
            </div>
          </div>

          {/* Sub Badges: Listening Score, CEFR Level, Percentile */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <span className="px-3 py-1 rounded-xl text-xs font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border border-indigo-500/20">
              リスニング換算: {result.estimatedListeningScore} / 495点
            </span>
            <span
              className={`px-3 py-1 rounded-xl text-xs font-bold border ${result.levelInfo.bg} ${result.levelInfo.color}`}
            >
              CEFR {result.levelInfo.label}
            </span>
            <span className="px-3 py-1 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              上位 {result.percentileTop}%
            </span>
          </div>

          {/* Effective WPM vs TOEIC Part 3 Standard (150 WPM) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-muted/50 border border-border text-left space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-500" />
                あなたの実効スピード（正確性補正済みWPM）
              </span>
              <span className="text-lg font-black text-primary">
                {result.effectiveWPM}{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  WPM
                </span>
              </span>
            </div>

            <div className="w-full h-2.5 bg-background rounded-full overflow-hidden border border-border/60">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min(100, Math.round((result.effectiveWPM / 160) * 100))}%`,
                }}
              />
            </div>

            <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
              {result.toeicNativeWpmGap > 0 ? (
                <>
                  TOEIC Part 3・4 のネイティブ標準速度（150 WPM）まで{" "}
                  <strong className="text-foreground">
                    あと {result.toeicNativeWpmGap} WPM
                  </strong>{" "}
                  です！音の連結（リンキング）を鍛えるとさらにスピードが伸びます。
                </>
              ) : (
                <strong className="text-emerald-600 dark:text-emerald-400">
                  🎉 TOEIC Part 3・4 のネイティブ標準速度（150 WPM）をクリアしています！
                </strong>
              )}
            </p>
          </div>
        </div>

        {/* 2. 4-Factor Skill Breakdown Card */}
        <div className="bg-card rounded-3xl p-6 border border-border shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            <span>TOEIC換算 4大スキル内訳</span>
          </h3>

          <div className="space-y-3.5">
            {/* Pillar 1: Content Words */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-foreground">
                  ① 重要語彙キャッチ力（名詞・動詞などの正確性）
                </span>
                <span className="font-bold text-primary">
                  {result.skillBreakdown.vocabularyCatch}%
                </span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${result.skillBreakdown.vocabularyCatch}%` }}
                />
              </div>
            </div>

            {/* Pillar 2: Linking / Function Words */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-foreground">
                  ② 音の連結・リンキング再現率（前置詞・冠詞・弱形）
                </span>
                <span className="font-bold text-indigo-500">
                  {result.skillBreakdown.linkingReproduction}%
                </span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full"
                  style={{
                    width: `${result.skillBreakdown.linkingReproduction}%`,
                  }}
                />
              </div>
            </div>

            {/* Pillar 3: Speed Follow */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-foreground">
                  ③ 有効WPMスピード追従度（音声処理速度）
                </span>
                <span className="font-bold text-emerald-500">
                  {result.skillBreakdown.speedFollow}%
                </span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${result.skillBreakdown.speedFollow}%` }}
                />
              </div>
            </div>
          </div>

          {/* Missed Linking Words Highlight */}
          {(result.missedLinkingWords.length > 0 ||
            result.missedContentWords.length > 0) && (
            <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20 space-y-2 mt-2">
              <div className="text-xs font-bold text-rose-600 dark:text-rose-400">
                🔍 今回の診断で検出された「伸びしろ（脱落・弱点ワード）」
              </div>
              <div className="flex flex-wrap gap-1.5">
                {result.missedLinkingWords.map((w) => (
                  <span
                    key={`link-${w}`}
                    className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30"
                  >
                    🔗 {w}（リンキング弱形）
                  </span>
                ))}
                {result.missedContentWords.map((w) => (
                  <span
                    key={`content-${w}`}
                    className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30"
                  >
                    🔤 {w}
                  </span>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground">
                ※ ShadowLog本編では、これらの言えなかった単語が「自分専用の復習カルテ」に自動登録され、反復練習できます。
              </p>
            </div>
          )}
        </div>

        {/* 3. Funnel Section: LP Introduction & 20-User Limited VIP Invitation */}
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-indigo-500/40 shadow-2xl space-y-6">
          <div className="text-center space-y-3">
            <VipRemainingBadge variant="compact" />

            <h2 className="text-xl sm:text-2xl font-black leading-snug pt-1">
              診断された弱点を、毎日3分の声出しで克服しませんか？
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-lg mx-auto">
              『ShadowLog』は、あなたのレベル（{result.levelInfo.label}）と職種に合わせた英文を毎日生成し、AIが1単語単位で発音とWPMを可視化するシャドーイング習慣化アプリです。
            </p>
          </div>

          {/* Step-by-Step Funnel Buttons */}
          <div className="space-y-3">
            {/* Primary Funnel CTA 1: See what kind of app ShadowLog is (LP) */}
            <Link
              href="/waitlist"
              className="w-full py-4 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm sm:text-base transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30"
            >
              <Sparkles className="w-5 h-5 text-amber-300 shrink-0" />
              <span>ShadowLogがどんなアプリか詳しく見る（紹介LP・特典へ）</span>
              <ArrowRight className="w-5 h-5 shrink-0" />
            </Link>

            {/* Secondary Funnel CTA 2: Direct VIP Registration or Waitlist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <Link
                href="/signup?vip=1"
                className="py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm transition flex items-center justify-center gap-1.5 shadow-md"
              >
                <Crown className="w-4 h-4 shrink-0" />
                <span>先着20名VIP枠で今すぐ始める</span>
              </Link>

              <Link
                href="/compare/shadoten"
                className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm border border-slate-700 transition flex items-center justify-center gap-1.5"
              >
                <span>他社（シャドテン）との比較を見る</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {mode === "settings" && (
            <div className="pt-2 border-t border-slate-800 text-center">
              <button
                onClick={() => router.push("/practice")}
                className="text-xs font-bold text-indigo-300 hover:text-white underline underline-offset-4 cursor-pointer"
              >
                現在のアカウントでそのまま練習画面へ進む →
              </button>
            </div>
          )}
        </div>

        {/* 4. SNS Share Box */}
        <div className="bg-card rounded-2xl p-5 border border-border text-center space-y-3">
          <p className="text-xs font-bold text-foreground flex items-center justify-center gap-1.5">
            <Share2 className="w-4 h-4 text-primary" />
            <span>診断結果をSNSでシェアして記録を残そう！</span>
          </p>
          <div className="flex items-center justify-center gap-3">
            <a
              href={threadsShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-foreground text-background font-bold text-xs hover:opacity-90 transition"
            >
              <span>Threads で結果をシェア</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <a
              href={xShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-500 text-white font-bold text-xs hover:bg-sky-400 transition"
            >
              <span>X (Twitter) でシェア</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
          <div className="pt-1">
            <button
              onClick={handleRestart}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>もう一度診断をやり直す</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Question Screen (3-Step Test in Progress) ──
  const currentQNum = currentQuestion?.questionNumber || 1;
  const currentLevel = currentQuestion?.assessmentLevel || "B1";
  const levelInfo = ASSESSMENT_LEVELS[currentLevel];

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-32">
      {/* Progress Header Card */}
      <div className="bg-card rounded-2xl p-4 sm:p-5 border border-border shadow-xs space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-black">
              STEP {currentQNum} / {MAX_QUESTIONS}
            </span>
            <span className="text-xs sm:text-sm font-bold text-foreground">
              30秒 TOEIC換算＆スピード実力診断
            </span>
          </div>

          <span
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${levelInfo.bg} ${levelInfo.color}`}
          >
            出題レベル: {levelInfo.labelShort} ({levelInfo.toeicRangeLabel})
          </span>
        </div>

        {/* 3-Step Visual Indicator */}
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map((step) => {
            const done = step < currentQNum;
            const active = step === currentQNum;
            return (
              <div
                key={step}
                className={`h-2 rounded-full transition-all duration-300 ${
                  done
                    ? "bg-emerald-500"
                    : active
                      ? "bg-primary animate-pulse"
                      : "bg-muted"
                }`}
              />
            );
          })}
        </div>

        <p className="text-[11px] text-muted-foreground">
          💡 お手本音声を聞いてから真似る「リピーティング」か、同時に声を出す「シャドーイング」で1文発声してください。
        </p>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium flex items-center justify-between">
          <span>⚠️ {errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            className="p-1 hover:bg-rose-500/10 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Sentence Card */}
      {sentence && (
        <SentenceCard
          sentence={sentence}
          isLoading={false}
          onRefresh={loadQuestionSentence}
          showChunkSlash={true}
          isRecording={floatIsRecording}
          recordingType={recordingModeUsed}
        />
      )}

      {/* Audio Recorder (Supports Dual Recording Modes) */}
      {sentence && (
        <AudioRecorder
          key={sentence.id}
          onAudioReady={handleAudioReady}
          isTranscribing={isTranscribing}
          hasEvaluated={Boolean(diffResult)}
          onRecordingStateChange={(isRec, hasBlob) => {
            setFloatIsRecording(isRec);
            setFloatHasBlob(hasBlob);
          }}
          onRegisterControls={(controls) => {
            recorderControlsRef.current = controls;
          }}
        />
      )}

      {/* Diff Result & Next Step Button */}
      {diffResult && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <div className="bg-card rounded-2xl p-5 border border-border shadow-sm space-y-4">
            <DiffViewer
              diff={diffResult}
              transcription={transcription}
              wpmInfo={wpmInfo}
            />

            <button
              onClick={handleNext}
              className="w-full py-4 px-6 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm sm:text-base shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>
                {currentQNum < MAX_QUESTIONS
                  ? `次の問題へ進む（あと ${MAX_QUESTIONS - currentQNum} 問）`
                  : "🏆 3問完了！TOEIC換算＆診断カルテを見る"}
              </span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
