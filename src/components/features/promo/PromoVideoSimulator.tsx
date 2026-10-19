"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
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
  Activity,
  CheckCircle2,
  TrendingUp,
  Award,
  Video,
} from "lucide-react";

interface PromoVideoSimulatorProps {
  onFullScreenChange?: (isFull: boolean) => void;
}

export function PromoVideoSimulator({ onFullScreenChange }: PromoVideoSimulatorProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0); // in seconds
  const [aspectRatio, setAspectRatio] = useState<"vertical" | "horizontal">("vertical"); // vertical: 9:16, horizontal: 16:9
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showRecordingGuide, setShowRecordingGuide] = useState(false);

  const duration = 18.0; // Total 18 seconds
  const animFrameRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Sound Synthesizer via Web Audio API
  const playSound = useCallback((type: "click" | "beep" | "success" | "transition") => {
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

      if (type === "click") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === "beep") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(650, now);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === "transition") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(520, now + 0.25);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === "success") {
        // Chord
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
          const chordOsc = ctx.createOscillator();
          const chordGain = ctx.createGain();
          chordOsc.connect(chordGain);
          chordGain.connect(ctx.destination);
          chordOsc.type = "sine";
          chordOsc.frequency.setValueAtTime(freq, now + idx * 0.05);
          chordGain.gain.setValueAtTime(0.1, now + idx * 0.05);
          chordGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
          chordOsc.start(now + idx * 0.05);
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
    if (currentTime < 3.5) currentScene = 1;
    else if (currentTime < 7.5) currentScene = 2;
    else if (currentTime < 12.0) currentScene = 3;
    else if (currentTime < 15.5) currentScene = 4;
    else currentScene = 5;

    if (currentScene !== lastSceneRef.current && isPlaying) {
      lastSceneRef.current = currentScene;
      if (currentScene === 2) playSound("transition");
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

  // Helper values for timeline scenes
  const t = currentTime;
  const isScene1 = t >= 0 && t < 3.5;
  const isScene2 = t >= 3.5 && t < 7.5;
  const isScene3 = t >= 7.5 && t < 12.0;
  const isScene4 = t >= 12.0 && t < 15.5;
  const isScene5 = t >= 15.5 && t <= 18.0;

  // Camera zoom calculation (simulating smooth director punch-in)
  let cameraScale = 1.0;
  let cameraTranslateY = 0;
  if (isScene1) {
    cameraScale = 0.95 + (t / 3.5) * 0.05;
    cameraTranslateY = 15 - (t / 3.5) * 15;
  } else if (isScene2) {
    const p = (t - 3.5) / 4.0;
    cameraScale = 1.0 + p * 0.12;
    cameraTranslateY = -p * 20;
  } else if (isScene3) {
    const p = (t - 7.5) / 4.5;
    cameraScale = 1.12 + p * 0.06;
    cameraTranslateY = -20 - p * 15;
  } else if (isScene4) {
    const p = (t - 12.0) / 3.5;
    cameraScale = 1.18 - p * 0.08;
    cameraTranslateY = -35 + p * 15;
  } else if (isScene5) {
    const p = (t - 15.5) / 2.5;
    cameraScale = 1.1 - p * 0.15;
    cameraTranslateY = -20 + p * 20;
  }

  // WPM meter gauge calculation during Scene 3
  const wpmValue = Math.min(
    148,
    Math.round(isScene3 ? 80 + Math.pow((t - 7.5) / 4.5, 1.3) * 68 : isScene4 || isScene5 ? 148 : 0)
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
        {/* Background Atmosphere & Ambient Light */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[340px] h-[340px] rounded-full blur-[90px] transition-all duration-1000"
            style={{
              background: isScene3
                ? "radial-gradient(circle, rgba(168,85,247,0.22) 0%, rgba(59,130,246,0.12) 60%, transparent 100%)"
                : isScene4
                ? "radial-gradient(circle, rgba(34,197,94,0.25) 0%, rgba(59,130,246,0.15) 60%, transparent 100%)"
                : "radial-gradient(circle, rgba(59,130,246,0.25) 0%, rgba(99,102,241,0.12) 60%, transparent 100%)",
            }}
          />
          {/* Subtle Cyber Grid */}
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
          {/* Top Overlaid Subtitles / Taglines */}
          <div className="w-full text-center z-20 pt-2 sm:pt-4 min-h-[70px] flex items-center justify-center">
            {isScene1 && (
              <div className="animate-fade-in space-y-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 backdrop-blur-md">
                  <Sparkles className="w-3 h-3" />
                  忙しい社会人のためのAI英語
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight drop-shadow-md">
                  英語を声に出す機会、<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-pink-400 to-amber-300">
                    ゼロになっていませんか？
                  </span>
                </h2>
              </div>
            )}

            {isScene2 && (
              <div className="animate-fade-in space-y-1">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 backdrop-blur-md">
                  <Activity className="w-3 h-3" />
                  1分で実力判定
                </span>
                <h2 className="text-lg sm:text-xl font-extrabold text-white">
                  発話速度（WPM）と発音を<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                    AIが0秒で精密スコア化！
                  </span>
                </h2>
              </div>
            )}

            {isScene3 && (
              <div className="animate-fade-in space-y-1">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30 animate-pulse backdrop-blur-md">
                  <Mic className="w-3 h-3" />
                  リアルタイム音声解析中
                </span>
                <h2 className="text-lg sm:text-xl font-extrabold text-white">
                  声を吹き込むだけで、<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-300">
                    自然なスピードに耳と口が慣れる！
                  </span>
                </h2>
              </div>
            )}

            {isScene4 && (
              <div className="animate-fade-in space-y-1">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 backdrop-blur-md">
                  <Award className="w-3 h-3" />
                  推定TOEICスコア即時判定
                </span>
                <h2 className="text-lg sm:text-xl font-extrabold text-white">
                  弱点単語とリンキングも<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
                    単語単位でまるわかり！
                  </span>
                </h2>
              </div>
            )}

            {isScene5 && (
              <div className="animate-fade-in space-y-1">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 backdrop-blur-md">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  11月正式リリース！ベータ無料枠公開中
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  あなたも今すぐ、<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400">
                    自分の英語力を1分測定！
                  </span>
                </h2>
              </div>
            )}
          </div>

          {/* Center: Sleek 3D Device Mockup */}
          <div className="relative my-auto z-10">
            {/* Phone Body Frame */}
            <div
              className={`relative bg-[#090D1A] rounded-[42px] border-[5px] border-slate-700/80 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(37,99,235,0.2)] overflow-hidden transition-all duration-500 ${
                aspectRatio === "vertical" ? "w-[280px] h-[460px]" : "w-[260px] h-[390px]"
              }`}
            >
              {/* Dynamic Island / Speaker */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-4 bg-slate-950 rounded-full z-30 flex items-center justify-end px-2 gap-1 border border-slate-800">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>

              {/* In-App Screen Content */}
              <div className="w-full h-full bg-[#0B0F19] pt-8 px-3.5 pb-3 flex flex-col justify-between text-slate-100 select-none">
                {/* App Header */}
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-md bg-blue-600 flex items-center justify-center font-bold text-[10px] text-white">
                      S
                    </div>
                    <span className="text-xs font-black tracking-tight text-white">
                      Shadow<span className="text-blue-400">Log</span>
                    </span>
                  </div>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    AI 1min診断
                  </span>
                </div>

                {/* Scene 1 & 2: Prompt Card */}
                {(isScene1 || isScene2) && (
                  <div className="my-auto space-y-3 animate-fade-in">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>Question 3 / 5</span>
                      <span className="text-blue-400 font-bold">Business Level</span>
                    </div>

                    <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800 space-y-2 shadow-inner">
                      <p className="text-xs font-medium text-slate-200 leading-relaxed">
                        We need to <span className="font-bold text-blue-400">/</span> discuss the
                        project timeline <span className="font-bold text-blue-400">/</span> before
                        the next release.
                      </p>
                      <p className="text-[10px] text-slate-400">
                        次のリリース前に、プロジェクトのスケジュールを話し合う必要があります。
                      </p>
                    </div>

                    <div className="flex justify-center pt-2">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 animate-bounce">
                        <Mic className="w-6 h-6" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Scene 3: Live Recording & Audio Waveform */}
                {isScene3 && (
                  <div className="my-auto space-y-3 animate-fade-in text-center">
                    <div className="inline-flex items-center gap-1 text-[10px] text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" />
                      Listening & Recording...
                    </div>

                    {/* Live Waveform Bars */}
                    <div className="h-14 flex items-center justify-center gap-1 px-4 bg-slate-900/60 rounded-xl border border-purple-500/20">
                      {[18, 36, 52, 28, 48, 64, 32, 58, 44, 22, 50, 30].map((h, i) => (
                        <div
                          key={i}
                          className="w-1 bg-gradient-to-t from-purple-500 to-cyan-400 rounded-full animate-pulse"
                          style={{
                            height: `${Math.min(50, h * (0.6 + Math.sin(t * 8 + i) * 0.4))}px`,
                            animationDuration: `${0.4 + (i % 3) * 0.2}s`,
                          }}
                        />
                      ))}
                    </div>

                    {/* Speed Meter Needle */}
                    <div className="bg-slate-900/90 rounded-xl p-2.5 border border-slate-800 flex items-center justify-around">
                      <div className="text-left">
                        <div className="text-[9px] text-slate-400">Realtime Speed</div>
                        <div className="text-lg font-black text-purple-400 font-mono">
                          {wpmValue} <span className="text-[10px] font-normal text-slate-400">WPM</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[9px] text-slate-400">Target Level</div>
                        <div className="text-xs font-bold text-emerald-400">Native Pace</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Scene 4: AI Feedback & Score Reveal */}
                {isScene4 && (
                  <div className="my-auto space-y-2.5 animate-fade-in">
                    <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-3 text-center">
                      <div className="text-[10px] font-bold text-emerald-400 flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        AI Analysis Complete!
                      </div>
                      <div className="text-2xl font-black text-white mt-1">
                        TOEIC <span className="text-emerald-400">780</span> 点相当
                      </div>
                      <div className="text-[10px] text-slate-300 font-medium mt-0.5">
                        実効速度: <span className="font-bold text-blue-400">148 WPM</span>（A判定）
                      </div>
                    </div>

                    {/* Diff Breakdown */}
                    <div className="bg-slate-900/90 rounded-xl p-2.5 border border-slate-800 text-[10px] space-y-1">
                      <div className="text-slate-400 text-[9px]">単語単位の発音・脱落チェック:</div>
                      <div className="flex flex-wrap gap-1 font-mono text-[10px]">
                        <span className="px-1 py-0.5 bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">We</span>
                        <span className="px-1 py-0.5 bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">need</span>
                        <span className="px-1 py-0.5 bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">to</span>
                        <span className="px-1 py-0.5 bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">discuss</span>
                        <span className="px-1 py-0.5 bg-blue-500/20 text-blue-300 rounded border border-blue-500/30">timeline</span>
                        <span className="px-1 py-0.5 bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">before</span>
                        <span className="px-1 py-0.5 bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">release</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Scene 5: Outro & App Dashboard */}
                {isScene5 && (
                  <div className="my-auto space-y-3 animate-fade-in text-center">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-extrabold text-xl mx-auto shadow-lg shadow-blue-500/40">
                      S
                    </div>
                    <div>
                      <div className="text-sm font-black text-white">ShadowLog</div>
                      <div className="text-[10px] text-blue-300 font-medium">
                        シャドーイング ＆ 発話測定SaaS
                      </div>
                    </div>

                    <div className="bg-blue-600 text-white font-bold py-2 px-4 rounded-xl text-xs shadow-md shadow-blue-500/30 animate-pulse">
                      無料で1分診断を試す →
                    </div>
                  </div>
                )}

                {/* App Bottom Navigation */}
                <div className="flex items-center justify-around border-t border-slate-800/80 pt-1.5 text-slate-500 text-[9px]">
                  <span className="text-blue-400 font-bold flex flex-col items-center">
                    <Sparkles className="w-3 h-3" />
                    <span>診断</span>
                  </span>
                  <span className="flex flex-col items-center">
                    <Activity className="w-3 h-3" />
                    <span>練習</span>
                  </span>
                  <span className="flex flex-col items-center">
                    <TrendingUp className="w-3 h-3" />
                    <span>記録</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

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
              <h3 className="font-bold text-sm text-white">プロモーション動画ディレクター</h3>
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
              <span className={isScene1 ? "text-blue-400 font-bold" : ""}>0s 課題提起</span>
              <span className={isScene2 ? "text-blue-400 font-bold" : ""}>3.5s 診断開始</span>
              <span className={isScene3 ? "text-purple-400 font-bold" : ""}>7.5s 録音・WPM</span>
              <span className={isScene4 ? "text-emerald-400 font-bold" : ""}>12s TOEIC採点</span>
              <span className={isScene5 ? "text-blue-400 font-bold" : ""}>15.5s CTA</span>
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
