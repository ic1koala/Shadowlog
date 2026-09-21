"use client";

import { DiffResult, CoachFeedback, WPMInfo, PracticeMode } from "@/types";
import {
  CheckCircle2,
  TrendingUp,
  Sparkles,
  RotateCcw,
  GraduationCap,
  Lightbulb,
  MessageSquareQuote,
  Gauge,
  Crown,
} from "lucide-react";

interface DiffViewerProps {
  diff: DiffResult | null;
  transcription: string;
  coachFeedback?: CoachFeedback;
  wpmInfo?: WPMInfo;
  mode?: PracticeMode;
  onSaveSession?: () => void;
  onRetry?: () => void;
  isSaving?: boolean;
  isSaved?: boolean;
  retryCount?: number;
}

export function DiffViewer({
  diff,
  transcription,
  coachFeedback,
  wpmInfo,
  mode = "sentence",
  onSaveSession,
  onRetry,
  isSaving = false,
  isSaved = false,
  retryCount = 0,
}: DiffViewerProps) {
  if (!diff) return null;

  const score = diff.accuracyScore;
  const scoreColor =
    score >= 80
      ? "text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
      : score >= 60
      ? "text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/10"
      : "text-rose-600 dark:text-rose-400 border-rose-500/30 bg-rose-500/10";

  return (
    <div className="w-full bg-card rounded-2xl p-5 sm:p-8 border border-border shadow-sm space-y-5 sm:space-y-6 animate-in fade-in-50 duration-300">
      {/* Header & Score — stacked on mobile */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              発話判定結果
            </h3>
            {mode === "passage" && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 border border-amber-500/30 flex items-center gap-1">
                <Crown className="w-3 h-3 text-amber-500" />
                長文スピーチ
              </span>
            )}
            {retryCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                リトライ {retryCount}回目
              </span>
            )}
          </div>
          <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
            Whisper音声認識によるテキスト照合と差分解析
          </p>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
          {/* WPM Speed Badge */}
          {wpmInfo && (
            <div className="px-3 py-1.5 rounded-xl border border-border bg-muted/40 flex items-center gap-2">
              <Gauge className="w-4 h-4 text-primary shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground font-semibold">話速 (WPM)</p>
                <p className="text-sm font-bold font-mono text-foreground">
                  {wpmInfo.wpm} <span className="text-[10px] font-normal text-muted-foreground">語/分</span>
                </p>
              </div>
            </div>
          )}

          <div className={`px-4 py-2 rounded-2xl border font-bold text-xl flex items-center gap-1.5 ${scoreColor}`}>
            <TrendingUp className="w-5 h-5" />
            {score}%
          </div>
          <div className="text-right">
            <p className="text-[11px] sm:text-xs text-muted-foreground">正解単語数</p>
            <p className="text-sm font-semibold text-foreground">
              {diff.matchedWordCount} / {diff.originalWordCount}
            </p>
          </div>
        </div>
      </div>

      {/* Diff Tokens View */}
      <div className="space-y-3">
        <label className="text-[11px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
          単語別差分ハイライト
        </label>
        <div className="p-3 sm:p-6 bg-muted/30 rounded-2xl border border-border/80 flex flex-wrap items-center gap-1.5 sm:gap-2 text-base sm:text-lg font-medium leading-relaxed">
          {diff.tokens.map((token, idx) => {
            if (token.status === "match") {
              return (
                <span
                  key={idx}
                  className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 rounded-lg shadow-xs text-sm sm:text-lg"
                  title="一致"
                >
                  {token.word}
                </span>
              );
            }
            if (token.status === "missing") {
              return (
                <span
                  key={idx}
                  className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 rounded-lg line-through opacity-80 text-sm sm:text-lg"
                  title="脱落（発音されなかった単語）"
                >
                  {token.word}
                </span>
              );
            }
            if (token.status === "extra") {
              return (
                <span
                  key={idx}
                  className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 rounded-lg text-sm sm:text-lg"
                  title="余剰（元の文にない単語）"
                >
                  +{token.word}
                </span>
              );
            }
            if (token.status === "mismatch") {
              return (
                <span
                  key={idx}
                  className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-orange-500/15 text-orange-700 dark:text-orange-300 border border-orange-500/30 rounded-lg text-sm sm:text-lg"
                  title={`誤読・発音のズレ（認識: ${token.spokenWord}）`}
                >
                  {token.word}
                  <span className="text-[10px] sm:text-xs ml-1 opacity-75">({token.spokenWord})</span>
                </span>
              );
            }
            return <span key={idx}>{token.word}</span>;
          })}
        </div>
      </div>

      {/* Transcription Raw Text */}
      <div className="space-y-1.5 bg-muted/20 p-3 sm:p-4 rounded-xl border border-border text-sm">
        <p className="text-[11px] sm:text-xs font-medium text-muted-foreground">音声認識テキスト (Whisper):</p>
        <p className="italic text-foreground font-mono text-xs sm:text-sm break-all">
          &ldquo;{transcription || "（音声が認識されませんでした）"}&rdquo;
        </p>
      </div>

      {/* AI English Coach Review Section */}
      {coachFeedback && (
        <div className="rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/60 dark:bg-blue-950/20 p-4 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
            <GraduationCap className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
            <h4 className="font-bold text-sm sm:text-base">英会話コーチの指導レビュー</h4>
          </div>

          {/* Overall Comment */}
          <div className="flex items-start gap-2.5 text-xs sm:text-sm text-foreground leading-relaxed bg-white/70 dark:bg-card/70 p-3 sm:p-4 rounded-xl border border-blue-100 dark:border-blue-900/40">
            <MessageSquareQuote className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <p className="font-medium">{coachFeedback.overallComment}</p>
          </div>

          {/* Pronunciation & Linking Advice */}
          <div className="space-y-1.5 text-xs sm:text-sm text-foreground leading-relaxed pl-1">
            <p className="font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5 text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
              発音・音声変化（リンキング・弱形）のアドバイス
            </p>
            <p className="text-muted-foreground pl-3 text-xs sm:text-sm leading-relaxed">
              {coachFeedback.pronunciationAdvice}
            </p>
          </div>

          {/* Pacing & Chunking Advice (Long Passage) */}
          {coachFeedback.pacingAdvice && (
            <div className="space-y-1.5 text-xs sm:text-sm text-foreground leading-relaxed pl-1">
              <p className="font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5 text-xs">
                <Gauge className="w-3.5 h-3.5 text-primary" />
                話速（WPM）＆息継ぎ（チャンキング）の指導
              </p>
              <p className="text-muted-foreground pl-3 text-xs sm:text-sm leading-relaxed">
                {coachFeedback.pacingAdvice}
              </p>
            </div>
          )}

          {/* Retry Focus Point (Actionable for repetition) */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs sm:text-sm">
            <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold mr-1">復習のワンポイント:</span>
              <span>{coachFeedback.retryFocusPoint}</span>
            </div>
          </div>
        </div>
      )}

      {/* Legend & Action Buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-3 border-t border-border">
        {/* Token status legend */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 text-[11px] sm:text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> 一致
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> 脱落
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> 余剰
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500" /> ズレ
          </span>
        </div>

        {/* Action Buttons: Retry / Save */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 sm:py-2.5 rounded-xl font-bold text-sm bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border transition shadow-xs active:scale-95 min-h-[48px] sm:min-h-0"
              title="コーチのアドバイスを意識してもう一度発話する"
            >
              <RotateCcw className="w-4 h-4 text-primary" />
              もう一度復習する
            </button>
          )}

          {onSaveSession && (
            <button
              onClick={onSaveSession}
              disabled={isSaving || isSaved}
              className={`inline-flex items-center justify-center gap-2 px-5 py-3 sm:py-2.5 rounded-xl font-medium text-sm transition shadow-xs min-h-[48px] sm:min-h-0 ${
                isSaved
                  ? "bg-emerald-600 text-white cursor-default"
                  : "bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              {isSaved ? "学習ログを記録済み" : isSaving ? "記録中..." : "記録を保存する"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
