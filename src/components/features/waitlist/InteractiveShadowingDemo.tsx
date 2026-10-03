"use client";

import { useState, useEffect } from "react";
import { Volume2, Mic, Sparkles, CheckCircle2, RotateCcw, Play, Pause } from "lucide-react";

interface WordToken {
  word: string;
  status: "pending" | "speaking" | "matched" | "mismatch";
  spoken?: string;
}

const INITIAL_WORDS: WordToken[] = [
  { word: "Artificial", status: "pending" },
  { word: "intelligence", status: "pending" },
  { word: "optimizes", status: "pending" },
  { word: "our", status: "pending", spoken: "all" }, // intentional mismatch simulation
  { word: "deployment", status: "pending" },
  { word: "pipeline.", status: "pending" },
];

export function InteractiveShadowingDemo() {
  // Demo simulation phases: 'idle' -> 'model_audio' -> 'user_speech' -> 'result'
  const [phase, setPhase] = useState<"idle" | "model_audio" | "user_speech" | "result">("model_audio");
  const [isPlaying, setIsPlaying] = useState(true);
  const [activeWordIndex, setActiveWordIndex] = useState(0);

  const [words, setWords] = useState<WordToken[]>(INITIAL_WORDS);

  useEffect(() => {
    if (!isPlaying) return;

    let timer: NodeJS.Timeout;

    if (phase === "model_audio") {
      // Model plays for 2.2s
      timer = setTimeout(() => {
        setPhase("user_speech");
        setActiveWordIndex(0);
      }, 2200);
    } else if (phase === "user_speech") {
      // Simulate real-time word recognition every 400ms
      if (activeWordIndex < INITIAL_WORDS.length) {
        timer = setTimeout(() => {
          setWords((prev) =>
            prev.map((item, idx) => {
              if (idx === activeWordIndex) {
                // Item 3 ("our") simulates pronunciation mismatch / drop
                return {
                  ...item,
                  status: idx === 3 ? "mismatch" : "matched",
                };
              }
              return item;
            })
          );
          setActiveWordIndex((prev) => prev + 1);
        }, 450);
      } else {
        // Move to result phase
        timer = setTimeout(() => {
          setPhase("result");
        }, 600);
      }
    } else if (phase === "result") {
      // Hold result for 3.5s then loop
      timer = setTimeout(() => {
        // Reset
        setWords(INITIAL_WORDS);
        setActiveWordIndex(0);
        setPhase("model_audio");
      }, 3800);
    }

    return () => clearTimeout(timer);
  }, [phase, activeWordIndex, isPlaying]);

  const handleRestart = () => {
    setWords(INITIAL_WORDS);
    setActiveWordIndex(0);
    setPhase("model_audio");
    setIsPlaying(true);
  };

  const togglePlay = () => {
    setIsPlaying((prev) => !prev);
  };

  return (
    <div className="w-full max-w-xl mx-auto rounded-3xl p-5 sm:p-7 bg-card/90 backdrop-blur-xl border border-border/80 shadow-2xl relative overflow-hidden transition-all">
      {/* Decorative background glow */}
      <div className="absolute -top-24 -right-24 w-60 h-60 bg-primary/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar */}
      <div className="flex items-center justify-between pb-4 border-b border-border/60">
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI判定シミュレーター</span>
          </div>
          <span className="text-[11px] text-muted-foreground hidden sm:inline">
            実践画面のリアルタイム判定イメージ
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={togglePlay}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title={isPlaying ? "一時停止" : "再生"}
            aria-label={isPlaying ? "一時停止" : "再生"}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button
            onClick={handleRestart}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="最初から再生"
            aria-label="最初から再生"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main interactive screen */}
      <div className="mt-5 space-y-4">
        {/* Status Indicator banner */}
        <div className="flex items-center justify-between text-xs px-3 py-2 rounded-xl bg-muted/60 border border-border/50">
          <div className="flex items-center gap-2">
            {phase === "model_audio" && (
              <>
                <Volume2 className="w-4 h-4 text-primary animate-pulse" />
                <span className="font-semibold text-foreground">
                  ① お手本ネイティブ音声再生中...
                </span>
              </>
            )}
            {phase === "user_speech" && (
              <>
                <div className="relative flex items-center justify-center">
                  <span className="absolute w-3 h-3 rounded-full bg-rose-500/40 animate-ping" />
                  <Mic className="w-4 h-4 text-rose-500 relative" />
                </div>
                <span className="font-semibold text-foreground">
                  ② あなたの発足を音声AIが解析中...
                </span>
              </>
            )}
            {phase === "result" && (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  ③ 判定完了！ 弱点が色分けで判明
                </span>
              </>
            )}
          </div>

          {/* Mini waveform equalizer */}
          <div className="flex items-center gap-0.5 h-3">
            {[40, 75, 50, 90, 60, 30].map((h, i) => (
              <span
                key={i}
                className={`w-1 rounded-full transition-all duration-300 ${
                  phase === "model_audio"
                    ? "bg-primary animate-pulse"
                    : phase === "user_speech"
                    ? "bg-rose-500 animate-pulse"
                    : "bg-emerald-500"
                }`}
                style={{
                  height: phase === "result" ? "40%" : `${h}%`,
                  animationDelay: `${i * 120}ms`,
                }}
              />
            ))}
          </div>
        </div>

        {/* English sentence card */}
        <div className="p-5 sm:p-6 rounded-2xl bg-card border border-border/70 shadow-inner space-y-3">
          <p className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
            Topic: Tech / Infrastructure
          </p>

          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 text-base sm:text-xl font-semibold leading-relaxed">
            {words.map((item, idx) => {
              const isMatched = item.status === "matched";
              const isMismatch = item.status === "mismatch";
              const isCurrent = phase === "user_speech" && idx === activeWordIndex;

              return (
                <span
                  key={idx}
                  className={`relative px-2 py-0.5 rounded-lg transition-all duration-300 font-mono sm:font-sans ${
                    isMatched
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                      : isMismatch
                      ? "bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/40 line-through decoration-rose-500 decoration-2"
                      : isCurrent
                      ? "bg-primary/10 text-primary border border-primary/30 ring-2 ring-primary/20 scale-105"
                      : "text-muted-foreground/60 border border-transparent"
                  }`}
                >
                  {item.word}

                  {/* Tooltip for mismatch */}
                  {isMismatch && (
                    <span className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-600 text-white shadow-md animate-bounce">
                      認識: &quot;{item.spoken}&quot;
                    </span>
                  )}
                </span>
              );
            })}
          </div>

          <p className="text-xs sm:text-sm text-muted-foreground pt-1">
            「AIが我々のデプロイメントパイプラインを最適化する。」
          </p>
        </div>

        {/* Real-time score & WPM metrics cards */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          {/* Accuracy Score */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-muted/40 border border-border/60 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground">発音一致率</p>
              <p className="text-xl sm:text-2xl font-black text-foreground tracking-tight mt-0.5">
                {phase === "result" ? (
                  <span className="text-emerald-600 dark:text-emerald-400 animate-in fade-in zoom-in duration-300">
                    94<span className="text-sm font-bold ml-0.5">%</span>
                  </span>
                ) : phase === "user_speech" ? (
                  <span className="text-muted-foreground text-sm font-semibold">判定中...</span>
                ) : (
                  <span className="text-muted-foreground/50 text-sm">--</span>
                )}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          {/* WPM Speed */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-muted/40 border border-border/60 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground">話速 (WPM)</p>
              <p className="text-xl sm:text-2xl font-black text-foreground tracking-tight mt-0.5">
                {phase === "result" ? (
                  <span className="text-indigo-600 dark:text-indigo-400 animate-in fade-in zoom-in duration-300">
                    138 <span className="text-xs font-semibold ml-0.5 text-muted-foreground">自然</span>
                  </span>
                ) : phase === "user_speech" ? (
                  <span className="text-muted-foreground text-sm font-semibold">計測中...</span>
                ) : (
                  <span className="text-muted-foreground/50 text-sm">--</span>
                )}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Bottom explanatory note */}
        <p className="text-center text-[11px] text-muted-foreground leading-relaxed pt-1">
          言えた単語は<strong className="text-emerald-600 dark:text-emerald-400 font-bold mx-1">緑色</strong>、
          聞き取れなかった・ズレた単語は<strong className="text-rose-600 dark:text-rose-400 font-bold mx-1">赤色</strong>で一瞬で可視化されます。
        </p>
      </div>
    </div>
  );
}
