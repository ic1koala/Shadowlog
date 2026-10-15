"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Play, RotateCcw, Volume2, VolumeX, Maximize2 } from "lucide-react";

export type LogoAnimationPattern =
  | "prism"
  | "waveform"
  | "eclipse"
  | "sonic"
  | "minimal";

export interface LogoAnimationMeta {
  id: LogoAnimationPattern;
  name: string;
  nameJa: string;
  tagline: string;
  durationSec: number;
  description: string;
  recommendedFor: string;
  themeColor: string;
}

export const LOGO_ANIMATION_PATTERNS: LogoAnimationMeta[] = [
  {
    id: "prism",
    name: "Prism Strike",
    nameJa: "Netflix直系・プリズムストライク",
    tagline: "深紅〜シアンの光線がS字を疾走し、無数の光粒子へと拡散するシネマティック演出",
    durationSec: 2.8,
    description:
      "Netflixのオープニングをオマージュした直系デザイン。漆黒の空間から多重カラーの光速リボンが『S』を一筆書きで疾走し、最後はきらめく光の粒子となって画面全体へ溶け込みます。",
    recommendedFor: "圧倒的な第一印象と映画のようなシネマティック感を与えたい場合",
    themeColor: "from-indigo-500 via-purple-500 to-cyan-400",
  },
  {
    id: "waveform",
    name: "Audio Waveform Morph",
    nameJa: "音波モーフィング・オーディオウェーブ",
    tagline: "シャドーイングの音声波形イコライザーが流麗に1本の光へ収束し、Sロゴへ変形",
    durationSec: 2.6,
    description:
      "英語音声の発音・波形・周波数をモチーフにした知的な演出。アクティブに跳ねる9本のマルチカラー音声EQバーが躍動したあと、流麗な1本のラインに収束して立体的なSロゴを形成します。",
    recommendedFor: "「英語シャドーイング専用アプリ」としての機能性と専門性を強調したい場合",
    themeColor: "from-cyan-400 via-blue-500 to-indigo-600",
  },
  {
    id: "eclipse",
    name: "Eclipse Shadow",
    nameJa: "エクリプス・シャドウ（影から光へ）",
    tagline: "闇夜の日食から強烈なバックライトが照射され、影を切り裂いてエンブレムが覚醒",
    durationSec: 3.0,
    description:
      "ブランド名『ShadowLog』を直感的に表現。漆黒の闇に浮かぶ惑星の日食から閃光が走り、闇（Shadow）の中から光輝くメタリックガラスのSエンブレムが重厚に浮上します。",
    recommendedFor: "プレミアム感・高級感、大人の洗練された学習体験を印象づけたい場合",
    themeColor: "from-emerald-400 via-teal-500 to-indigo-700",
  },
  {
    id: "sonic",
    name: "Sonic Boom",
    nameJa: "ソニックブーム・音速インパクト",
    tagline: "超音速の同心円ショックウェーブが迫り、中央にSがドカンとインパクト着地",
    durationSec: 2.5,
    description:
      "スピード感とエネルギーを全面に出したダイナミックな演出。画面奥から幾重ものネオンリング衝撃波が迫り、中央へSロゴが劇的なインパクトと共に着地。音速突破（WPM150+）を象徴します。",
    recommendedFor: "テンポよく次へ進みたいユーザーや、若年層・TOEICスコアアップの勢いを訴求したい場合",
    themeColor: "from-amber-400 via-rose-500 to-indigo-600",
  },
  {
    id: "minimal",
    name: "Minimal Tech Glow",
    nameJa: "ミニマルテック・グロー（Apple / Linear風）",
    tagline: "極細ヘアラインレーザーが静かにSを描き、オーロラの呼吸とガラスのツヤが走る",
    durationSec: 2.7,
    description:
      "AppleやLinearのプロダクトローンチを思わせる極上のミニマリズム。極細のレーザー光がSの曲線を滑らかにトレースし、控えめで優美なオーロラ光とガラスモーフィズムの反射光が走ります。",
    recommendedFor: "ミニマルでスマート、流行に左右されないハイエンドな美しさを重視する場合",
    themeColor: "from-blue-400 via-indigo-400 to-violet-500",
  },
];

// Web Audio API によるシネマティック効果音（Netflix風の重低音ドゥーン＋高音の余韻シンセ）
function playCinematicSound(pattern: LogoAnimationPattern) {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // 1. サブベース（重低音ドゥーン）
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = "sine";

    if (pattern === "sonic") {
      subOsc.frequency.setValueAtTime(120, now);
      subOsc.frequency.exponentialRampToValueAtTime(35, now + 0.6);
    } else if (pattern === "eclipse") {
      subOsc.frequency.setValueAtTime(55, now);
      subOsc.frequency.linearRampToValueAtTime(45, now + 1.2);
    } else {
      subOsc.frequency.setValueAtTime(75, now);
      subOsc.frequency.exponentialRampToValueAtTime(40, now + 0.8);
    }

    subGain.gain.setValueAtTime(0.001, now);
    subGain.gain.linearRampToValueAtTime(0.4, now + 0.08);
    subGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);

    subOsc.connect(subGain);
    subGain.connect(ctx.destination);
    subOsc.start(now);
    subOsc.stop(now + 2.3);

    // 2. パターン別の高音ハーモニックシンセベル / 衝撃音
    const bellOsc = ctx.createOscillator();
    const bellGain = ctx.createGain();

    if (pattern === "waveform") {
      bellOsc.type = "triangle";
      bellOsc.frequency.setValueAtTime(320, now);
      bellOsc.frequency.linearRampToValueAtTime(640, now + 0.5);
      bellOsc.frequency.exponentialRampToValueAtTime(440, now + 1.5);
    } else if (pattern === "minimal") {
      bellOsc.type = "sine";
      bellOsc.frequency.setValueAtTime(587.33, now); // D5
      bellOsc.frequency.setValueAtTime(880, now + 0.3); // A5
    } else if (pattern === "sonic") {
      bellOsc.type = "sawtooth";
      bellOsc.frequency.setValueAtTime(220, now);
      bellOsc.frequency.exponentialRampToValueAtTime(880, now + 0.3);
    } else {
      // prism / eclipse (Netflixのタダーン音和音構成)
      bellOsc.type = "triangle";
      bellOsc.frequency.setValueAtTime(261.63, now); // C4
      bellOsc.frequency.setValueAtTime(392.0, now + 0.12); // G4
    }

    bellGain.gain.setValueAtTime(0.001, now);
    bellGain.gain.linearRampToValueAtTime(0.18, now + 0.15);
    bellGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

    bellOsc.connect(bellGain);
    bellGain.connect(ctx.destination);
    bellOsc.start(now);
    bellOsc.stop(now + 2.0);

    // 終了後にAudioContextを破棄
    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 2500);
  } catch {
    // AudioContext非対応やポリシーブロックは無視
  }
}

interface LogoAnimationPlayerProps {
  pattern: LogoAnimationPattern;
  autoPlay?: boolean;
  soundEnabled?: boolean;
  onComplete?: () => void;
  className?: string;
  showControls?: boolean;
  fullScreenMode?: boolean;
}

export function LogoAnimationPlayer({
  pattern,
  autoPlay = true,
  soundEnabled = false,
  onComplete,
  className = "",
  showControls = true,
  fullScreenMode = false,
}: LogoAnimationPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [animationKey, setAnimationKey] = useState(0);
  const [isMuted, setIsMuted] = useState(!soundEnabled);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const meta = LOGO_ANIMATION_PATTERNS.find((p) => p.id === pattern) || LOGO_ANIMATION_PATTERNS[0];

  const handlePlay = useCallback(() => {
    setIsPlaying(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    setTimeout(() => {
      setAnimationKey((prev) => prev + 1);
      setIsPlaying(true);

      if (!isMuted) {
        playCinematicSound(pattern);
      }

      timeoutRef.current = setTimeout(() => {
        setIsPlaying(false);
        if (onComplete) onComplete();
      }, meta.durationSec * 1000);
    }, 40);
  }, [pattern, isMuted, meta.durationSec, onComplete]);

  useEffect(() => {
    if (autoPlay) {
      handlePlay();
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [pattern, autoPlay, handlePlay]);

  return (
    <div
      className={`relative overflow-hidden select-none bg-[#070A12] text-white flex flex-col items-center justify-center ${
        fullScreenMode ? "w-full h-full min-h-[420px]" : "w-full aspect-video rounded-2xl"
      } ${className}`}
    >
      {/* Dynamic Background Grid & Atmosphere Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className={`absolute -top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-[120px] opacity-25 bg-gradient-to-b ${meta.themeColor} transition-all duration-1000`}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#070A12_85%)]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: "24px 24px",
          }}
        />
      </div>

      {/* Main Animation Stage */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-6">
        <div key={animationKey} className="relative flex flex-col items-center justify-center">
          {pattern === "prism" && <PrismStrikeAnimation isPlaying={isPlaying} />}
          {pattern === "waveform" && <WaveformMorphAnimation isPlaying={isPlaying} />}
          {pattern === "eclipse" && <EclipseShadowAnimation isPlaying={isPlaying} />}
          {pattern === "sonic" && <SonicBoomAnimation isPlaying={isPlaying} />}
          {pattern === "minimal" && <MinimalTechAnimation isPlaying={isPlaying} />}

          {/* Logo Brand Text Reveal */}
          <div
            className={`mt-6 text-center transition-all duration-700 ${
              isPlaying
                ? "animate-fade-in-up opacity-100 translate-y-0"
                : "opacity-90 translate-y-0"
            }`}
          >
            <div className="flex items-center justify-center gap-1.5 tracking-[0.28em] font-black text-xl sm:text-2xl text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-400">
              <span>SHADOWLOG</span>
            </div>
            <p className="text-[10px] sm:text-xs font-semibold tracking-[0.35em] text-cyan-400/80 mt-1 uppercase">
              AI Shadowing Studio
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Controls Overlay */}
      {showControls && (
        <div className="absolute bottom-3 right-3 z-30 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shadow-lg text-xs">
          <button
            type="button"
            onClick={handlePlay}
            className="flex items-center gap-1 px-2 py-1 rounded-full text-slate-200 hover:text-white hover:bg-white/10 transition"
            title="もう一度再生"
          >
            <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-semibold text-[11px]">Replay</span>
          </button>

          <div className="w-[1px] h-3 bg-white/20" />

          <button
            type="button"
            onClick={() => {
              setIsMuted(!isMuted);
              if (isMuted) playCinematicSound(pattern);
            }}
            className={`p-1.5 rounded-full transition ${
              isMuted
                ? "text-slate-400 hover:text-slate-200"
                : "text-cyan-400 bg-cyan-400/10"
            }`}
            title={isMuted ? "シネマティック効果音をONにする" : "ミュート"}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 1. Pattern 1: Prism Strike (Netflix直系)
// ==========================================
function PrismStrikeAnimation({ isPlaying }: { isPlaying: boolean }) {
  return (
    <div className="relative w-44 h-44 sm:w-52 sm:h-52 flex items-center justify-center">
      {/* 拡散する光のパーティクルとゴースト */}
      <div
        className={`absolute inset-0 rounded-full bg-gradient-to-tr from-indigo-600/30 via-purple-600/20 to-cyan-400/30 blur-2xl transition-all duration-1000 ${
          isPlaying ? "scale-150 opacity-100" : "scale-100 opacity-40"
        }`}
      />

      <svg
        viewBox="0 0 200 200"
        className="w-full h-full relative z-10 overflow-visible"
        style={{ filter: "drop-shadow(0 0 25px rgba(99, 102, 241, 0.6))" }}
      >
        <defs>
          <linearGradient id="prism-grad-main" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366F1" />
            <stop offset="35%" stopColor="#A855F7" />
            <stop offset="70%" stopColor="#06B6D4" />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>

          <linearGradient id="prism-grad-ribbon" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#EC4899" />
            <stop offset="50%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#38BDF8" />
          </linearGradient>

          <filter id="neon-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 背後を走るスピードライン */}
        <g className={isPlaying ? "animate-prism-rays" : "opacity-30"}>
          {[-45, -15, 15, 45].map((deg, i) => (
            <line
              key={i}
              x1="100"
              y1="100"
              x2={100 + Math.cos((deg * Math.PI) / 180) * 120}
              y2={100 + Math.sin((deg * Math.PI) / 180) * 120}
              stroke="url(#prism-grad-ribbon)"
              strokeWidth="2"
              strokeDasharray="4 8"
              opacity="0.4"
            />
          ))}
        </g>

        {/* 光速で走るS字のメインストローク */}
        <path
          d="M 140 55 C 130 35, 70 35, 65 75 C 60 115, 140 95, 135 135 C 130 170, 70 170, 60 150"
          fill="none"
          stroke="url(#prism-grad-main)"
          strokeWidth="16"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#neon-glow)"
          style={{
            strokeDasharray: 380,
            strokeDashoffset: isPlaying ? 0 : 380,
            transition: isPlaying ? "stroke-dashoffset 1.8s cubic-bezier(0.16, 1, 0.3, 1)" : "none",
          }}
        />

        {/* 手前で輝くホワイトコアライン */}
        <path
          d="M 140 55 C 130 35, 70 35, 65 75 C 60 115, 140 95, 135 135 C 130 170, 70 170, 60 150"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.9"
          style={{
            strokeDasharray: 380,
            strokeDashoffset: isPlaying ? 0 : 380,
            transition: isPlaying ? "stroke-dashoffset 1.7s cubic-bezier(0.16, 1, 0.3, 1) 0.1s" : "none",
          }}
        />
      </svg>
    </div>
  );
}

// ==========================================
// 2. Pattern 2: Audio Waveform Morph (音波 ➔ S字)
// ==========================================
function WaveformMorphAnimation({ isPlaying }: { isPlaying: boolean }) {
  return (
    <div className="relative w-44 h-44 sm:w-52 sm:h-52 flex items-center justify-center">
      {/* 中央の音波エネルギーリング */}
      <div
        className={`absolute inset-4 rounded-full border border-cyan-500/20 transition-all duration-700 ${
          isPlaying ? "scale-125 opacity-100" : "scale-100 opacity-20"
        }`}
      />

      <svg viewBox="0 0 200 200" className="w-full h-full relative z-10 overflow-visible">
        <defs>
          <linearGradient id="wave-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="50%" stopColor="#6366F1" />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>
        </defs>

        {/* 9本の音声イコライザーバー（前半：音波として躍動 ➔ 後半：S字の輪郭へスナップ） */}
        {[-4, -3, -2, -1, 0, 1, 2, 3, 4].map((offset, idx) => {
          const x = 100 + offset * 14;
          // 各バーの高さ（イコライザー）
          const baseHeight = [24, 48, 72, 90, 110, 85, 65, 45, 20][idx];

          return (
            <rect
              key={idx}
              x={x - 3}
              y={100 - baseHeight / 2}
              width="6"
              height={baseHeight}
              rx="3"
              fill="url(#wave-grad)"
              className="transition-all duration-1000"
              style={{
                opacity: isPlaying ? 0.35 + idx * 0.05 : 0.2,
                transformOrigin: `${x}px 100px`,
                transform: isPlaying
                  ? `scaleY(${1 + Math.sin(idx + 1) * 0.4})`
                  : "scaleY(0.4)",
                transition: "all 0.6s ease-in-out",
              }}
            />
          );
        })}

        {/* 音波が収束して浮かび上がるS字オーディオトラック */}
        <path
          d="M 135 60 C 130 40, 75 40, 70 75 C 65 110, 135 90, 130 130 C 125 165, 70 165, 65 145"
          fill="none"
          stroke="#38BDF8"
          strokeWidth="14"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            filter: "drop-shadow(0 0 16px rgba(56, 189, 248, 0.8))",
            strokeDasharray: 360,
            strokeDashoffset: isPlaying ? 0 : 360,
            transition: isPlaying ? "stroke-dashoffset 1.6s cubic-bezier(0.2, 0.8, 0.2, 1) 0.5s" : "none",
          }}
        />

        {/* パルスポイント（音のアクセント） */}
        <circle
          cx="135"
          cy="60"
          r="7"
          fill="#FFFFFF"
          className={isPlaying ? "animate-ping" : "opacity-0"}
          style={{ animationDuration: "1.5s", animationIterationCount: 2 }}
        />
      </svg>
    </div>
  );
}

// ==========================================
// 3. Pattern 3: Eclipse Shadow (日食 ➔ ネオン覚醒)
// ==========================================
function EclipseShadowAnimation({ isPlaying }: { isPlaying: boolean }) {
  return (
    <div className="relative w-44 h-44 sm:w-52 sm:h-52 flex items-center justify-center">
      {/* 日食のコロナ光バックライト */}
      <div
        className={`absolute inset-2 rounded-full bg-gradient-to-tr from-emerald-500/40 via-cyan-500/30 to-violet-600/40 blur-xl transition-all duration-1000 ${
          isPlaying ? "scale-125 opacity-100" : "scale-90 opacity-20"
        }`}
      />

      <svg viewBox="0 0 200 200" className="w-full h-full relative z-10 overflow-visible">
        <defs>
          <linearGradient id="eclipse-rim" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="50%" stopColor="#06B6D4" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>

          <radialGradient id="eclipse-mask-dark" cx="45%" cy="45%" r="60%">
            <stop offset="0%" stopColor="#111827" />
            <stop offset="70%" stopColor="#070A12" />
            <stop offset="100%" stopColor="#030508" />
          </radialGradient>
        </defs>

        {/* 日食のバックサークル */}
        <circle
          cx="100"
          cy="100"
          r="68"
          fill="url(#eclipse-mask-dark)"
          stroke="url(#eclipse-rim)"
          strokeWidth="3"
          className="transition-all duration-1000"
          style={{
            filter: "drop-shadow(0 0 20px rgba(16, 185, 129, 0.5))",
            transform: isPlaying ? "scale(1)" : "scale(0.85)",
            transformOrigin: "center",
          }}
        />

        {/* 影の中から浮き出る3DメタリックSエンブレム */}
        <g
          className="transition-all duration-1000"
          style={{
            opacity: isPlaying ? 1 : 0,
            transform: isPlaying ? "scale(1)" : "scale(0.7)",
            transformOrigin: "center",
            transition: "all 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.3s",
          }}
        >
          <path
            d="M 132 65 C 125 45, 78 45, 74 76 C 70 108, 130 96, 126 128 C 122 155, 78 155, 70 138"
            fill="none"
            stroke="url(#eclipse-rim)"
            strokeWidth="15"
            strokeLinecap="round"
            style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.8))" }}
          />

          <path
            d="M 132 65 C 125 45, 78 45, 74 76 C 70 108, 130 96, 126 128 C 122 155, 78 155, 70 138"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.85"
          />
        </g>
      </svg>
    </div>
  );
}

// ==========================================
// 4. Pattern 4: Sonic Boom (音速インパクト)
// ==========================================
function SonicBoomAnimation({ isPlaying }: { isPlaying: boolean }) {
  return (
    <div className="relative w-44 h-44 sm:w-52 sm:h-52 flex items-center justify-center">
      {/* 押し寄せる音速波リング（多重ショックウェーブ） */}
      {[0, 1, 2].map((ring) => (
        <div
          key={ring}
          className={`absolute rounded-full border border-rose-500/30 transition-all ${
            isPlaying ? "animate-ping opacity-75" : "opacity-0"
          }`}
          style={{
            width: `${120 + ring * 40}px`,
            height: `${120 + ring * 40}px`,
            animationDuration: `${1.4 + ring * 0.3}s`,
            animationDelay: `${ring * 0.2}s`,
            animationIterationCount: 2,
          }}
        />
      ))}

      <svg viewBox="0 0 200 200" className="w-full h-full relative z-10 overflow-visible">
        <defs>
          <linearGradient id="sonic-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="50%" stopColor="#F43F5E" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
        </defs>

        {/* ドカンとインパクト着地するボールドS */}
        <g
          style={{
            transform: isPlaying ? "scale(1)" : "scale(2.5)",
            opacity: isPlaying ? 1 : 0,
            transformOrigin: "center",
            transition: "all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.15s",
          }}
        >
          <path
            d="M 142 55 C 132 30, 68 30, 62 75 C 56 120, 144 95, 138 140 C 132 175, 68 175, 58 150"
            fill="none"
            stroke="url(#sonic-grad)"
            strokeWidth="18"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              filter: "drop-shadow(0 0 20px rgba(244, 63, 94, 0.8))",
            }}
          />

          {/* インパクト閃光 */}
          <circle
            cx="100"
            cy="100"
            r="12"
            fill="#FFFFFF"
            className={isPlaying ? "animate-pulse" : "opacity-0"}
            style={{ animationDuration: "0.8s" }}
          />
        </g>
      </svg>
    </div>
  );
}

// ==========================================
// 5. Pattern 5: Minimal Tech Glow (Apple/Linear風)
// ==========================================
function MinimalTechAnimation({ isPlaying }: { isPlaying: boolean }) {
  return (
    <div className="relative w-44 h-44 sm:w-52 sm:h-52 flex items-center justify-center">
      {/* 極上の微細アンビエントオーロラ */}
      <div
        className={`absolute inset-6 rounded-full bg-gradient-to-br from-indigo-500/20 via-sky-400/20 to-purple-500/20 blur-xl transition-all duration-1000 ${
          isPlaying ? "scale-110 opacity-80" : "scale-90 opacity-10"
        }`}
      />

      <svg viewBox="0 0 200 200" className="w-full h-full relative z-10 overflow-visible">
        <defs>
          <linearGradient id="minimal-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#A78BFA" />
          </linearGradient>
        </defs>

        {/* 背景の薄いガイドライン */}
        <path
          d="M 135 60 C 128 42, 75 42, 70 75 C 65 110, 135 92, 130 128 C 125 160, 72 160, 65 142"
          fill="none"
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth="8"
          strokeLinecap="round"
        />

        {/* 極細レーザーが精密にトレース */}
        <path
          d="M 135 60 C 128 42, 75 42, 70 75 C 65 110, 135 92, 130 128 C 125 160, 72 160, 65 142"
          fill="none"
          stroke="url(#minimal-grad)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            filter: "drop-shadow(0 0 10px rgba(56, 189, 248, 0.9))",
            strokeDasharray: 360,
            strokeDashoffset: isPlaying ? 0 : 360,
            transition: isPlaying ? "stroke-dashoffset 2.0s cubic-bezier(0.16, 1, 0.3, 1)" : "none",
          }}
        />

        {/* 先端を走る光のポインタ */}
        <circle
          cx="135"
          cy="60"
          r="4"
          fill="#FFFFFF"
          className="transition-all duration-500"
          style={{
            filter: "drop-shadow(0 0 8px #FFFFFF)",
            opacity: isPlaying ? 1 : 0,
          }}
        />
      </svg>
    </div>
  );
}
