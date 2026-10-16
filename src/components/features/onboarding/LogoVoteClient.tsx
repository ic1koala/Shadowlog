"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Heart,
  Maximize2,
  X,
  ExternalLink,
  Trophy,
  RefreshCw,
  Info,
} from "lucide-react";
import {
  LogoAnimationPlayer,
  LogoAnimationPattern,
  LOGO_ANIMATION_PATTERNS,
} from "@/components/features/onboarding/LogoAnimationPlayer";

interface CandidateLikeStatus {
  id: string;
  index: number;
  postId: string;
  permalink: string;
  likes: number;
  views: number;
}

const CANDIDATE_PERMALINKS: Record<string, string> = {
  sparkle_wave: "https://www.threads.com/@shadowlog_official/post/DejfvQXD0Y5",
  particle_converge: "https://www.threads.com/@shadowlog_official/post/DejfxOCDzs8",
  blur_focus: "https://www.threads.com/@shadowlog_official/post/Dejfy_wj2aX",
  blueprint_trace: "https://www.threads.com/@shadowlog_official/post/Dejf0wxj8H2",
  dimensional_rise: "https://www.threads.com/@shadowlog_official/post/Dejf2mjj2F5",
};

export function LogoVoteClient() {
  const [fullScreenPattern, setFullScreenPattern] = useState<LogoAnimationPattern | null>(null);
  const [likesData, setLikesData] = useState<Record<string, { likes: number; views: number }>>({});
  const [loadingLikes, setLoadingLikes] = useState(false);

  const fetchLikes = async () => {
    try {
      setLoadingLikes(true);
      const res = await fetch("/api/threads/logo-vote-likes");
      const data = await res.json();
      if (data.ok && Array.isArray(data.candidates)) {
        const map: Record<string, { likes: number; views: number }> = {};
        data.candidates.forEach((c: CandidateLikeStatus) => {
          map[c.id] = { likes: c.likes, views: c.views };
        });
        setLikesData(map);
      }
    } catch {
      // Graceful fallback
    } finally {
      setLoadingLikes(false);
    }
  };

  useEffect(() => {
    fetchLikes();
    const interval = setInterval(fetchLikes, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-10">
      {/* Hero Intro */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span>技術相談役制作・公式オープニング決定投票</span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
          どのオープニングが好きですか？<br />
          <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent">
            あなたの1票で正式版の演出が決まります！
          </span>
        </h1>

        <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl mx-auto">
          技術相談役が「何もない無（暗闇）からロゴが出現する」5つのオープニングアニメーションを作成してくれました。
          アプリ起動画面に採用する演出を、Threadsの「いいね」投票で決定します！
        </p>

        {/* Essential Explanation: How voting works */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-pink-500/40 text-left space-y-3 max-w-2xl mx-auto shadow-xl">
          <div className="flex items-center gap-2 text-pink-300 font-bold text-sm sm:text-base">
            <Info className="w-4 h-4 text-pink-400 shrink-0" />
            <span>Threads「いいね」投票のやり方</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Threadsのセキュリティ仕様上、外部WebサイトからThreadsアカウントを自動操作することはできません。
            各候補の下にある<strong className="text-pink-300 font-bold">「❤️ Threadsでこの候補に投票する」</strong>ボタンを押すと該当の返信ポストが直接開きますので、そこで<strong className="text-pink-300 font-bold">ハート（いいね）</strong>を押して投票をお願いします！
          </p>
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800">
            <span>集計されたいいね数はこのページにも定期反映されます</span>
            <button
              type="button"
              onClick={fetchLikes}
              disabled={loadingLikes}
              className="inline-flex items-center gap-1 text-slate-300 hover:text-white transition cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${loadingLikes ? "animate-spin" : ""}`} />
              <span>最新の得票数を更新</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5 Animation Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {LOGO_ANIMATION_PATTERNS.map((pattern, index) => {
          const stats = likesData[pattern.id] || { likes: 0, views: 0 };
          const threadUrl =
            CANDIDATE_PERMALINKS[pattern.id] ||
            "https://www.threads.com/@shadowlog_official/post/DejftLwj1rL";

          return (
            <div
              key={pattern.id}
              className="rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all duration-300 flex flex-col overflow-hidden shadow-xl"
            >
              {/* Animation Header Tag */}
              <div className="px-4 py-3 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/60">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-blue-600 text-white font-black text-xs flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span className="text-xs font-bold text-slate-300 truncate">
                    候補{index + 1}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-pink-500/15 border border-pink-500/30 text-pink-300 text-[11px] font-bold">
                    <Heart className="w-3 h-3 fill-pink-400 text-pink-400" />
                    <span>{stats.likes} いいね</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setFullScreenPattern(pattern.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                    title="全画面で確認"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Player Stage */}
              <div className="p-3 bg-[#060911]">
                <LogoAnimationPlayer
                  pattern={pattern.id}
                  autoPlay={true}
                  showControls={true}
                />
              </div>

              {/* Description & Action */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <h3 className="font-bold text-base text-white">
                    {pattern.nameJa}
                  </h3>
                  <p className="text-xs text-blue-400 font-medium">
                    {pattern.name} ({pattern.durationSec}秒)
                  </p>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {pattern.description}
                  </p>
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-800/70">
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <Trophy className="w-3 h-3 text-amber-400 shrink-0" />
                    <span>{pattern.recommendedFor}</span>
                  </div>

                  {/* Direct Link Button to Vote on Threads */}
                  <a
                    href={threadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-pink-600/25 cursor-pointer active:scale-[0.98]"
                  >
                    <Heart className="w-4 h-4 fill-white text-white" />
                    <span>Threadsでこの候補に投票する</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Full Screen Modal */}
      {fullScreenPattern && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 animate-in fade-in duration-200">
          <button
            type="button"
            onClick={() => setFullScreenPattern(null)}
            className="absolute top-6 right-6 p-3 rounded-full bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700 transition cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="w-full max-w-4xl aspect-video rounded-3xl overflow-hidden border border-slate-800 shadow-2xl">
            <LogoAnimationPlayer
              pattern={fullScreenPattern}
              autoPlay={true}
              showControls={true}
              fullScreenMode={true}
            />
          </div>
        </div>
      )}
    </div>
  );
}
