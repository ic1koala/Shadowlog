"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";

// Candidate #2: Particle Convergence (adopted by vote)
// Particles scaled to converge to a compact center footprint per user request
const COMPACT_PARTICLES = [
  { x: -75, y: -50, size: 4, color: "#60A5FA", delay: "0.05s" },
  { x: 80, y: -45, size: 3.5, color: "#FFFFFF", delay: "0.1s" },
  { x: -85, y: 40, size: 4.5, color: "#3B82F6", delay: "0.08s" },
  { x: 70, y: 55, size: 4, color: "#93C5FD", delay: "0.12s" },
  { x: 0, y: -70, size: 5, color: "#FFFFFF", delay: "0.02s" },
  { x: -50, y: 65, size: 3.5, color: "#2563EB", delay: "0.15s" },
  { x: 60, y: -20, size: 4, color: "#FFFFFF", delay: "0.06s" },
  { x: -60, y: -15, size: 3.5, color: "#60A5FA", delay: "0.11s" },
  { x: 25, y: 70, size: 4.5, color: "#3B82F6", delay: "0.04s" },
  { x: -35, y: -60, size: 4, color: "#FFFFFF", delay: "0.09s" },
];

interface AppLaunchSplashProps {
  /** Optional callback fired when the splash animation completes or is skipped */
  onFinished?: () => void;
  /** Force-show even if already shown in this tab session (default: false) */
  forceShow?: boolean;
}

export function AppLaunchSplash({
  onFinished,
  forceShow = false,
}: AppLaunchSplashProps) {
  const [mounted, setMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isFading, setIsFading] = useState(false);
  const fadeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleDismiss = useCallback(() => {
    if (!isVisible || isFading) return;
    setIsFading(true);
    closeTimerRef.current = setTimeout(() => {
      setIsVisible(false);
      if (onFinished) onFinished();
    }, 250);
  }, [isVisible, isFading, onFinished]);

  useEffect(() => {
    setMounted(true);

    // Show once per tab/reload session unless forceShow is true
    setIsVisible(true);

    // Auto dissolve fade-out: Total 5.0s (4.0s display + 1.0s dissolve) per user request
    fadeTimerRef.current = setTimeout(() => {
      setIsFading(true);
      closeTimerRef.current = setTimeout(() => {
        setIsVisible(false);
        if (onFinished) onFinished();
      }, 1000);
    }, 4000);

    return () => {
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, [forceShow, onFinished]);

  if (!mounted || !isVisible) return null;

  return (
    <div
      role="dialog"
      aria-label="アプリ起動ロゴアニメーション"
      onClick={handleDismiss}
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#060911] text-white select-none cursor-pointer transition-opacity duration-1000 ease-in-out ${
        isFading ? "opacity-0 pointer-events-none" : "opacity-100 pointer-events-auto"
      }`}
    >
      {/* Centered compact stage */}
      <div className="relative flex flex-col items-center justify-center p-4">
        {/* Converging light particles */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {COMPACT_PARTICLES.map((p, i) => (
            <span
              key={i}
              className="absolute rounded-full animate-[particleConverge_1.1s_cubic-bezier(0.4,0,0.2,1)_forwards]"
              style={
                {
                  width: p.size,
                  height: p.size,
                  backgroundColor: p.color,
                  boxShadow: `0 0 10px ${p.color}`,
                  "--start-x": `${p.x}px`,
                  "--start-y": `${p.y}px`,
                  animationDelay: p.delay,
                  opacity: 0,
                } as React.CSSProperties
              }
            />
          ))}
        </div>

        {/* Ambient glow flash on particle convergence */}
        <div className="absolute w-24 h-24 rounded-full bg-blue-500/35 blur-xl animate-[convergeFlash_2.4s_ease-out_forwards]" />

        {/* Materializing Compact Official Icon & Text (小さめ・中央) */}
        <div className="flex flex-col items-center animate-[convergeLogoMaterialize_2.4s_cubic-bezier(0.16,1,0.3,1)_forwards]">
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-[22%] overflow-hidden shadow-[0_0_30px_rgba(37,99,235,0.6)]">
            <Image
              src="/icons/icon-512.png"
              alt="ShadowLog Official Icon"
              width={64}
              height={64}
              className="w-full h-full object-cover"
              priority
            />
          </div>

          <div className="mt-3">
            <span
              className="font-extrabold tracking-tight font-sans text-xl sm:text-2xl leading-none select-none text-white"
              style={{ letterSpacing: "-0.03em" }}
            >
              Shadow<span className="text-[#3B82F6]">Log</span>
            </span>
          </div>
        </div>
      </div>

      {/* Subtle skip prompt */}
      <div className="absolute bottom-6 text-[10px] sm:text-xs text-white/40 tracking-wider font-medium">
        タップしてスキップ
      </div>
    </div>
  );
}
