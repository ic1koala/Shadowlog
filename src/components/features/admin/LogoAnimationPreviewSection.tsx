"use client";

import React, { useState } from "react";
import {
  Film,
  Sparkles,
  Maximize2,
  X,
  CheckCircle2,
  ArrowRight,
  Layers,
  Code2,
} from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";
import {
  LogoAnimationPlayer,
  LogoAnimationPattern,
  LOGO_ANIMATION_PATTERNS,
  LogoAnimationMeta,
} from "@/components/features/onboarding/LogoAnimationPlayer";

export function LogoAnimationPreviewSection() {
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
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-blue-950/70 to-slate-900 border border-blue-500/30 p-6 sm:p-8 shadow-xl text-white">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-48 h-48 bg-indigo-500/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-300 text-xs font-semibold">
                <Film className="w-3.5 h-3.5" />
                <span>公式BrandLogo準拠・無からの出現演出（音声なし）</span>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs">
                <span className="text-slate-300">参照仕様ロゴ:</span>
                <BrandLogo size="xs" inverted />
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              公式ロゴオープニング（全5案・無から出現）
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              仕様書の公式ロゴ（ロイヤルブルー角丸＋3本の白い音声ウェーブ＋大小2つのスパークル星）と公式テキスト（
              <span className="font-bold text-white">Shadow</span>
              <span className="font-bold text-blue-400">Log</span>
              ）を使用し、**「何もない無（暗闇）の状態から2.5〜3秒で現れる」**5つのアニメーションパターンです。
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => openFullScreen("sparkle_wave")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:opacity-95 transition shadow-lg shadow-blue-600/25 cursor-pointer"
            >
              <Maximize2 className="w-4 h-4" />
              <span>全画面スプラッシュで体験</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5-Card Grid Preview */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-500" />
            <h2 className="text-sm sm:text-base font-bold text-foreground">
              公式ロゴ＆テキスト「無から現れる」5パターン比較
            </h2>
          </div>
          <span className="text-xs text-muted-foreground">
            全案：音声なし（サイレント） / 2.6〜3.0秒
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {LOGO_ANIMATION_PATTERNS.map((meta, index) => (
            <PatternCard
              key={meta.id}
              meta={meta}
              index={index + 1}
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
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeCodeTab === "comparison"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>5案の出現ギミック比較表</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCodeTab("usage")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
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
                  <th className="py-2.5 px-3 font-semibold">無からの出現プロセス</th>
                  <th className="py-2.5 px-3 font-semibold">尺 (秒)</th>
                  <th className="py-2.5 px-3 font-semibold">推奨シナリオ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="py-3 px-3 font-bold text-blue-500">案 1</td>
                  <td className="py-3 px-3 font-bold text-foreground">
                    無からの閃光・ウェーブ出現
                  </td>
                  <td className="py-3 px-3 text-muted-foreground">
                    無 ➔ 星がキラッと誕生 ➔ 3本の音波が内から外へ波紋出現 ➔ ShadowLog浮上
                  </td>
                  <td className="py-3 px-3 font-mono text-blue-500 font-bold">2.8秒</td>
                  <td className="py-3 px-3 text-muted-foreground">
                    公式アイコンの「波＋星」デザインを最も忠実に活かした王道案
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-bold text-sky-500">案 2</td>
                  <td className="py-3 px-3 font-bold text-foreground">
                    光粒子の集結・実体化
                  </td>
                  <td className="py-3 px-3 text-muted-foreground">
                    無 ➔ 四方から青と白の光の粒が中央へ高速集結 ➔ 閃光とともに公式ロゴ実体化
                  </td>
                  <td className="py-3 px-3 font-mono text-blue-500 font-bold">2.7秒</td>
                  <td className="py-3 px-3 text-muted-foreground">
                    AIテクノロジー感と「無から形が生成される」躍動感を出す場合
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-bold text-indigo-500">案 3</td>
                  <td className="py-3 px-3 font-bold text-foreground">
                    深淵からのピント結像（ブラー出現）
                  </td>
                  <td className="py-3 px-3 text-muted-foreground">
                    無 ➔ 深いブラーの青い霧からピントが急速に合ってアイコン結像 ➔ 1文字ずつ出現
                  </td>
                  <td className="py-3 px-3 font-mono text-blue-500 font-bold">2.8秒</td>
                  <td className="py-3 px-3 text-muted-foreground">
                    映画オープニングのような奥行きとスマートで上品な演出
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-bold text-cyan-500">案 4</td>
                  <td className="py-3 px-3 font-bold text-foreground">
                    光線ドローイング ➔ フルロゴ展開
                  </td>
                  <td className="py-3 px-3 text-muted-foreground">
                    無 ➔ 白い光線が3本波と星を一筆書き ➔ 青色が灯り横にShadowLogがスライド出現
                  </td>
                  <td className="py-3 px-3 font-mono text-blue-500 font-bold">3.0秒</td>
                  <td className="py-3 px-3 text-muted-foreground">
                    アプリヘッダーの横並びフルロゴと同じレイアウトで印象づけたい場合
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-bold text-blue-400">案 5</td>
                  <td className="py-3 px-3 font-bold text-foreground">
                    シャドウ・スポットライト浮上
                  </td>
                  <td className="py-3 px-3 text-muted-foreground">
                    無 ➔ 上方から青いスポットライト照射 ➔ 闇からロゴが浮上しガラス反射光が走る
                  </td>
                  <td className="py-3 px-3 font-mono text-blue-500 font-bold">2.6秒</td>
                  <td className="py-3 px-3 text-muted-foreground">
                    Apple風のミニマル・高級感・テンポの良さを重視する場合
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              初回起動判定（`localStorage.getItem(&apos;shadowlog_has_seen_intro&apos;)`）に基づき、音声なしでスマートに2.5〜3秒再生したあと、オンボーディングチュートリアルへ遷移させるコード例です。
            </p>
            <div className="p-4 rounded-xl bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto border border-slate-800">
              <pre>{`// 初回起動時のコンポーネント構成例 (音声なし・公式ロゴ出現)
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
      pattern="sparkle_wave" // sparkle_wave | particle_converge | blur_focus | blueprint_trace | dimensional_rise
      fullScreenMode={true}
      onComplete={() => {
        localStorage.setItem("shadowlog_has_seen_intro", "true");
        setShowSplash(false);
        // 続いてオンボーディングチュートリアルを表示
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
        <div className="fixed inset-0 z-50 bg-[#060911] flex flex-col items-center justify-center p-4">
          <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">
              全画面スプラッシュ・シミュレーション（サイレント）
            </span>
            <button
              type="button"
              onClick={closeFullScreen}
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              title="閉じる"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="w-full max-w-2xl h-full flex flex-col items-center justify-center">
            <LogoAnimationPlayer
              pattern={fullScreenPattern}
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
                <span>ロゴ出現完了 ➔ オンボーディングへ自動遷移</span>
              </div>
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={closeFullScreen}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs sm:text-sm shadow-lg hover:opacity-95 transition cursor-pointer"
                >
                  <span>チュートリアルへ進む（プレビューを閉じる）</span>
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
  onFullScreen,
}: {
  meta: LogoAnimationMeta;
  index: number;
  onFullScreen: () => void;
}) {
  return (
    <div className="flex flex-col rounded-2xl bg-card border border-border shadow-sm overflow-hidden hover:border-primary/40 transition group">
      {/* Visual Animation Player Frame */}
      <div className="relative p-2 bg-[#04060B]">
        <LogoAnimationPlayer pattern={meta.id} autoPlay={true} showControls={true} />
        <div className="absolute top-4 left-4 z-20">
          <span className="px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-black tracking-wider text-blue-400 border border-white/10 uppercase">
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
            <span className="font-semibold text-foreground block mb-0.5">💡 演出の特徴:</span>
            {meta.recommendedFor}
          </div>

          <button
            type="button"
            onClick={onFullScreen}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold border border-border bg-background hover:bg-muted text-foreground transition cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5 text-primary" />
            <span>全画面スプラッシュで試す</span>
          </button>
        </div>
      </div>
    </div>
  );
}
