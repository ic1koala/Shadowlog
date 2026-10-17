"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Lock,
  ArrowRight,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Zap,
  Flame,
  Crown,
  Mic,
  Award,
  HelpCircle,
} from "lucide-react";
import {
  SilentDrillQuestion,
  SilentDrillChunk,
  SilentDrillUnlockProgress,
  SilentDrillQuota,
  getSilentDrillUnlockProgress,
  getSilentDrillDailyQuota,
  recordSilentDrillCompletion,
  generateSilentDrillQuestions,
  FREE_USER_DAILY_LIMIT,
} from "@/lib/storage/silent-drill-store";
import { UserPlanType } from "@/types";

interface SilentDrillSectionProps {
  plan: UserPlanType;
  onOpenUpgradeModal?: () => void;
}

export function SilentDrillSection({ plan, onOpenUpgradeModal }: SilentDrillSectionProps) {
  const [unlockProgress, setUnlockProgress] = useState<SilentDrillUnlockProgress>({
    currentCount: 0,
    targetCount: 3,
    isUnlocked: false,
    remainingCount: 3,
  });
  const [quota, setQuota] = useState<SilentDrillQuota>({
    todayCompletedCount: 0,
    maxDailyCount: FREE_USER_DAILY_LIMIT,
    remainingCount: FREE_USER_DAILY_LIMIT,
    isUnlimited: false,
    canPlay: true,
  });

  const [questions, setQuestions] = useState<SilentDrillQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedChunks, setSelectedChunks] = useState<SilentDrillChunk[]>([]);
  const [status, setStatus] = useState<"answering" | "correct" | "wrong">("answering");
  const [streakCount, setStreakCount] = useState(0);
  const [isReady, setIsReady] = useState(false);

  const initData = useCallback(() => {
    const unlock = getSilentDrillUnlockProgress();
    const currentQuota = getSilentDrillDailyQuota(plan);
    setUnlockProgress(unlock);
    setQuota(currentQuota);

    if (unlock.isUnlocked) {
      const generated = generateSilentDrillQuestions(10);
      setQuestions(generated);
      setCurrentIndex(0);
      setSelectedChunks([]);
      setStatus("answering");
    }
    setIsReady(true);
  }, [plan]);

  useEffect(() => {
    initData();
  }, [initData]);

  const currentQ = questions[currentIndex];

  // チャンクをタップして選択
  const handleSelectChunk = (chunk: SilentDrillChunk) => {
    if (status !== "answering") return;
    if (selectedChunks.some((c) => c.id === chunk.id)) return;

    const nextSelected = [...selectedChunks, chunk];
    setSelectedChunks(nextSelected);

    // 全チャンクが選ばれたら正誤判定
    if (currentQ && nextSelected.length === currentQ.chunks.length) {
      const isAllCorrect = nextSelected.every((c, idx) => c.correctIndex === idx);

      if (isAllCorrect) {
        setStatus("correct");
        setStreakCount((prev) => prev + 1);
        const newQuota = recordSilentDrillCompletion();
        setQuota(newQuota);
      } else {
        setStatus("wrong");
        setStreakCount(0);
      }
    }
  };

  // 選択したチャンクを解除
  const handleRemoveChunk = (chunkId: string) => {
    if (status === "correct") return;
    setSelectedChunks((prev) => prev.filter((c) => c.id !== chunkId));
    setStatus("answering");
  };

  // リトライ（現在の問題をやり直す）
  const handleRetry = () => {
    setSelectedChunks([]);
    setStatus("answering");
  };

  // 次の問題へ
  const handleNext = () => {
    if (currentIndex + 1 < questions.length && quota.canPlay) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedChunks([]);
      setStatus("answering");
    } else {
      // 10問完了または上限到達時はリフレッシュ
      initData();
    }
  };

  if (!isReady) {
    return (
      <div className="p-8 rounded-2xl bg-card border border-border flex items-center justify-center text-muted-foreground text-xs animate-pulse">
        特訓データを読み込み中...
      </div>
    );
  }

  // -----------------------------------------------------------------
  // 1. 未解放状態（累計シャドーイング3回未満）
  // -----------------------------------------------------------------
  if (!unlockProgress.isUnlocked) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950/70 to-slate-900 border border-indigo-500/30 p-6 sm:p-7 shadow-lg text-white">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-xs font-semibold">
              <Lock className="w-3.5 h-3.5 text-indigo-400" />
              <span>解放前：スキマ特訓（Silent Drill）</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              シャドーイングあと{unlockProgress.remainingCount}回でアンロック！
            </h2>

            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              「スキマ特訓（Silent Drill）」は、あなたがシャドーイングで噛んだ・脱落した文から自動生成される**完全消音の語順パズル**です。正確な弱点データを集めるため、まずは練習タブで3回シャドーイングを行いましょう！
            </p>

            {/* 進捗プログレスバー */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-xs font-medium text-slate-300">
                <span>アンロック進捗</span>
                <span className="font-bold text-cyan-400">
                  {unlockProgress.currentCount} / {unlockProgress.targetCount} 回完了
                </span>
              </div>
              <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden p-0.5 border border-white/10">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, (unlockProgress.currentCount / unlockProgress.targetCount) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="shrink-0">
            <Link
              href="/practice"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-primary to-cyan-500 text-white font-bold text-xs sm:text-sm shadow-lg hover:opacity-95 transition active:scale-98"
            >
              <Mic className="w-4 h-4" />
              <span>練習タブで声出しする</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------------
  // 2. 上限到達（無料ユーザーで今日10問解ききった場合）
  // -----------------------------------------------------------------
  if (!quota.isUnlimited && !quota.canPlay) {
    return (
      <div className="rounded-2xl bg-card border border-border p-6 sm:p-7 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-foreground">
                本日のスキマ特訓（10問）完了！
              </h3>
              <p className="text-xs text-muted-foreground">
                無料プランの1日上限（10問）に到達しました。明日の0時にリセットされます。
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-muted text-foreground">
            10 / 10 達成
          </span>
        </div>

        <div className="p-4 rounded-xl bg-muted/40 border border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-0.5">
            <span className="font-bold text-foreground block">
              💡 Base / Proプランなら「スキマ特訓」が無制限
            </span>
            <span className="text-muted-foreground">
              通勤時間や待ち時間に、何問でも弱点チャンクパズルを解きまくれます。
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onOpenUpgradeModal && (
              <button
                type="button"
                onClick={onOpenUpgradeModal}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition shadow-xs"
              >
                <Crown className="w-3.5 h-3.5" />
                <span>無制限プランを見る</span>
              </button>
            )}
            <Link
              href="/practice"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-border bg-background hover:bg-muted font-bold text-foreground transition"
            >
              <Mic className="w-3.5 h-3.5 text-primary" />
              <span>夜のシャドーイング本番へ</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------------
  // 3. プレイ中（チャンク並び替えパズル）
  // -----------------------------------------------------------------
  if (!currentQ) return null;

  return (
    <div className="rounded-2xl bg-card border border-border shadow-sm overflow-hidden space-y-0">
      {/* Top Header Bar */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-cyan-500/10 border-b border-border flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm shadow-xs">
            <Zap className="w-4 h-4 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-extrabold text-foreground">
                Silent Drill (スキマ特訓)
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400">
                声出し不要
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              意味の塊（チャンク）を正しい語順でタップして組み立てましょう
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 text-xs">
          {streakCount > 1 && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold">
              <Flame className="w-3.5 h-3.5 fill-current" />
              <span>{streakCount}連続正解!</span>
            </div>
          )}

          <div className="px-3 py-1 rounded-full bg-muted border border-border font-mono font-bold text-foreground text-[11px]">
            {quota.isUnlimited ? (
              <span className="text-primary font-bold">無制限 (Base/Pro)</span>
            ) : (
              <span>
                今日残り: <strong className="text-primary">{quota.remainingCount}</strong>/
                {FREE_USER_DAILY_LIMIT}問
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Question Body */}
      <div className="p-4 sm:p-6 space-y-5">
        {/* 日本語訳 ＆ ワンポイントヒント */}
        <div className="space-y-1.5 p-3.5 sm:p-4 rounded-xl bg-muted/30 border border-border/70">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Question {currentIndex + 1} / {questions.length}
            </span>
            {currentQ.sourceType === "weak_session" && (
              <span className="text-[10px] font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-md">
                🎯 過去のあなたの弱点文
              </span>
            )}
          </div>
          <p className="text-sm sm:text-base font-bold text-foreground leading-snug">
            {currentQ.japanese}
          </p>
          {currentQ.weakFocus && (
            <p className="text-[11px] text-muted-foreground flex items-center gap-1 pt-0.5">
              <HelpCircle className="w-3 h-3 text-primary shrink-0" />
              <span>{currentQ.weakFocus}</span>
            </p>
          )}
        </div>

        {/* 組み立てスロット（選択されたチャンク） */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">
              語順スロット ({selectedChunks.length} / {currentQ.chunks.length}):
            </span>
            {selectedChunks.length > 0 && status !== "correct" && (
              <button
                type="button"
                onClick={handleRetry}
                className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>リセット</span>
              </button>
            )}
          </div>

          <div
            className={`min-h-[70px] p-3 rounded-xl border-2 transition-all flex flex-wrap items-center gap-2 ${
              status === "correct"
                ? "bg-emerald-500/10 border-emerald-500 text-emerald-950 dark:text-emerald-100"
                : status === "wrong"
                ? "bg-rose-500/10 border-rose-500 animate-shake"
                : "bg-muted/40 border-dashed border-border"
            }`}
          >
            {selectedChunks.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center w-full py-2 italic">
                下のチャンクブロックを順番にタップしてください
              </p>
            ) : (
              selectedChunks.map((chunk, index) => (
                <button
                  key={chunk.id}
                  type="button"
                  onClick={() => handleRemoveChunk(chunk.id)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-xs transition active:scale-95 cursor-pointer ${
                    status === "correct"
                      ? "bg-emerald-600 text-white"
                      : status === "wrong"
                      ? "bg-rose-600 text-white"
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                  }`}
                  title="タップして取り消す"
                >
                  <span className="opacity-70 text-[10px]">{index + 1}.</span>
                  <span>{chunk.text}</span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* 正解 / 不正解フィードバックエリア */}
        {status === "correct" && (
          <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              <div>
                <span className="font-extrabold text-xs sm:text-sm block">正解！完璧な語順です</span>
                <span className="text-[11px] opacity-90">
                  英語の息継ぎ（チャンク）単位でリズムが頭に入りました！
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-sm hover:bg-emerald-500 transition cursor-pointer shrink-0"
            >
              <span>次の問題へ</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {status === "wrong" && (
          <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-300 flex items-center justify-between gap-3 animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
              <div>
                <span className="font-extrabold text-xs sm:text-sm block">語順が違います</span>
                <span className="text-[11px] opacity-90">
                  日本語訳の意味の繋がりを意識して、もう一度並び替えてみましょう。
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRetry}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-600 text-white font-bold text-xs hover:bg-rose-500 transition cursor-pointer shrink-0"
            >
              <RotateCcw className="w-3 h-3" />
              <span>やり直す</span>
            </button>
          </div>
        )}

        {/* 選択肢（シャッフルされたチャンク・ブロック） */}
        <div className="space-y-2 pt-2 border-t border-border">
          <span className="text-xs font-semibold text-muted-foreground block">
            選択肢（タップしてスロットへ追加）:
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {currentQ.shuffledChunks.map((chunk) => {
              const isSelected = selectedChunks.some((c) => c.id === chunk.id);

              return (
                <button
                  key={chunk.id}
                  type="button"
                  disabled={isSelected || status === "correct"}
                  onClick={() => handleSelectChunk(chunk)}
                  className={`w-full text-left p-3.5 rounded-xl text-xs sm:text-sm font-semibold transition border ${
                    isSelected
                      ? "opacity-30 border-dashed border-border bg-muted/40 cursor-not-allowed"
                      : "bg-background hover:bg-muted/80 text-foreground border-border hover:border-primary/50 shadow-xs cursor-pointer active:scale-98"
                  }`}
                >
                  <span>{chunk.text}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
