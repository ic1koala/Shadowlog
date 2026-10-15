"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { RotateCcw } from "lucide-react";

export type LogoAnimationPattern =
  | "sparkle_wave"
  | "particle_converge"
  | "blur_focus"
  | "blueprint_trace"
  | "dimensional_rise";

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
    id: "sparkle_wave",
    name: "Zero to Sparkle",
    nameJa: "無からの閃光・ウェーブ出現",
    tagline: "何もない暗闇に一粒の星が輝き、そこから3本の音波と公式ロゴが波紋のように現れる",
    durationSec: 2.8,
    description:
      "完全な無（暗闇）の中央にまずスパークル星がキラッと誕生し、その光に呼応してロイヤルブルーのアイコンと3本の白い音声ウェーブが内側から順番に出現。最後に『ShadowLog』の公式テキストが浮かび上がります。",
    recommendedFor: "公式アイコンの「3本ウェーブ＋星」のモチーフを最も活かした王道の起動演出",
    themeColor: "from-blue-600 via-blue-500 to-indigo-600",
  },
  {
    id: "particle_converge",
    name: "Particle Convergence",
    nameJa: "光粒子の集結・実体化",
    tagline: "虚空から無数の青と白の光の粒が中央へ吸い寄せられ、一瞬で公式ロゴへと実体化する",
    durationSec: 2.7,
    description:
      "最初は完全に何もない空間からスタート。四方八方から微細な光のパーティクルが中央へ高速収束し、閃光とともに公式アイコンと『ShadowLog』テキストがくっきりと姿を現します。",
    recommendedFor: "AIテクノロジー感と「無から形が生まれる」ワクワク感を演出したい場合",
    themeColor: "from-sky-500 via-blue-600 to-indigo-700",
  },
  {
    id: "blur_focus",
    name: "Mist & Focus Reveal",
    nameJa: "深淵からのピント結像（ブラー出現）",
    tagline: "何もない空間に青い光が滲み出し、ピントが合うようにロゴと一文字ずつのテキストが結像",
    durationSec: 2.8,
    description:
      "漆黒の空間に淡いブルーのオーラが静かに灯り、深いブラー（ぼかし）の中からカメラのピントが急速に合うように公式アイコンが出現。『ShadowLog』が一文字ずつ滑らかに浮かび上がります。",
    recommendedFor: "映画のオープニングのような奥行きと、洗練された上品な出現感を重視する場合",
    themeColor: "from-blue-500 via-indigo-500 to-blue-700",
  },
  {
    id: "blueprint_trace",
    name: "Laser Blueprint Trace",
    nameJa: "光線ドローイング ➔ フルロゴ展開",
    tagline: "空白の闇に光の線が3本ウェーブと星を描き出し、色が宿って横並びの公式フルロゴへ展開",
    durationSec: 3.0,
    description:
      "何もない暗闇に白い光のラインが走り、3本の円弧と2つの星を一筆書きでトレース。描き終えた瞬間にロイヤルブルーが灯り、アイコンが左へスライドして右隣に『ShadowLog』が現れるヘッダー同一レイアウト演出です。",
    recommendedFor: "アプリ内のヘッダーロゴ（アイコン＋横文字ShadowLog）と同じ並びで記憶させたい場合",
    themeColor: "from-blue-600 via-cyan-500 to-blue-700",
  },
  {
    id: "dimensional_rise",
    name: "Dimensional Spotlight",
    nameJa: "シャドウ・スポットライト浮上",
    tagline: "完全な闇（Shadow）に一筋の光が差し込み、ツヤのあるガラス光沢を伴ってロゴがせり上がる",
    durationSec: 2.6,
    description:
      "完全な暗闇に上方から青いスポットライトが差し込み、無の中から公式アイコンと『ShadowLog』が立体的に浮上。最後にロゴの表面をキラリと白いガラス反射光（シマー）が駆け抜けます。",
    recommendedFor: "Apple製品のようなミニマルで高級感のある、大人の学習アプリらしい演出",
    themeColor: "from-blue-700 via-blue-500 to-slate-800",
  },
];

interface LogoAnimationPlayerProps {
  pattern: LogoAnimationPattern;
  autoPlay?: boolean;
  onComplete?: () => void;
  className?: string;
  showControls?: boolean;
  fullScreenMode?: boolean;
}

export function LogoAnimationPlayer({
  pattern,
  autoPlay = true,
  onComplete,
  className = "",
  showControls = true,
  fullScreenMode = false,
}: LogoAnimationPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [animationKey, setAnimationKey] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const meta =
    LOGO_ANIMATION_PATTERNS.find((p) => p.id === pattern) || LOGO_ANIMATION_PATTERNS[0];

  const handlePlay = useCallback(() => {
    setIsPlaying(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    setTimeout(() => {
      setAnimationKey((prev) => prev + 1);
      setIsPlaying(true);

      timeoutRef.current = setTimeout(() => {
        setIsPlaying(false);
        if (onComplete) onComplete();
      }, meta.durationSec * 1000);
    }, 50);
  }, [meta.durationSec, onComplete]);

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
      className={`relative overflow-hidden select-none bg-[#060911] text-white flex flex-col items-center justify-center ${
        fullScreenMode ? "w-full h-full min-h-[420px]" : "w-full aspect-video rounded-2xl"
      } ${className}`}
    >
      {/* Main Animation Stage (Starts from complete nothingness) */}
      <div
        key={animationKey}
        className="relative z-10 w-full h-full flex flex-col items-center justify-center p-6"
      >
        {pattern === "sparkle_wave" && <SparkleWaveReveal />}
        {pattern === "particle_converge" && <ParticleConvergeReveal />}
        {pattern === "blur_focus" && <BlurFocusReveal />}
        {pattern === "blueprint_trace" && <BlueprintTraceReveal />}
        {pattern === "dimensional_rise" && <DimensionalRiseReveal />}
      </div>

      {/* Replay Control Overlay (Sound removed per specification) */}
      {showControls && (
        <div className="absolute bottom-3 right-3 z-30 flex items-center bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shadow-lg text-xs">
          <button
            type="button"
            onClick={handlePlay}
            className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-full text-slate-200 hover:text-white transition cursor-pointer"
            title="無の状態からもう一度再生"
          >
            <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-semibold text-[11px]">Replay</span>
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * 公式アイコン（/icons/icon-512.png）のベクター構造パーツ
 * - ロイヤルブルー背景 (#2563EB -> #1D4ED8)
 * - 左下から右上へ広がる3本の白い音声ウェーブアーク
 * - 右上の大小2つの4光星（スパークル）
 */
function OfficialIconSvg({
  mode,
}: {
  mode: "sparkle" | "trace" | "full";
}) {
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full overflow-visible">
      <defs>
        <linearGradient id="official-blue-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
        <filter id="star-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* 角丸ロイヤルブルー背景 */}
      <rect
        x="0"
        y="0"
        width="200"
        height="200"
        rx="44"
        fill="url(#official-blue-bg)"
        className={
          mode === "sparkle"
            ? "animate-[logoBgAppear_2.6s_cubic-bezier(0.16,1,0.3,1)_forwards]"
            : mode === "trace"
            ? "animate-[logoBgTraceAppear_2.8s_cubic-bezier(0.16,1,0.3,1)_forwards]"
            : ""
        }
      />

      {/* 3本の白いウェーブアーク（内 ➔ 中 ➔ 外） */}
      {/* 1. 内側アーク */}
      <path
        d="M 62 108 A 34 34 0 0 1 90 138"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="12"
        strokeLinecap="round"
        className={
          mode === "sparkle"
            ? "animate-[waveArc1_2.6s_cubic-bezier(0.16,1,0.3,1)_forwards]"
            : mode === "trace"
            ? "animate-[traceArc_2.8s_cubic-bezier(0.16,1,0.3,1)_forwards]"
            : ""
        }
        style={mode === "trace" ? { strokeDasharray: 80 } : undefined}
      />

      {/* 2. 中間アーク */}
      <path
        d="M 66 86 A 56 56 0 0 1 112 135"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="12"
        strokeLinecap="round"
        className={
          mode === "sparkle"
            ? "animate-[waveArc2_2.6s_cubic-bezier(0.16,1,0.3,1)_forwards]"
            : mode === "trace"
            ? "animate-[traceArc_2.8s_cubic-bezier(0.16,1,0.3,1)_forwards]"
            : ""
        }
        style={mode === "trace" ? { strokeDasharray: 120 } : undefined}
      />

      {/* 3. 外側アーク */}
      <path
        d="M 70 64 A 78 78 0 0 1 134 130"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="12"
        strokeLinecap="round"
        className={
          mode === "sparkle"
            ? "animate-[waveArc3_2.6s_cubic-bezier(0.16,1,0.3,1)_forwards]"
            : mode === "trace"
            ? "animate-[traceArc_2.8s_cubic-bezier(0.16,1,0.3,1)_forwards]"
            : ""
        }
        style={mode === "trace" ? { strokeDasharray: 160 } : undefined}
      />

      {/* 大きい4光星（スパークルスター） */}
      <path
        d="M 134 34 L 140 60 L 166 66 L 140 72 L 134 98 L 128 72 L 102 66 L 128 60 Z"
        fill="#FFFFFF"
        filter="url(#star-glow)"
        className={
          mode === "sparkle"
            ? "animate-[sparkleStarBig_2.6s_cubic-bezier(0.16,1,0.3,1)_forwards]"
            : mode === "trace"
            ? "animate-[starPopIn_2.8s_cubic-bezier(0.16,1,0.3,1)_forwards]"
            : ""
        }
        style={{ transformOrigin: "134px 66px" }}
      />

      {/* 小さい4光星（右上スパークルスター） */}
      <path
        d="M 164 28 L 166.5 38 L 176.5 40.5 L 166.5 43 L 164 53 L 161.5 43 L 151.5 40.5 L 161.5 38 Z"
        fill="#FFFFFF"
        filter="url(#star-glow)"
        className={
          mode === "sparkle"
            ? "animate-[sparkleStarSmall_2.6s_cubic-bezier(0.16,1,0.3,1)_forwards]"
            : mode === "trace"
            ? "animate-[starPopInDelay_2.8s_cubic-bezier(0.16,1,0.3,1)_forwards]"
            : ""
        }
        style={{ transformOrigin: "164px 40.5px" }}
      />
    </svg>
  );
}

/**
 * 公式ブランドテキスト: Shadow (White) + Log (Primary Blue #2563EB / #3B82F6)
 * BrandLogo.tsx の仕様に完全準拠
 */
function OfficialBrandText({
  sizeClass = "text-3xl sm:text-4xl",
  className = "",
}: {
  sizeClass?: string;
  className?: string;
}) {
  return (
    <span
      className={`font-extrabold tracking-tight font-sans leading-none select-none text-white ${sizeClass} ${className}`}
      style={{ letterSpacing: "-0.03em" }}
    >
      Shadow<span className="text-[#3B82F6]">Log</span>
    </span>
  );
}

// ============================================================
// 案1: Zero to Sparkle (無から星がキラッと光り、3本波とロゴが出現)
// ============================================================
function SparkleWaveReveal() {
  return (
    <div className="relative flex flex-col items-center justify-center">
      {/* 背後の青いアンビエント光（最初は完全に0、途中からふわっと灯る） */}
      <div className="absolute w-48 h-48 rounded-full bg-blue-600/30 blur-3xl animate-[ambientGlowAppear_2.8s_ease-out_forwards]" />

      {/* 公式アイコン（無から星 ➔ 青ボックス ➔ 3本波の順に出現し、最後に公式画像と重なる） */}
      <div className="relative w-24 h-24 sm:w-28 sm:h-28">
        <OfficialIconSvg mode="sparkle" />
        <div className="absolute inset-0 rounded-[22%] overflow-hidden animate-[officialImgCrossfade_2.8s_ease-out_forwards]">
          <Image
            src="/icons/icon-512.png"
            alt="ShadowLog Official Icon"
            width={112}
            height={112}
            className="w-full h-full object-cover"
            priority
          />
        </div>
      </div>

      {/* 公式テキスト ShadowLog（無から下からスッと浮上） */}
      <div className="mt-5 animate-[textRevealUp_2.8s_cubic-bezier(0.16,1,0.3,1)_forwards]">
        <OfficialBrandText />
      </div>
    </div>
  );
}

// ============================================================
// 案2: Particle Convergence (無数の光の粒子が虚空から集結して実体化)
// ============================================================
const PARTICLES = [
  { x: -120, y: -80, size: 6, color: "#60A5FA", delay: "0.05s" },
  { x: 130, y: -70, size: 5, color: "#FFFFFF", delay: "0.1s" },
  { x: -140, y: 60, size: 7, color: "#3B82F6", delay: "0.08s" },
  { x: 110, y: 90, size: 6, color: "#93C5FD", delay: "0.12s" },
  { x: 0, y: -110, size: 8, color: "#FFFFFF", delay: "0.02s" },
  { x: -80, y: 100, size: 5, color: "#2563EB", delay: "0.15s" },
  { x: 90, y: -30, size: 6, color: "#FFFFFF", delay: "0.06s" },
  { x: -95, y: -20, size: 5, color: "#60A5FA", delay: "0.11s" },
  { x: 40, y: 110, size: 7, color: "#3B82F6", delay: "0.04s" },
  { x: -50, y: -95, size: 6, color: "#FFFFFF", delay: "0.09s" },
];

function ParticleConvergeReveal() {
  return (
    <div className="relative flex flex-col items-center justify-center">
      {/* 虚空から中央へ収束する光の粒子群 */}
      <div className="
        absolute inset-0 flex items-center justify-center pointer-events-none">
        {PARTICLES.map((p, i) => (
          <span
            key={i}
            className="absolute rounded-full animate-[particleConverge_1.1s_cubic-bezier(0.4,0,0.2,1)_forwards]"
            style={
              {
                width: p.size,
                height: p.size,
                backgroundColor: p.color,
                boxShadow: `0 0 12px ${p.color}`,
                "--start-x": `${p.x}px`,
                "--start-y": `${p.y}px`,
                animationDelay: p.delay,
                opacity: 0,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      {/* 粒子がぶつかった瞬間のフラッシュリング */}
      <div className="absolute w-32 h-32 rounded-full bg-blue-500/40 blur-2xl animate-[convergeFlash_2.7s_ease-out_forwards]" />

      {/* 粒子収束と同時に無から実体化する公式アイコン＆テキスト */}
      <div className="flex flex-col items-center animate-[convergeLogoMaterialize_2.7s_cubic-bezier(0.16,1,0.3,1)_forwards]">
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-[22%] overflow-hidden shadow-[0_0_40px_rgba(37,99,235,0.6)]">
          <Image
            src="/icons/icon-512.png"
            alt="ShadowLog Official Icon"
            width={112}
            height={112}
            className="w-full h-full object-cover"
            priority
          />
        </div>
        <div className="mt-5">
          <OfficialBrandText />
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 案3: Mist & Focus Reveal (深いブラーの虚空からピントが合って結像)
// ============================================================
function BlurFocusReveal() {
  const letters = [
    { char: "S", blue: false },
    { char: "h", blue: false },
    { char: "a", blue: false },
    { char: "d", blue: false },
    { char: "o", blue: false },
    { char: "w", blue: false },
    { char: "L", blue: true },
    { char: "o", blue: true },
    { char: "g", blue: true },
  ];

  return (
    <div className="relative flex flex-col items-center justify-center">
      {/* 深い霧のような青いオーラが無から滲み出る */}
      <div className="absolute w-56 h-56 rounded-full bg-blue-600/25 blur-3xl animate-[ambientGlowAppear_2.8s_ease-out_forwards]" />

      {/* ブラー（ぼかし）＋拡大状態からピントが合って結像する公式アイコン */}
      <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-[22%] overflow-hidden shadow-[0_0_35px_rgba(37,99,235,0.5)] animate-[blurFocusIcon_2.8s_cubic-bezier(0.16,1,0.3,1)_forwards]">
        <Image
          src="/icons/icon-512.png"
          alt="ShadowLog Official Icon"
          width={112}
          height={112}
          className="w-full h-full object-cover"
          priority
        />
      </div>

      {/* 1文字ずつブラーが取れて現れる公式タイポグラフィ */}
      <div
        className="mt-5 flex items-center font-extrabold tracking-tight font-sans text-3xl sm:text-4xl leading-none select-none"
        style={{ letterSpacing: "-0.03em" }}
      >
        {letters.map((item, idx) => (
          <span
            key={idx}
            className={`${
              item.blue ? "text-[#3B82F6]" : "text-white"
            } inline-block animate-[letterBlurIn_2.8s_cubic-bezier(0.16,1,0.3,1)_forwards]`}
            style={{
              animationDelay: `${0.5 + idx * 0.06}s`,
              opacity: 0,
            }}
          >
            {item.char}
          </span>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// 案4: Laser Blueprint Trace (無に光の線が波と星を描き、横並びフルロゴへ展開)
// ============================================================
function BlueprintTraceReveal() {
  return (
    <div className="relative flex items-center justify-center">
      <div className="absolute w-64 h-32 rounded-full bg-blue-600/20 blur-3xl animate-[ambientGlowAppear_3s_ease-out_forwards]" />

      {/* ヘッダーと同じ横並び（Icon + ShadowLog）で無から完成する構成 */}
      <div className="flex items-center gap-3.5 sm:gap-4">
        <div className="relative w-16 h-16 sm:w-20 sm:h-20 shrink-0">
          <OfficialIconSvg mode="trace" />
          <div className="absolute inset-0 rounded-[22%] overflow-hidden animate-[officialImgTraceCrossfade_3s_ease-out_forwards]">
            <Image
              src="/icons/icon-512.png"
              alt="ShadowLog Official Icon"
              width={80}
              height={80}
              className="w-full h-full object-cover"
              priority
            />
          </div>
        </div>

        <div className="overflow-hidden py-1">
          <div className="animate-[horizontalTextSlide_3s_cubic-bezier(0.16,1,0.3,1)_forwards]">
            <OfficialBrandText sizeClass="text-3xl sm:text-5xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 案5: Dimensional Spotlight (完全な闇からスポットライトが差し込み立体浮上＋ツヤ反射)
// ============================================================
function DimensionalRiseReveal() {
  return (
    <div className="relative flex flex-col items-center justify-center">
      {/* 上方から差し込むスポットライトの光束（最初は完全に無） */}
      <div
        className="absolute -top-20 w-72 h-72 pointer-events-none animate-[spotlightBeam_2.6s_ease-out_forwards]"
        style={{
          background:
            "radial-gradient(ellipse at top, rgba(59,130,246,0.45) 0%, rgba(37,99,235,0.12) 55%, transparent 80%)",
          filter: "blur(16px)",
        }}
      />

      {/* 闇の底からせり上がり、表面にガラスのシマー（反射光）が走る公式アイコン */}
      <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-[22%] overflow-hidden shadow-[0_12px_40px_rgba(37,99,235,0.55)] animate-[dimensionalRiseIcon_2.6s_cubic-bezier(0.16,1,0.3,1)_forwards]">
        <Image
          src="/icons/icon-512.png"
          alt="ShadowLog Official Icon"
          width={112}
          height={112}
          className="w-full h-full object-cover"
          priority
        />
        {/* 表面を斜めに走る白い光沢シマー */}
        <div
          className="absolute inset-0 pointer-events-none animate-[shimmerSweep_2.6s_ease-in-out_forwards]"
          style={{
            background:
              "linear-gradient(120deg, transparent 20%, rgba(255,255,255,0.55) 50%, transparent 80%)",
          }}
        />
      </div>

      {/* 続いて静かに浮上する公式テキスト ShadowLog */}
      <div className="mt-5 animate-[dimensionalRiseText_2.6s_cubic-bezier(0.16,1,0.3,1)_forwards]">
        <OfficialBrandText />
      </div>
    </div>
  );
}
