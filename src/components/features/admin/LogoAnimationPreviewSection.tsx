"use client";

import React, { useState } from "react";
import {
  Film,
  Sparkles,
  Volume2,
  VolumeX,
  Maximize2,
  X,
  Play,
  RotateCcw,
  CheckCircle2,
  ArrowRight,
  Zap,
  Radio,
  Layers,
  Activity,
  Code2,
} from "lucide-react";
import {
  LogoAnimationPlayer,
  LogoAnimationPattern,
  LOGO_ANIMATION_PATTERNS,
  LogoAnimationMeta,
} from "@/components/features/onboarding/LogoAnimationPlayer";

export function LogoAnimationPreviewSection() {
  const [globalSound, setGlobalSound] = useState(false);
  const [fullScreenPattern, setFullScreenPattern] = useState<LogoAnimationPattern | null>(null);
  const [splashFinished, setSplashFinished] = useState(false);
  const [activeCodeTab, setActiveCodeTab] = useState<"usage" | "comparison">("comparison");

  const openFullScreen = (id: LogoAnimationPattern) => {
    setFullScreenPattern(id);
    setSplashFinished(false);
  };

  const closeFullScreen = () => {
    setFullScreenPattern(null);
    setSplashFinished(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950/70 to-slate-900 border border-indigo-500/30 p-6 sm:p-8 shadow-xl text-white">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-48 h-48 bg-cyan-500/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-xs font-semibold">
              <Film className="w-3.5 h-3.5" />
              <span>初回アプリ起動演出・プロトタイプスタジオ</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Netflix風 ロゴオープニング（全5案）
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              「初回起動 ➔ 2〜3秒のロゴアニメーション ➔
              オンボーディングチュートリアル」へ滑らかに誘導するための動的オープニングです。SVG＋Web
              Audio APIによる外部通信不要・瞬時描画設計。各案を比較し、全画面実機プレビューで体感できます。
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setGlobalSound(!globalSound)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-sm border ${
                globalSound
                  ? "bg-cyan-500 text-slate-950 border-cyan-400 shadow-cyan-500/20"
                  : "bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white"
              }`}
            >
              {globalSound ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <span>重低音SFX: {globalSound ? "ON (有効)" : "OFF (ミュート)"}</span>
            </button>

            <button
              type="button"
              onClick={() => openFullScreen("prism")}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-500 to-cyan-500 text-white hover:opacity-95 transition shadow-lg shadow-indigo-500/25"
            >
              <Maximize2 className="w-4 h-4" />
              <span>全画面で一括体験</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5-Card Grid Preview */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm sm:text-base font-bold text-foreground">
              ロゴアニメーション 5パターン比較一覧
            </h2>
          </div>
          <span className="text-xs text-muted-foreground">
            全案：軽量ベクターSVG / 通信量0MB / 2.5〜3.0秒
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {LOGO_ANIMATION_PATTERNS.map((meta, index) => (
            <PatternCard
              key={meta.id}
              meta={meta}
              index={index + 1}
              soundEnabled={globalSound}
              onFullScreen={() => openFullScreen(meta.id)}
            />
          ))}
        </div>
      </div>

      {/* Tabs: Comparison Matrix & Onboarding Implementation Guide */}
      <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-5">
        <div className="flex items-center gap-3 border-b border-border pb-3">
          <button
            type="button"
            onClick={() => setActiveCodeTab("comparison")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeCodeTab === "comparison"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>5案の特徴・ターゲット比較表</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCodeTab("usage")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeCodeTab === "usage"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>初回起動 ➔ チュートリアル結合コード例</span>
          </button>
        </div>

        {activeCodeTab === "comparison" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground bg-muted/30">
                  <th className="py-2.5 px-3 font-semibold">案</th>
                  <th className="py-2.5 px-3 font-semibold">パターン名</th>
                  <th className="py-2.5 px-3 font-semibold">演出手法</th>
                  <th className="py-2.5 px-3 font-semibold">尺 (秒)</th>
                  <th className="py-2.5 px-3 font-semibold">世界観・印象</th>
                  <th className="py-2.5 px-3 font-semibold">推奨シナリオ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="py-3 px-3 font-bold text-primary">案 1</td>
                  <td className="py-3 px-3 font-bold text-foreground">
                    Prism Strike (Netflix直系)
                  </td>
                  <td className="py-3 px-3 text-muted-foreground">
                    多重光速リボンストローク ➔ 光粒子拡散
                  </td>
                  <td className="py-3 px-3 font-mono text-cyan-500 font-bold">2.8秒</td>
                  <td className="py-3 px-3 text-foreground">圧倒的シネマティック、映画体験</td>
                  <td className="py-3 px-3 text-muted-foreground">
                    まずは王道の感動・ブランド記憶定着
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-bold text-cyan-500">案 2</td>
                  <td className="py-3 px-3 font-bold text-foreground">Audio Waveform Morph</td>
                  <td className="py-3 px-3 text-muted-foreground">
                    音声EQイコライザー ➔ 1本光収束 ➔ S字
                  </td>
                  <td className="py-3 px-3 font-mono text-cyan-500 font-bold">2.6秒</td>
                  <td className="py-3 px-3 text-foreground">知性、ハイテク、音声AI特化</td>
                  <td className="py-3 px-3 text-muted-foreground">
                    英語シャドーイング専門アプリの機能性訴求
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-bold text-emerald-500">案 3</td>
                  <td className="py-3 px-3 font-bold text-foreground">Eclipse Shadow</td>
                  <td className="py-3 px-3 text-muted-foreground">
                    日食コロナ閃光 ➔ 影から3Dエンブレム浮上
                  </td>
                  <td className="py-3 px-3 font-mono text-cyan-500 font-bold">3.0秒</td>
                  <td className="py-3 px-3 text-foreground">重厚、プレミアム、ラグジュアリー</td>
                  <td className="py-3 px-3 text-muted-foreground">
                    Shadow（影）から光へ。大人の自己投資感
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-bold text-rose-500">案 4</td>
                  <td className="py-3 px-3 font-bold text-foreground">Sonic Boom</td>
                  <td className="py-3 px-3 text-muted-foreground">
                    同心円ショックウェーブ ➔ ドカンと着地
                  </td>
                  <td className="py-3 px-3 font-mono text-cyan-500 font-bold">2.5秒</td>
                  <td className="py-3 px-3 text-foreground">音速突破、躍動感、ハイスピード</td>
                  <td className="py-3 px-3 text-muted-foreground">
                    WPM150+を狙う学習意欲とテンポ重視
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-bold text-violet-500">案 5</td>
                  <td className="py-3 px-3 font-bold text-foreground">Minimal Tech Glow</td>
                  <td className="py-3 px-3 text-muted-foreground">
                    極細ヘアライン ➔ オーロラ呼吸 ➔ ガラス艶
                  </td>
                  <td className="py-3 px-3 font-mono text-cyan-500 font-bold">2.7秒</td>
                  <td className="py-3 px-3 text-foreground">Apple/Linear風、洗練、ノイズレス</td>
                  <td className="py-3 px-3 text-muted-foreground">
                    ミニマル志向、エグゼクティブビジネス層
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              初回起動判定（例: `localStorage.getItem(&apos;shadowlog_has_seen_intro&apos;)`）に基づき、初回のみアニメーションを再生してオンボーディングへ遷移させる実装パターンです。
            </p>
            <div className="p-4 rounded-xl bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto border border-slate-800">
              <pre>{`// 初回起動時のコンポーネント構成例 (App.tsx / page.tsx)
const [showSplash, setShowSplash] = useState(false);

useEffect(() => {
  const hasSeen = localStorage.getItem("shadowlog_has_seen_intro");
  if (!hasSeen) {
    setShowSplash(true);
  }
}, []);

if (showSplash) {
  return (
    <LogoAnimationPlayer
      pattern="prism" // お好みの案を選択 (prism, waveform, eclipse, sonic, minimal)
      soundEnabled={true}
      fullScreenMode={true}
      onComplete={() => {
        localStorage.setItem("shadowlog_has_seen_intro", "true");
        setShowSplash(false);
        // ここでオンボーディングチュートリアルモーダルを表示
      }}
    />
  );
}`}</pre>
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen Splash Modal Simulation */}
      {fullScreenPattern && (
        <div className="fixed inset-0 z-50 bg-[#070A12] flex flex-col items-center justify-center p-4">
          <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">
              全画面シミュレーションモード
            </span>
            <button
              type="button"
              onClick={closeFullScreen}
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
              title="閉じる"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="w-full max-w-2xl h-full flex flex-col items-center justify-center">
            <LogoAnimationPlayer
              pattern={fullScreenPattern}
              soundEnabled={globalSound}
              fullScreenMode={true}
              onComplete={() => setSplashFinished(true)}
            />

            {/* アニメーション終了後にスッと現れるオンボーディング開始バナー */}
            <div
              className={`mt-6 text-center space-y-4 transition-all duration-700 ${
                splashFinished
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-4 pointer-events-none"
              }`}
            >
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold border border-emerald-500/30">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>再生完了 (2〜3秒スプラッシュ終了)</span>
              </div>
              <p className="text-slate-300 text-xs sm:text-sm">
                実際のアプリではこのタイミングで「オンボーディングチュートリアル（初回案内）」へ滑らかに遷移します。
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={closeFullScreen}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary to-cyan-500 text-white font-bold text-xs sm:text-sm shadow-lg hover:opacity-95 transition"
                >
                  <span>チュートリアルへ進む（シミュレーション終了）</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PatternCard({
  meta,
  index,
  soundEnabled,
  onFullScreen,
}: {
  meta: LogoAnimationMeta;
  index: number;
  soundEnabled: boolean;
  onFullScreen: () => void;
}) {
  return (
    <div className="flex flex-col rounded-2xl bg-card border border-border shadow-sm overflow-hidden hover:border-primary/40 transition group">
      {/* Visual Animation Player Frame */}
      <div className="relative p-2 bg-[#05080E]">
        <LogoAnimationPlayer
          pattern={meta.id}
          autoPlay={true}
          soundEnabled={soundEnabled}
          showControls={true}
        />
        <div className="absolute top-4 left-4 z-20">
          <span className="px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-black tracking-wider text-cyan-400 border border-white/10 uppercase">
            案 {index} / 5
          </span>
        </div>
      </div>

      {/* Meta & Description Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-bold text-sm sm:text-base text-foreground group-hover:text-primary transition">
              {meta.nameJa}
            </h3>
            <span className="shrink-0 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-muted text-foreground">
              {meta.durationSec}s
            </span>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">{meta.tagline}</p>
        </div>

        <div className="space-y-2 pt-2 border-t border-border">
          <div className="text-[11px] text-muted-foreground bg-muted/40 p-2.5 rounded-xl leading-relaxed">
            <span className="font-semibold text-foreground block mb-0.5">💡 推奨ポイント:</span>
            {meta.recommendedFor}
          </div>

          <button
            type="button"
            onClick={onFullScreen}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold border border-border bg-background hover:bg-muted text-foreground transition"
          >
            <Maximize2 className="w-3.5 h-3.5 text-primary" />
            <span>全画面スプラッシュで試す</span>
          </button>
        </div>
      </div>
    </div>
  );
}
