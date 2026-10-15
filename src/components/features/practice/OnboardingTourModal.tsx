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
      "ネイティブ音声を聴いてリズムを確認。[0.8x / 1.0x / 1.2x] で自分に合った話速（WPM）に調整できます。",
    preferredPlacement: "bottom",
  },
  {
    stepNumber: 2,
    targetId: "tour-sentence-text",
    badge: "STEP 2 / 4",
    title: "意味のかたまり（/）& 3D単語フリップ",
    icon: BookOpen,
    description:
      "スラッシュ（/）は息継ぎの目安。単語タップで日本語訳と音声が開き、弱点単語帳に自動登録されます。",
    preferredPlacement: "bottom",
  },
  {
    stepNumber: 3,
    targetId: "tour-recording-bar",
    badge: "STEP 3 / 4",
    title: "目的別の2大録音モード",
    icon: Mic,
    description:
      "「🗣️ 音読録音（青）」で発音を確認。「🎧 シャドーイング録音（紫）」でお手本と同時に発声して耳と口を鍛えます。",
    preferredPlacement: "top",
  },
  {
    stepNumber: 4,
    targetId: "tour-finish-section",
    badge: "STEP 4 / 4",
    title: "今日の学習を終了 & 成果シェア",
    icon: Award,
    description:
      "1問だけでもOK！「🏁 今日の学習を終了」で本日の発話数・WPMを記録し、成果をSNSへワンタップでシェアできます。",
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
    top: `${Math.max(80, (vHeight - 190) / 2)}px`,
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
      placement = spaceAbove >= 140 ? "top" : "bottom";
    } else if (currentStep.preferredPlacement === "bottom") {
      placement = spaceBelow >= 150 ? "bottom" : "top";
    } else {
      placement = spaceBelow >= 160 ? "bottom" : "top";
    }

    if (placement === "bottom") {
      const top = Math.min(vHeight - 170, Math.max(16, targetRect.bottom + 12));
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
          className="pointer-events-none z-[9991] rounded-2xl ring-4 ring-primary shadow-2xl ring-offset-2 ring-offset-background/50 animate-pulse duration-1000"
        />
      )}

      {/* ── Speech Bubble (吹き出し) ── */}
      <div
        style={bubbleStyle}
        className="z-[9995] pointer-events-auto bg-card/98 backdrop-blur-xl border-2 border-primary/50 rounded-2xl shadow-2xl p-4 sm:p-5 ring-1 ring-white/20 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* 吹き出しの三角ポインター（上向き: ターゲットが上にある場合） */}
        {placement === "bottom" && (
          <div
            style={{ left: `${arrowLeft}px` }}
            className="absolute -top-2 w-3.5 h-3.5 bg-card border-t-2 border-l-2 border-primary/50 rotate-45 -translate-x-1/2 z-10"
          />
        )}

        {/* 吹き出しの三角ポインター（下向き: ターゲットが下にある場合） */}
        {placement === "top" && (
          <div
            style={{ left: `${arrowLeft}px` }}
            className="absolute -bottom-2 w-3.5 h-3.5 bg-card border-b-2 border-r-2 border-primary/50 rotate-45 -translate-x-1/2 z-10"
          />
        )}

        {/* Header: Badge, Title & Skip Button */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] sm:text-xs font-black tracking-wide border border-primary/25">
              {currentStep.badge}
            </span>
            <div className="flex items-center gap-1">
              <IconComponent className="w-3.5 h-3.5 text-primary shrink-0" />
              <h2
                id="tour-modal-title"
                className="text-xs sm:text-sm font-black text-foreground leading-snug"
              >
                {currentStep.title}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSkip}
            className="text-[11px] font-bold text-muted-foreground hover:text-foreground transition px-1.5 py-0.5 rounded-md hover:bg-muted active:scale-95 cursor-pointer shrink-0"
            title="ツアーをスキップ"
          >
            スキップ
          </button>
        </div>

        {/* Concise Description */}
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-3 font-medium">
          {currentStep.description}
        </p>

        {/* Footer: Step Dots & Navigation Buttons */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/50">
          {/* Step Dots */}
          <div className="flex items-center gap-1.5">
            {TOUR_STEPS.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentStepIndex(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  idx === currentStepIndex
                    ? "w-4 bg-primary"
                    : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/60"
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
                className="inline-flex items-center justify-center gap-0.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-muted hover:bg-muted/80 text-foreground transition active:scale-95 cursor-pointer min-h-[32px]"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>戻る</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center justify-center gap-1 px-3 sm:px-4 py-1.5 rounded-lg text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition shadow-sm active:scale-95 cursor-pointer min-h-[32px]"
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
