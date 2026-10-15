"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Sparkles,
  ChevronRight,
  ChevronLeft,
  X,
  Volume2,
  BookOpen,
  Mic,
  Award,
  CheckCircle2,
  HelpCircle,
} from "lucide-react";

export interface TourStep {
  stepNumber: number;
  targetId: string;
  badge: string;
  title: string;
  icon: typeof Volume2;
  summary: string;
  description: string;
  tips: string[];
  preferredPlacement?: "top" | "bottom" | "center";
}

export const TOUR_STEPS: TourStep[] = [
  {
    stepNumber: 1,
    targetId: "tour-audio-player",
    badge: "STEP 1 / 4",
    title: "模範音声 & WPM話速の体感",
    icon: Volume2,
    summary: "ネイティブの音声を聴いて、耳でリズムをキャッチ",
    description:
      "「フレーズ音声を聴く」を押すとプロのネイティブ音声が流れます。右側の [0.8x / 1.0x / 1.2x] ボタンで速度を変更でき、今の自分の実力に最適なスピード（WPM）を体感できます。",
    tips: [
      "有線イヤホンまたは低遅延Bluetoothイヤホンの装着を推奨します",
      "速度ボタン上の数字が話速（WPM: 1分間に話す単語数）の目安です",
    ],
    preferredPlacement: "bottom",
  },
  {
    stepNumber: 2,
    targetId: "tour-sentence-text",
    badge: "STEP 2 / 4",
    title: "意味のかたまり（/）& 3D単語フリップ",
    icon: BookOpen,
    summary: "息継ぎの位置を意識し、わからない単語は即座に確認",
    description:
      "青いスラッシュ（/）は英語を頭から理解するための「チャンク（意味の区切り）」。単語をタップするとカードが立体回転し、日本語訳と発音を確認・自動で弱点単語帳に記録されます。",
    tips: [
      "スラッシュの位置で自然に息継ぎ（ポーズ）するのが上達のコツです",
      "単語をもう一度タップすると元の英語表示に戻ります",
    ],
    preferredPlacement: "bottom",
  },
  {
    stepNumber: 3,
    targetId: "tour-recording-bar",
    badge: "STEP 3 / 4",
    title: "目的別の2大録音モード",
    icon: Mic,
    summary: "「音読」で口を慣らし、「シャドーイング」で耳と口を直結",
    description:
      "【🗣️ 音読録音（青）】はお手本音声を停止し、自分のペースで発音練習。【🎧 シャドーイング録音（紫）】は模範音声と同時に発話し、ネイティブのイントネーションを体に叩き込みます。",
    tips: [
      "初心者はまず「音読録音」で単語を言えるようにするのがおすすめ",
      "発話が終わったら画面の「録音を終了」をタップしてください",
    ],
    preferredPlacement: "top",
  },
  {
    stepNumber: 4,
    targetId: "tour-finish-section",
    badge: "STEP 4 / 4",
    title: "今日の学習を終了 & 成果シェア",
    icon: Award,
    summary: "1問だけでもOK！毎日の積み上げをストリークに記録",
    description:
      "練習後に「🏁 今日の学習を終了」を押すと、本日の総発話単語数や実効WPM、連続学習日数が記録されたサマリー窓が開きます。XやThreadsへワンタップでシェア可能です。",
    tips: [
      "毎日1文の継続がリスニング・スピーキング力向上の最短ルートです",
      "設定画面から「復習カルテ」や「弱点分析」もいつでも見直せます",
    ],
    preferredPlacement: "center",
  },
];

interface OnboardingTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export function OnboardingTourModal({
  isOpen,
  onClose,
  onComplete,
}: OnboardingTourModalProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const currentStep = TOUR_STEPS[currentStepIndex];

  // Update target rect on step change or resize/scroll
  const updateTargetRect = useCallback(() => {
    if (!currentStep) return;
    const targetElement = document.getElementById(currentStep.targetId);
    if (targetElement) {
      const rect = targetElement.getBoundingClientRect();
      setTargetRect(rect);
    } else {
      setTargetRect(null);
    }
  }, [currentStep]);

  useEffect(() => {
    if (!isOpen || !currentStep) return;

    const targetElement = document.getElementById(currentStep.targetId);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    const timer = setTimeout(() => {
      updateTargetRect();
    }, 250);

    const handleScrollOrResize = () => {
      updateTargetRect();
    };

    window.addEventListener("scroll", handleScrollOrResize, { passive: true });
    window.addEventListener("resize", handleScrollOrResize, { passive: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", handleScrollOrResize);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [isOpen, currentStepIndex, currentStep, updateTargetRect]);

  if (!isOpen || !currentStep) return null;

  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === TOUR_STEPS.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      if (onComplete) onComplete();
      onClose();
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    if (onComplete) onComplete();
    onClose();
  };

  const IconComponent = currentStep.icon;

  // Determine smart placement of the tooltip card
  const isTopPlacement = currentStep.preferredPlacement === "top";
  const isCenterPlacement =
    currentStep.preferredPlacement === "center" || !targetRect;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-modal-title"
      className="fixed inset-0 z-[9990] overflow-hidden"
    >
      {/* ── SVG Spotlight Mask Backdrop ── */}
      <svg
        className="fixed inset-0 w-full h-full pointer-events-none transition-all duration-300"
        aria-hidden="true"
      >
        <defs>
          <mask id="tour-spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {targetRect && (
              <rect
                x={Math.max(4, targetRect.left - 8)}
                y={Math.max(4, targetRect.top - 8)}
                width={targetRect.width + 16}
                height={targetRect.height + 16}
                rx="18"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(15, 23, 42, 0.78)"
          mask="url(#tour-spotlight-mask)"
        />
      </svg>

      {/* ── Spotlight Pulsing Ring ── */}
      {targetRect && (
        <div
          style={{
            position: "fixed",
            left: Math.max(4, targetRect.left - 8),
            top: Math.max(4, targetRect.top - 8),
            width: targetRect.width + 16,
            height: targetRect.height + 16,
          }}
          className="pointer-events-none z-[9991] rounded-2xl ring-4 ring-primary shadow-2xl ring-offset-2 ring-offset-background/50 animate-pulse duration-1000"
        />
      )}

      {/* ── Interactive Tour Card Container ── */}
      <div
        className={`fixed inset-0 pointer-events-none flex p-4 sm:p-6 ${
          isCenterPlacement
            ? "items-center justify-center"
            : isTopPlacement
              ? "items-start justify-center pt-8 sm:pt-14"
              : "items-end justify-center pb-24 sm:pb-16"
        }`}
      >
        <div className="pointer-events-auto w-full max-w-md bg-card/98 backdrop-blur-xl border-2 border-primary/40 rounded-3xl shadow-2xl p-5 sm:p-6 space-y-4 animate-in fade-in zoom-in-95 duration-300 ring-1 ring-white/20 relative">
          {/* Header Row */}
          <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-primary/15 text-primary text-xs font-black tracking-wide border border-primary/25">
                {currentStep.badge}
              </span>
              <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <span>🧭</span>
                <span>対話型ツアー</span>
              </span>
            </div>

            <button
              type="button"
              onClick={handleSkip}
              className="text-xs font-bold text-muted-foreground hover:text-foreground transition px-2 py-1 rounded-lg hover:bg-muted active:scale-95 cursor-pointer flex items-center gap-1"
              title="ツアーをスキップ"
            >
              <span>スキップ</span>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Main Title & Icon */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
                <IconComponent className="w-5 h-5" />
              </div>
              <h2
                id="tour-modal-title"
                className="text-base sm:text-lg font-black tracking-tight text-foreground leading-snug"
              >
                {currentStep.title}
              </h2>
            </div>
            <p className="text-xs font-bold text-primary pl-0.5">
              {currentStep.summary}
            </p>
          </div>

          {/* Body Description */}
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {currentStep.description}
          </p>

          {/* Pro Tips Box */}
          {currentStep.tips && currentStep.tips.length > 0 && (
            <div className="p-3 rounded-2xl bg-muted/60 border border-border/80 space-y-1.5 text-[11px] sm:text-xs">
              <div className="flex items-center gap-1.5 font-bold text-foreground">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>ワンポイント上達の秘訣</span>
              </div>
              <ul className="space-y-1 text-muted-foreground pl-3.5 list-disc marker:text-primary">
                {currentStep.tips.map((tip, idx) => (
                  <li key={idx} className="leading-normal">
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Progress Indicators and Navigation Buttons */}
          <div className="pt-2 flex items-center justify-between gap-3 border-t border-border/60">
            {/* Step Dots */}
            <div className="flex items-center gap-1.5">
              {TOUR_STEPS.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentStepIndex(idx)}
                  className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                    idx === currentStepIndex
                      ? "w-6 bg-primary"
                      : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/60"
                  }`}
                  aria-label={`ステップ ${idx + 1} へ移動`}
                />
              ))}
            </div>

            {/* Back / Next Buttons */}
            <div className="flex items-center gap-2">
              {!isFirstStep && (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-xs font-bold bg-muted hover:bg-muted/80 text-foreground transition active:scale-95 cursor-pointer min-h-[38px]"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>戻る</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center justify-center gap-1.5 px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition shadow-md shadow-primary/25 active:scale-95 cursor-pointer min-h-[38px]"
              >
                <span>{isLastStep ? "完了して練習を始める ✨" : "次へ"}</span>
                {!isLastStep && <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
