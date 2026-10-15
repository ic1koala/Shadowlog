"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Volume2,
  BookOpen,
  Mic,
  Award,
  ChevronRight,
  ChevronLeft,
  X,
} from "lucide-react";

export interface TourStep {
  stepNumber: number;
  targetId: string;
  badge: string;
  title: string;
  icon: typeof Volume2;
  description: string;
  preferredPlacement?: "top" | "bottom" | "center";
}

export const TOUR_STEPS: TourStep[] = [
  {
    stepNumber: 1,
    targetId: "tour-audio-player",
    badge: "STEP 1 / 4",
    title: "模範音声 & 速度調整",
    icon: Volume2,
    description:
      "「フレーズ音声を聴く」でネイティブの発音とリズムを確認できます。右側の [0.8x / 1.0x / 1.2x] ボタンで自分に合った話速（WPM）に調整可能です。まずは標準速度で耳を慣らし、全体のイントネーションを掴みましょう。",
    preferredPlacement: "bottom",
  },
  {
    stepNumber: 2,
    targetId: "tour-sentence-text",
    badge: "STEP 2 / 4",
    title: "意味のかたまり（/）& 3D単語フリップ",
    icon: BookOpen,
    description:
      "青いスラッシュ（/）は息継ぎと意味の区切り（チャンク）の目印です。わからない単語をタップするとカードが立体回転し、日本語訳と音声が再生されます。調べた単語は弱点単語帳に自動保存され、いつでも復習可能です。",
    preferredPlacement: "bottom",
  },
  {
    stepNumber: 3,
    targetId: "tour-recording-bar",
    badge: "STEP 3 / 4",
    title: "目的別の2大録音モード",
    icon: Mic,
    description:
      "「🗣️ 音読録音（青）」はお手本を停止し、自分のペースで発音練習ができます。「🎧 シャドーイング録音（紫）」はお手本と同時に発声して耳と口を鍛えます。まずは音読で口を慣らし、次にシャドーイングに挑戦しましょう。",
    preferredPlacement: "top",
  },
  {
    stepNumber: 4,
    targetId: "tour-finish-section",
    badge: "STEP 4 / 4",
    title: "今日の学習を終了 & 成果シェア",
    icon: Award,
    description:
      "練習後に「🏁 今日の学習を終了」を押すと本日の学習サマリーが開きます。1問だけでもOK！総発話単語数や実効WPM、連続ストリークが記録されます。日々の成長をワンタップでXやThreadsへシェアして習慣化しましょう。",
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

  // Update target bounding rect
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
      const isBottomTarget =
        currentStep.targetId === "tour-recording-bar" ||
        currentStep.targetId === "tour-finish-section";
      targetElement.scrollIntoView({
        behavior: "smooth",
        block: isBottomTarget ? "end" : "center",
      });
    }

    // Refresh rect across scroll animation intervals
    updateTargetRect();
    const t1 = setTimeout(updateTargetRect, 80);
    const t2 = setTimeout(updateTargetRect, 220);
    const t3 = setTimeout(updateTargetRect, 450);

    const handleScrollOrResize = () => {
      updateTargetRect();
    };

    window.addEventListener("scroll", handleScrollOrResize, { passive: true });
    window.addEventListener("resize", handleScrollOrResize, { passive: true });

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
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

  // Calculate speech bubble position and arrow alignment (Zero Overlap with highlighted target)
  const vWidth = typeof window !== "undefined" ? window.innerWidth : 390;
  const vHeight = typeof window !== "undefined" ? window.innerHeight : 844;
  const bubbleWidth = Math.min(vWidth - 32, 380);

  let placement: "top" | "bottom" | "center" = "center";
  let bubbleStyle: React.CSSProperties = {
    position: "fixed",
    left: `${Math.max(16, (vWidth - bubbleWidth) / 2)}px`,
    top: `${Math.max(80, (vHeight - 210) / 2)}px`,
    width: `${bubbleWidth}px`,
  };
  let arrowLeft = bubbleWidth / 2;

  if (targetRect && currentStep.preferredPlacement !== "center") {
    const targetCenterX = targetRect.left + targetRect.width / 2;
    const computedLeft = Math.max(
      16,
      Math.min(vWidth - bubbleWidth - 16, targetCenterX - bubbleWidth / 2)
    );
    arrowLeft = Math.max(24, Math.min(bubbleWidth - 24, targetCenterX - computedLeft));

    const spaceBelow = vHeight - targetRect.bottom;
    const spaceAbove = targetRect.top;

    if (currentStep.preferredPlacement === "top") {
      placement = spaceAbove >= 160 ? "top" : "bottom";
    } else if (currentStep.preferredPlacement === "bottom") {
      placement = spaceBelow >= 170 ? "bottom" : "top";
    } else {
      placement = spaceBelow >= 180 ? "bottom" : "top";
    }

    if (placement === "bottom") {
      const top = Math.min(vHeight - 190, Math.max(16, targetRect.bottom + 12));
      bubbleStyle = {
        position: "fixed",
        left: `${computedLeft}px`,
        top: `${top}px`,
        width: `${bubbleWidth}px`,
      };
    } else {
      const bottom = Math.max(16, vHeight - targetRect.top + 12);
      bubbleStyle = {
        position: "fixed",
        left: `${computedLeft}px`,
        bottom: `${bottom}px`,
        width: `${bubbleWidth}px`,
      };
    }
  }

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
                rx="16"
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
          fill="rgba(15, 23, 42, 0.75)"
          mask="url(#tour-spotlight-mask)"
        />
      </svg>

      {/* ── Spotlight Pulsing Ring (Highlights target without obstruction) ── */}
      {targetRect && (
        <div
          style={{
            position: "fixed",
            left: Math.max(4, targetRect.left - 8),
            top: Math.max(4, targetRect.top - 8),
            width: targetRect.width + 16,
            height: targetRect.height + 16,
          }}
          className="pointer-events-none z-[9991] rounded-2xl ring-4 ring-amber-400 shadow-2xl ring-offset-2 ring-offset-background/50 animate-pulse duration-1000"
        />
      )}

      {/* ── Speech Bubble (吹き出し: 明るく読みやすいソフトイエロー背景) ── */}
      <div
        style={bubbleStyle}
        className="z-[9995] pointer-events-auto bg-[#FFFDF0] border-2 border-amber-400 rounded-2xl shadow-2xl p-4 sm:p-5 ring-2 ring-amber-300/40 text-slate-900 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* 吹き出しの三角ポインター（上向き: ターゲットが上にある場合） */}
        {placement === "bottom" && (
          <div
            style={{ left: `${arrowLeft}px` }}
            className="absolute -top-2 w-3.5 h-3.5 bg-[#FFFDF0] border-t-2 border-l-2 border-amber-400 rotate-45 -translate-x-1/2 z-10"
          />
        )}

        {/* 吹き出しの三角ポインター（下向き: ターゲットが下にある場合） */}
        {placement === "top" && (
          <div
            style={{ left: `${arrowLeft}px` }}
            className="absolute -bottom-2 w-3.5 h-3.5 bg-[#FFFDF0] border-b-2 border-r-2 border-amber-400 rotate-45 -translate-x-1/2 z-10"
          />
        )}

        {/* Header: Badge, Title & Skip Button */}
        <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-amber-200/80">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="px-2 py-0.5 rounded-full bg-amber-200/90 text-amber-950 text-[10px] sm:text-xs font-black tracking-wide border border-amber-300/80 shadow-2xs">
              {currentStep.badge}
            </span>
            <div className="flex items-center gap-1.5">
              <IconComponent className="w-4 h-4 text-amber-700 shrink-0" />
              <h2
                id="tour-modal-title"
                className="text-xs sm:text-sm font-black text-amber-950 leading-snug"
              >
                {currentStep.title}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSkip}
            className="text-[11px] font-bold text-amber-800/80 hover:text-amber-950 transition px-1.5 py-0.5 rounded-md hover:bg-amber-100 active:scale-95 cursor-pointer shrink-0"
            title="ツアーをスキップ"
          >
            スキップ
          </button>
        </div>

        {/* 3-Line Concise & Readable Description */}
        <p className="text-xs sm:text-[13px] text-slate-800 font-medium leading-relaxed mb-3">
          {currentStep.description}
        </p>

        {/* Footer: Step Dots & Navigation Buttons */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-amber-200/80">
          {/* Step Dots */}
          <div className="flex items-center gap-1.5">
            {TOUR_STEPS.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentStepIndex(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  idx === currentStepIndex
                    ? "w-4 bg-amber-500"
                    : "w-1.5 bg-amber-200 hover:bg-amber-300"
                }`}
                aria-label={`ステップ ${idx + 1} へ移動`}
              />
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center gap-1.5">
            {!isFirstStep && (
              <button
                type="button"
                onClick={handlePrev}
                className="inline-flex items-center justify-center gap-0.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-amber-100 hover:bg-amber-200 text-amber-950 transition active:scale-95 cursor-pointer min-h-[32px] border border-amber-200"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>戻る</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center justify-center gap-1 px-3 sm:px-4 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white transition shadow-sm shadow-amber-500/25 active:scale-95 cursor-pointer min-h-[32px]"
            >
              <span>{isLastStep ? "完了して練習を始める ✨" : "次へ"}</span>
              {!isLastStep && <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
