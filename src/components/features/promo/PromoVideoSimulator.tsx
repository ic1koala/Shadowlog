"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Smartphone,
  Monitor,
  Sparkles,
  Mic,
  Headphones,
  Activity,
  CheckCircle2,
  TrendingUp,
  Flame,
  Video,
  Award,
} from "lucide-react";

interface PromoVideoSimulatorProps {
  onFullScreenChange?: (isFull: boolean) => void;
}

// 20% scaled down particles for logo animation 2
const PARTICLES = [
  { x: -112, y: -72, size: 5.5, color: "#60A5FA", delay: "0.05s" },
  { x: 120, y: -64, size: 5, color: "#FFFFFF", delay: "0.1s" },
  { x: -128, y: 56, size: 6.5, color: "#3B82F6", delay: "0.08s" },
  { x: 104, y: 80, size: 5, color: "#93C5FD", delay: "0.12s" },
  { x: 0, y: -104, size: 7, color: "#FFFFFF", delay: "0.02s" },
  { x: -72, y: 96, size: 5, color: "#2563EB", delay: "0.15s" },
  { x: 88, y: -32, size: 5.5, color: "#FFFFFF", delay: "0.06s" },
  { x: -88, y: -24, size: 5, color: "#60A5FA", delay: "0.11s" },
  { x: 40, y: 104, size: 6.5, color: "#3B82F6", delay: "0.04s" },
  { x: -48, y: -88, size: 5.5, color: "#FFFFFF", delay: "0.09s" },
  { x: 112, y: 32, size: 4, color: "#38BDF8", delay: "0.14s" },
  { x: -32, y: 64, size: 5, color: "#818CF8", delay: "0.07s" },
];

export function PromoVideoSimulator({ onFullScreenChange }: PromoVideoSimulatorProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0); // in seconds
  const [aspectRatio, setAspectRatio] = useState<"vertical" | "horizontal">("vertical");
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showRecordingGuide, setShowRecordingGuide] = useState(false);

  const duration = 18.0; // Total 18 seconds
  const animFrameRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Sound Synthesizer via Web Audio API
  const playSound = useCallback((type: "particle" | "click" | "beep" | "success" | "transition") => {
    if (isMuted) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "particle") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.35);
        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.12, now + 0.2);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === "click") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(750, now);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.05);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === "beep") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.setValueAtTime(800, now + 0.06);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
        osc.start(now);
        osc.stop(now + 0.14);
      } else if (type === "transition") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.25);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === "success") {
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
          const chordOsc = ctx.createOscillator();
          const chordGain = ctx.createGain();
          chordOsc.connect(chordGain);
          chordGain.connect(ctx.destination);
          chordOsc.type = "sine";
          chordOsc.frequency.setValueAtTime(freq, now + idx * 0.04);
          chordGain.gain.setValueAtTime(0.09, now + idx * 0.04);
          chordGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
          chordOsc.start(now + idx * 0.04);
          chordOsc.stop(now + 0.6);
        });
      }
    } catch {
      // Audio fallback silent
    }
  }, [isMuted]);

  // Main animation ticker loop
  useEffect(() => {
    if (!isPlaying) {
      lastTimestampRef.current = null;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    const loop = (timestamp: number) => {
      if (lastTimestampRef.current === null) {
        lastTimestampRef.current = timestamp;
      }
      const deltaSec = ((timestamp - lastTimestampRef.current) / 1000) * playbackSpeed;
      lastTimestampRef.current = timestamp;

      setCurrentTime((prev) => {
        const next = prev + deltaSec;
        if (next >= duration) {
          setIsPlaying(false);
          return duration;
        }
        return next;
      });

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, playbackSpeed, duration]);

  // Sound triggers at scene boundaries
  const lastSceneRef = useRef<number>(-1);
  useEffect(() => {
    let currentScene = 0;
    if (currentTime < 3.2) currentScene = 1;
    else if (currentTime < 7.2) currentScene = 2;
    else if (currentTime < 11.5) currentScene = 3;
    else if (currentTime < 15.0) currentScene = 4;
    else currentScene = 5;

    if (currentScene !== lastSceneRef.current && isPlaying) {
      lastSceneRef.current = currentScene;
      if (currentScene === 1) playSound("particle");
      else if (currentScene === 2) playSound("click");
      else if (currentScene === 3) playSound("beep");
      else if (currentScene === 4) playSound("success");
      else if (currentScene === 5) playSound("transition");
    }
  }, [currentTime, isPlaying, playSound]);

  const togglePlay = () => {
    if (currentTime >= duration) {
      setCurrentTime(0);
    }
    setIsPlaying(!isPlaying);
  };

  const handleRestart = () => {
    setCurrentTime(0);
    setIsPlaying(true);
  };

  const toggleFullScreen = () => {
    const next = !isFullScreen;
    setIsFullScreen(next);
    onFullScreenChange?.(next);
  };

  // Timeline Scene Definitions
  const t = currentTime;
  const isScene1 = t >= 0 && t < 3.2;   // Logo Animation ②: Particle Convergence
  const isScene2 = t >= 3.2 && t < 7.2; // Practice Screen & Chunk Slashes & Word 3D Dict
  const isScene3 = t >= 7.2 && t < 11.5; // Repeating / Shadowing 2-Button Recording & Live Waveform/WPM
  const isScene4 = t >= 11.5 && t < 15.0; // Whisper AI Diff Analysis & Word Accuracy Breakdown
  const isScene5 = t >= 15.0 && t <= 18.0; // Streaks (Heatmap) & Brand Outro CTA

  // Camera zoom dynamics
  let cameraScale = 1.0;
  let cameraTranslateY = 0;
  if (isScene1) {
    cameraScale = 1.0;
    cameraTranslateY = 0;
  } else if (isScene2) {
    const p = (t - 3.2) / 4.0;
    cameraScale = 1.0 + p * 0.1;
    cameraTranslateY = -p * 15;
  } else if (isScene3) {
    const p = (t - 7.2) / 4.3;
    cameraScale = 1.1 + p * 0.08;
    cameraTranslateY = -15 - p * 15;
  } else if (isScene4) {
    const p = (t - 11.5) / 3.5;
    cameraScale = 1.18 - p * 0.06;
    cameraTranslateY = -30 + p * 10;
  } else if (isScene5) {
    const p = (t - 15.0) / 3.0;
    cameraScale = 1.12 - p * 0.15;
    cameraTranslateY = -20 + p * 20;
  }

  // 3D Horizontal Flip Transition on Feature Changes (3.2s, 7.2s, 11.5s, 15.0s)
  const getFlipTransform = (time: number) => {
    const transitions = [
      { at: 3.2, duration: 0.45 },
      { at: 7.2, duration: 0.45 },
      { at: 11.5, duration: 0.45 },
      { at: 15.0, duration: 0.45 },
    ];

    for (const tr of transitions) {
      const half = tr.duration / 2;
      const diff = time - tr.at;
      if (diff >= -half && diff <= half) {
        if (diff < 0) {
          // 前半: 0deg -> 90deg（右へ裏返る）
          const p = (diff + half) / half; // 0 -> 1
          const rotY = p * 90;
          const scale = 1 - p * 0.08;
          return {
            transform: `perspective(900px) rotateY(${rotY.toFixed(1)}deg) scale(${scale.toFixed(3)})`,
            opacity: Math.max(0.15, 1 - p * 0.85),
          };
        } else {
          // 後半: -90deg -> 0deg（左から表れる）
          const p = diff / half; // 0 -> 1
          const rotY = -90 + p * 90;
          const scale = 0.92 + p * 0.08;
          return {
            transform: `perspective(900px) rotateY(${rotY.toFixed(1)}deg) scale(${scale.toFixed(3)})`,
            opacity: Math.min(1, 0.15 + p * 0.85),
          };
        }
      }
    }

    return {
      transform: "perspective(900px) rotateY(0deg) scale(1)",
      opacity: 1,
    };
  };

  const flipStyle = getFlipTransform(t);

  // WPM meter gauge calculation during Scene 3
  const wpmValue = Math.min(
    142,
    Math.round(isScene3 ? 85 + Math.pow((t - 7.2) / 4.3, 1.2) * 57 : isScene4 || isScene5 ? 142 : 0)
  );

  return (
    <div
      className={`relative flex flex-col items-center justify-center transition-colors duration-300 ${
        isFullScreen ? "fixed inset-0 z-50 bg-[#040711] overflow-hidden" : "w-full max-w-4xl mx-auto"
      }`}
    >
      {/* Video Viewport Container */}
      <div
        className={`relative overflow-hidden bg-gradient-to-br from-[#070B16] via-[#0C1222] to-[#050814] shadow-2xl border border-slate-800/80 transition-all duration-300 flex items-center justify-center ${
          isFullScreen
            ? "w-full h-full rounded-none"
            : aspectRatio === "vertical"
            ? "w-[360px] sm:w-[390px] h-[640px] sm:h-[690px] rounded-3xl"
            : "w-full aspect-video max-h-[580px] rounded-2xl"
        }`}
      >
        {/* Ambient Glow Atmosphere */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[340px] h-[340px] rounded-full blur-[90px] transition-all duration-1000"
            style={{
              background: isScene1
                ? "radial-gradient(circle, rgba(56,189,248,0.28) 0%, rgba(37,99,235,0.2) 60%, transparent 100%)"
                : isScene3
                ? "radial-gradient(circle, rgba(168,85,247,0.25) 0%, rgba(59,130,246,0.15) 60%, transparent 100%)"
                : isScene4
                ? "radial-gradient(circle, rgba(34,197,94,0.25) 0%, rgba(59,130,246,0.15) 60%, transparent 100%)"
                : isScene5
                ? "radial-gradient(circle, rgba(245,158,11,0.28) 0%, rgba(234,88,12,0.15) 60%, transparent 100%)"
                : "radial-gradient(circle, rgba(59,130,246,0.25) 0%, rgba(99,102,241,0.12) 60%, transparent 100%)",
            }}
          />
          <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:24px_24px]" />
        </div>

        {/* Dynamic Scene Stage */}
        <div
          className="relative w-full h-full flex flex-col items-center justify-between p-4 sm:p-6 transition-transform ease-out"
          style={{
            transform: `scale(${cameraScale}) translateY(${cameraTranslateY}px)`,
            transformOrigin: "center center",
          }}
        >
          {/* Top Overlaid Subtitles / Copy */}
          <div className="w-full text-center z-20 pt-2 sm:pt-4 min-h-[70px] flex items-center justify-center">
            {isScene1 && (
              <div className="animate-fade-in space-y-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 backdrop-blur-md">
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  声に出して身につける、新しい英語習慣
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight drop-shadow-md">
                  AIシャドーイング ＆ 発話習熟SaaS<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300">
                    ShadowLog（シャドーログ）
                  </span>
                </h2>
              </div>
            )}

            {isScene2 && (
              <div className="animate-fade-in space-y-1">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 backdrop-blur-md">
                  <Sparkles className="w-3 h-3" />
                  4大実務ジャンル ＆ チャンク(/)表示
                </span>
                <h2 className="text-lg sm:text-xl font-extrabold text-white">
                  意味のカタマリごとに発話できるから、<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                    英語の語順のままスラスラ理解！
                  </span>
                </h2>
              </div>
            )}

            {isScene3 && (
              <div className="animate-fade-in space-y-1">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 animate-pulse backdrop-blur-md">
                  <Headphones className="w-3 h-3" />
                  リピーティング ＆ シャドーイング
                </span>
                <h2 className="text-lg sm:text-xl font-extrabold text-white">
                  お手本を追いかけて声に出す。<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-300">
                    話すスピード（WPM）もリアルタイム可視化！
                  </span>
                </h2>
              </div>
            )}

            {isScene4 && (
              <div className="animate-fade-in space-y-1">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 backdrop-blur-md">
                  <CheckCircle2 className="w-3 h-3" />
                  Whisper AI 精密音声認識 ＆ Diff判定
                </span>
                <h2 className="text-lg sm:text-xl font-extrabold text-white">
                  詰まった単語や発音の抜け落ちを、<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
                    AIが1語単位で可視化・弱点を自動蓄積！
                  </span>
                </h2>
              </div>
            )}

            {isScene5 && (
              <div className="animate-fade-in space-y-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 backdrop-blur-md animate-pulse">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  🎉 2026年11月 正式配信スタート！
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  AIシャドーイングの新習慣を、最速で。<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-orange-400 font-black">
                    Waitlist登録受付中（無料先行特典つき）
                  </span>
                </h2>
              </div>
            )}
          </div>

          {/* Center Stage: Scene 1 (Logo Animation ② Particle Convergence) OR Phone Mockup */}
          {isScene1 ? (
            /* Scene 1: Logo Animation ② Particle Convergence */
            <div className="relative my-auto flex flex-col items-center justify-center animate-fade-in">
              {/* Converging Light Particles */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {PARTICLES.map((p, i) => {
                  const progress = Math.min(1, Math.max(0, (t - parseFloat(p.delay)) / 1.0));
                  const curX = p.x * (1 - progress);
                  const curY = p.y * (1 - progress);
                  const op = progress > 0 ? (progress < 0.9 ? 1 : (1.0 - progress) * 10) : 0;
                  return (
                    <span
                      key={i}
                      className="absolute rounded-full transition-transform duration-75"
                      style={{
                        width: p.size,
                        height: p.size,
                        backgroundColor: p.color,
                        boxShadow: `0 0 14px ${p.color}`,
                        transform: `translate(${curX}px, ${curY}px)`,
                        opacity: op,
                      }}
                    />
                  );
                })}
              </div>

              {/* Flash Ring at convergence */}
              {t >= 1.0 && t <= 2.2 && (
                <div
                  className="absolute rounded-full bg-blue-500/40 blur-2xl animate-ping"
                  style={{ width: "160px", height: "160px" }}
                />
              )}

              {/* Materializing Official Brand Icon & Text (Scaled down 20% by user request) */}
              <div
                className="flex flex-col items-center transition-all duration-700"
                style={{
                  opacity: t < 0.9 ? 0 : Math.min(1, (t - 0.9) * 2),
                  transform: `scale(${t < 0.9 ? 0.64 : Math.min(0.8, 0.64 + (t - 0.9) * 0.16)})`,
                }}
              >
                <div className="relative w-20 h-20 sm:w-22 sm:h-22 rounded-[24%] overflow-hidden shadow-[0_0_40px_rgba(37,99,235,0.7)] border-2 border-blue-400/40">
                  <Image
                    src="/icons/icon-512.png"
                    alt="ShadowLog Official Icon"
                    width={88}
                    height={88}
                    className="w-full h-full object-cover"
                    priority
                  />
                </div>
                <div className="mt-3 text-center">
                  <span className="font-extrabold text-2xl sm:text-3xl tracking-tight text-white select-none">
                    Shadow<span className="text-blue-400">Log</span>
                  </span>
                  <p className="text-[11px] text-blue-300/80 font-medium tracking-wide mt-0.5">
                    AI SHADOWING COACH
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Scenes 2〜5: 3D Smartphone Mockup (iPhone 15 Pro 19.5:9 Aspect Ratio) */
            <div className="relative my-auto z-10 animate-fade-in">
              {/* iPhone 15 Pro Frame (19.5:9 Ratio) */}
              <div
                className={`relative bg-[#090D1A] rounded-[46px] border-[3.5px] border-slate-700/90 ring-1 ring-slate-600/40 shadow-[0_25px_60px_rgba(0,0,0,0.85),0_0_35px_rgba(37,99,235,0.22)] overflow-hidden transition-all duration-500 ${
                  aspectRatio === "vertical" ? "w-[240px] h-[520px]" : "w-[184px] h-[398px]"
                }`}
              >
                {/* iPhone 15 Pro Dynamic Island */}
                <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-20 h-4 bg-black rounded-full z-30 flex items-center justify-between px-2 border border-slate-800/80 shadow-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-900 border border-slate-700" />
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>

                {/* In-App Screen Content (with 3D Horizontal Flip on Feature Transition) */}
                <div
                  className="w-full h-full bg-[#0B0F19] pt-8 px-3 pb-2.5 flex flex-col justify-between text-slate-100 select-none transition-all"
                  style={{
                    transform: flipStyle.transform,
                    opacity: flipStyle.opacity,
                    transformStyle: "preserve-3d",
                  }}
                >
                  {/* App Header Bar with Official Brand Logo */}
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
                    <div className="flex items-center gap-1.5">
                      <div className="relative w-5 h-5 rounded-md overflow-hidden shadow-xs shrink-0 border border-blue-500/30">
                        <Image
                          src="/icons/icon-512.png"
                          alt="ShadowLog Official Icon"
                          width={20}
                          height={20}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-xs font-black tracking-tight text-white font-sans">
                        Shadow<span className="text-blue-500">Log</span>
                      </span>
                    </div>

                    {/* Streak Badge */}
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 text-[10px] font-bold">
                      <Flame className="w-3 h-3 fill-orange-500" />
                      <span>14 Days</span>
                    </div>
                  </div>

                  {/* Scene 2: Core Practice Screen with Chunk Slashes & Interactive Word Tap */}
                  {isScene2 && (
                    <div className="my-auto space-y-2.5 animate-fade-in">
                      {/* Genre Selector Pills */}
                      <div className="flex items-center gap-1 text-[9px] font-bold overflow-x-auto pb-1">
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400">IT・テック</span>
                        <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white shadow-sm">💼 ビジネス</span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400">マーケ</span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400">日常</span>
                      </div>

                      {/* Main Sentence Card with Chunk Slashes */}
                      <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800 space-y-2 shadow-inner">
                        <div className="flex items-center justify-between text-[9px] text-slate-400">
                          <span>中級 / Level 2</span>
                          <span className="text-blue-400 font-bold flex items-center gap-1">
                            <Volume2 className="w-3 h-3" /> 1.0x (140 WPM)
                          </span>
                        </div>

                        <p className="text-xs font-semibold text-slate-100 leading-relaxed">
                          We need to <span className="font-black text-blue-400">/</span> discuss the
                          project{" "}
                          <span className="bg-blue-500/20 text-blue-300 px-1 py-0.5 rounded underline decoration-blue-400 decoration-2">
                            timeline
                          </span>{" "}
                          <span className="font-black text-blue-400">/</span> before the next release.
                        </p>

                        <p className="text-[10px] text-slate-400">
                          次のリリース前に、プロジェクトのスケジュールを話し合う必要があります。
                        </p>
                      </div>

                      {/* Word Tap 3D Dictionary Preview Modal */}
                      <div className="bg-gradient-to-r from-blue-900/40 to-slate-900/90 border border-blue-500/30 rounded-xl p-2 flex items-center justify-between text-[10px] animate-fade-in shadow-md">
                        <div>
                          <div className="font-bold text-white flex items-center gap-1">
                            <span>timeline</span>
                            <span className="text-[9px] text-blue-400 font-mono">[táimlàin]</span>
                          </div>
                          <div className="text-[9px] text-slate-300">名 予定表、スケジュール</div>
                        </div>
                        <div className="w-6 h-6 rounded-full bg-blue-600/30 text-blue-400 flex items-center justify-center font-bold text-xs">
                          🔊
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Scene 3: 2-Button Recording & Live Audio Waveform / Speed Gauge */}
                  {isScene3 && (
                    <div className="my-auto space-y-2.5 animate-fade-in text-center">
                      {/* Active Status Badge */}
                      <div className="inline-flex items-center gap-1 text-[10px] text-purple-300 bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/30 font-bold">
                        <div className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                        🎧 シャドーイング録音中（同時発声）
                      </div>

                      {/* Live Waveform Visualizer */}
                      <div className="h-14 flex items-center justify-center gap-1 px-3 bg-slate-900/70 rounded-xl border border-purple-500/20 shadow-inner">
                        {[16, 32, 48, 26, 42, 60, 30, 54, 40, 20, 46, 28, 52, 22].map((h, i) => (
                          <div
                            key={i}
                            className="w-1 bg-gradient-to-t from-purple-500 to-cyan-400 rounded-full animate-pulse"
                            style={{
                              height: `${Math.min(48, h * (0.65 + Math.sin(t * 9 + i) * 0.35))}px`,
                              animationDuration: `${0.35 + (i % 3) * 0.2}s`,
                            }}
                          />
                        ))}
                      </div>

                      {/* Dynamic Speed Meter (WPM Gauge) */}
                      <div className="bg-slate-900/90 rounded-xl p-2 border border-slate-800 flex items-center justify-around">
                        <div className="text-left">
                          <div className="text-[9px] text-slate-400">現在のはなし速</div>
                          <div className="text-base font-black text-purple-400 font-mono">
                            {wpmValue} <span className="text-[9px] font-normal text-slate-400">WPM</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[9px] text-slate-400">判定基準</div>
                          <div className="text-[10px] font-bold text-emerald-400">Native Speed 突破!</div>
                        </div>
                      </div>

                      {/* 2 Recording Buttons in App */}
                      <div className="grid grid-cols-2 gap-1.5 pt-1">
                        <div className="py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-400 text-[10px] font-bold flex items-center justify-center gap-1">
                          <Mic className="w-3 h-3 text-blue-400" />
                          <span>リピーティング</span>
                        </div>
                        <div className="py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[10px] font-bold flex items-center justify-center gap-1 shadow-md shadow-purple-500/30 animate-pulse">
                          <Headphones className="w-3 h-3" />
                          <span>シャドーイング中</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Scene 4: Whisper AI Diff Score & Word-Level Accuracy Breakdown */}
                  {isScene4 && (
                    <div className="my-auto space-y-2 animate-fade-in">
                      {/* Overall Accuracy Card */}
                      <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-2.5 text-center">
                        <div className="text-[10px] font-bold text-emerald-400 flex items-center justify-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          AI発話判定: Excellent!
                        </div>
                        <div className="text-xl font-black text-white mt-0.5">
                          正確性 <span className="text-emerald-400 font-mono">96%</span>
                          <span className="text-xs text-blue-400 ml-2 font-mono">142 WPM</span>
                        </div>
                      </div>

                      {/* Word Diff Breakdown (Green for correct, Red for missed) */}
                      <div className="bg-slate-900/90 rounded-xl p-2.5 border border-slate-800 text-[10px] space-y-1.5">
                        <div className="text-slate-400 text-[9px] flex items-center justify-between">
                          <span>単語別Diff（発音の脱落・詰まり判定）</span>
                          <span className="text-emerald-400 font-bold">10/11 正解</span>
                        </div>
                        <div className="flex flex-wrap gap-1 font-mono text-[9px]">
                          <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">We</span>
                          <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">need</span>
                          <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">to</span>
                          <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">discuss</span>
                          <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">timeline</span>
                          <span className="px-1.5 py-0.5 bg-red-500/20 text-red-300 rounded border border-red-500/30 line-through">before</span>
                          <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">release</span>
                        </div>
                      </div>

                      {/* AI Coach Feedback Note */}
                      <div className="bg-blue-950/30 border border-blue-500/20 rounded-xl p-2 text-[9px] text-blue-200 leading-tight">
                        💬 <span className="font-bold text-white">AIコーチ:</span> 音の繋がり（リンキング）が非常に綺麗です！脱落した「before」だけ意識してもう1回声に出してみましょう。
                      </div>
                    </div>
                  )}

                  {/* Scene 5: Streaks & Habituation Dashboard Card */}
                  {isScene5 && (
                    <div className="my-auto space-y-2.5 animate-fade-in text-center">
                      <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-extrabold text-lg mx-auto shadow-md shadow-blue-500/30">
                        S
                      </div>
                      <div>
                        <div className="text-sm font-black text-white">ShadowLog</div>
                        <div className="text-[10px] text-blue-300">声に出して身につけるシャドーイングSaaS</div>
                      </div>

                      {/* Streak Heatmap preview */}
                      <div className="bg-slate-900/90 rounded-xl p-2 border border-slate-800 space-y-1">
                        <div className="flex items-center justify-between text-[9px] text-slate-400">
                          <span>🔥 14日連続練習中</span>
                          <span className="text-emerald-400 font-bold">Total 35 Sessions</span>
                        </div>
                        {/* Mini grass cells */}
                        <div className="flex items-center justify-center gap-1 pt-0.5">
                          {[3, 4, 2, 5, 4, 3, 5, 2, 4, 5, 4, 5, 5, 5].map((lvl, idx) => (
                            <div
                              key={idx}
                              className={`w-2.5 h-2.5 rounded-sm ${
                                lvl === 5
                                  ? "bg-emerald-400"
                                  : lvl === 4
                                  ? "bg-emerald-500"
                                  : lvl === 3
                                  ? "bg-emerald-600"
                                  : "bg-emerald-800"
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-1.5 px-3 rounded-xl text-xs shadow-md shadow-blue-500/30 animate-pulse">
                        ベータ版を完全無料で試す →
                      </div>
                    </div>
                  )}

                  {/* App Bottom Navigation */}
                  <div className="flex items-center justify-around border-t border-slate-800/80 pt-1 text-slate-500 text-[9px]">
                    <span className="flex flex-col items-center">
                      <Sparkles className="w-3 h-3" />
                      <span>ホーム</span>
                    </span>
                    <span className="text-blue-400 font-bold flex flex-col items-center">
                      <Activity className="w-3 h-3" />
                      <span>練習</span>
                    </span>
                    <span className="flex flex-col items-center">
                      <TrendingUp className="w-3 h-3" />
                      <span>カルテ</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Call to Action Footer */}
          <div className="w-full text-center z-20 pb-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-slate-900/90 border border-slate-700/80 backdrop-blur-md shadow-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-bold text-slate-200">
                URL: <span className="text-blue-400">shadowlog.vercel.app</span>
              </span>
            </div>
          </div>
        </div>

        {/* Minimal Fullscreen Floating Exit Button */}
        {isFullScreen && (
          <button
            onClick={toggleFullScreen}
            className="absolute top-4 right-4 z-50 p-2 rounded-xl bg-slate-900/80 text-slate-300 hover:text-white border border-slate-700/60 backdrop-blur-md transition shadow-md"
            title="全画面を終了"
          >
            <Minimize2 className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Director Control Panel (Recording & Playback Toolbar) */}
      {!isFullScreen && (
        <div className="w-full mt-6 bg-[#0B0F19] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
          {/* Top Info Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
              <h3 className="font-bold text-sm text-white">ShadowLog 本機能プロモ動画ディレクター</h3>
              <span className="text-xs text-slate-400 font-mono">
                {currentTime.toFixed(1)}s / {duration.toFixed(1)}s
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowRecordingGuide(!showRecordingGuide)}
                className="px-3 py-1 rounded-lg text-xs font-bold bg-blue-500/10 text-blue-300 border border-blue-500/30 hover:bg-blue-500/20 transition flex items-center gap-1.5"
              >
                <Video className="w-3.5 h-3.5" />
                <span>Mac画面収録のやり方</span>
              </button>
            </div>
          </div>

          {/* Timeline Scrubber */}
          <div className="space-y-1.5">
            <div className="relative w-full h-2.5 bg-slate-800 rounded-full cursor-pointer overflow-hidden group">
              <div
                className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-blue-600 via-purple-500 to-emerald-400 rounded-full transition-all"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              />
              <input
                type="range"
                min="0"
                max={duration}
                step="0.1"
                value={currentTime}
                onChange={(e) => setCurrentTime(parseFloat(e.target.value))}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
            </div>

            {/* Scene Markers */}
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span className={isScene1 ? "text-cyan-400 font-bold" : ""}>0s ロゴ②粒子集結</span>
              <span className={isScene2 ? "text-blue-400 font-bold" : ""}>3.2s チャンク(/)練習</span>
              <span className={isScene3 ? "text-purple-400 font-bold" : ""}>7.2s シャドーイング/WPM</span>
              <span className={isScene4 ? "text-emerald-400 font-bold" : ""}>11.5s AI Diff採点</span>
              <span className={isScene5 ? "text-blue-400 font-bold" : ""}>15s 継続草生やし/CTA</span>
            </div>
          </div>

          {/* Playback Controls & Format Switchers */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            {/* Play / Restart Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={togglePlay}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-md shadow-blue-500/20"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                <span>{isPlaying ? "一時停止" : currentTime >= duration ? "もう一度再生" : "動画を再生"}</span>
              </button>

              <button
                onClick={handleRestart}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                title="最初から再生"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`p-2 rounded-xl transition ${
                  isMuted ? "bg-red-500/10 text-red-400 border border-red-500/30" : "bg-slate-800 text-slate-300"
                }`}
                title={isMuted ? "音声をONにする" : "ミュートにする"}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>

            {/* Aspect Ratio & Screen Size Toggles */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-900 rounded-xl p-1 border border-slate-800">
                <button
                  onClick={() => setAspectRatio("vertical")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                    aspectRatio === "vertical"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>縦型 (9:16)</span>
                </button>
                <button
                  onClick={() => setAspectRatio("horizontal")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                    aspectRatio === "horizontal"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>横型 (16:9)</span>
                </button>
              </div>

              {/* Speed Multiplier */}
              <select
                value={playbackSpeed}
                onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                className="bg-slate-900 border border-slate-800 text-slate-300 text-xs font-bold rounded-xl px-2.5 py-1.5 outline-none cursor-pointer"
              >
                <option value="0.8">0.8x（ゆっくり）</option>
                <option value="1.0">1.0x（通常）</option>
                <option value="1.2">1.2x（テンポ重視）</option>
              </select>

              {/* Fullscreen Button */}
              <button
                onClick={toggleFullScreen}
                className="p-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white transition shadow-sm"
                title="全画面プレビュー（録画用）"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Screen Recording Guide Modal */}
      {showRecordingGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0E1322] border border-slate-700 rounded-3xl max-w-lg w-full p-6 space-y-5 text-slate-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Video className="w-5 h-5 text-blue-400" />
                <h3 className="font-extrabold text-base text-white">Macで簡単に動画化する手順</h3>
              </div>
              <button
                onClick={() => setShowRecordingGuide(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs sm:text-sm">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                  1
                </div>
                <div>
                  <div className="font-bold text-white">全画面プレビュー（⛶）を押す</div>
                  <p className="text-slate-400 text-xs mt-0.5">
                    余計なUIが消え、高画質のアニメーションのみが画面中央に表示されます。
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                  2
                </div>
                <div>
                  <div className="font-bold text-white">
                    <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-blue-300 font-mono text-xs">
                      Command + Shift + 5
                    </kbd>{" "}
                    を押す
                  </div>
                  <p className="text-slate-400 text-xs mt-0.5">
                    Mac標準の画面収録バーが出ます。「選択部分を収録」を選び、スマホ枠に合わせて録画枠をドラッグします。
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                  3
                </div>
                <div>
                  <div className="font-bold text-white">「収録」を押してから再生！</div>
                  <p className="text-slate-400 text-xs mt-0.5">
                    動画が18秒で自動終了したら、停止ボタンを押すだけでデスクトップに綺麗な動画ファイル（.mov）が保存されます。
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowRecordingGuide(false)}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-xs text-white transition shadow-md"
              >
                理解しました！閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
