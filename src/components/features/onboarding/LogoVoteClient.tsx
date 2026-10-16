"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Heart,
  Maximize2,
  X,
  ExternalLink,
  CheckCircle2,
  Trophy,
} from "lucide-react";
import {
  LogoAnimationPlayer,
  LogoAnimationPattern,
  LOGO_ANIMATION_PATTERNS,
} from "@/components/features/onboarding/LogoAnimationPlayer";

export function LogoVoteClient() {
  const [fullScreenPattern, setFullScreenPattern] = useState<LogoAnimationPattern | null>(null);
  const [userVotedPattern, setUserVotedPattern] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("shadowlog_logo_voted_pattern");
      if (stored) {
        setUserVotedPattern(stored);
      }
    } catch {}
  }, []);

  const handleVote = (id: string) => {
    try {
      localStorage.setItem("shadowlog_logo_voted_pattern", id);
      setUserVotedPattern(id);
    } catch {}
  };

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
          アプリ起動画面に採用するお気に入りの演出を、ぜひ投票で教えてください！
        </p>

        {/* Threads Callout Box */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-pink-950/40 via-purple-950/30 to-slate-900 border border-pink-500/30 text-center space-y-2 max-w-xl mx-auto shadow-lg">
          <div className="flex items-center justify-center gap-2 text-pink-300 font-bold text-sm">
            <Heart className="w-4 h-4 text-pink-400 fill-pink-400" />
            <span>Threads連動「いいね」投票を実施中！</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Threadsのツリー（返信）にお気に入りの番号が並んでいます。お好きな候補の返信に【いいね❤️】を押すと公式投票として集計されます！
          </p>
          <div className="pt-1">
            <a
              href="https://www.threads.com/@shadowlog_official"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs transition shadow-md shadow-pink-500/20"
            >
              <span>Threadsの投票スレッドを開く</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* 5 Animation Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {LOGO_ANIMATION_PATTERNS.map((pattern, index) => {
          const isVoted = userVotedPattern === pattern.id;
          return (
            <div
              key={pattern.id}
              className={`rounded-2xl bg-slate-900/80 border transition-all duration-300 flex flex-col overflow-hidden shadow-xl ${
                isVoted
                  ? "border-pink-500 ring-2 ring-pink-500/30 shadow-pink-500/10"
                  : "border-slate-800 hover:border-slate-700"
              }`}
            >
              {/* Animation Header Tag */}
              <div className="px-4 py-3 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/50">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-blue-600 text-white font-black text-xs flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span className="text-xs font-bold text-slate-300 truncate">
                    候補{index + 1}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-mono">
                    {pattern.durationSec}s
                  </span>
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
                    {pattern.name}
                  </p>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {pattern.description}
                  </p>
                </div>

                <div className="space-y-2.5 pt-2 border-t border-slate-800/60">
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <Trophy className="w-3 h-3 text-amber-400 shrink-0" />
                    <span>おすすめ: {pattern.recommendedFor}</span>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleVote(pattern.id)}
                      className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                        isVoted
                          ? "bg-pink-600 text-white shadow-md shadow-pink-500/20"
                          : "bg-slate-800 hover:bg-slate-700 text-slate-200"
                      }`}
                    >
                      <Heart
                        className={`w-3.5 h-3.5 ${
                          isVoted ? "fill-white text-white" : "text-pink-400"
                        }`}
                      />
                      <span>{isVoted ? "Web投票済み！" : "Webで1票投票"}</span>
                    </button>

                    <a
                      href="https://www.threads.com/@shadowlog_official"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2.5 px-3 rounded-xl bg-pink-500/15 hover:bg-pink-500/25 text-pink-300 border border-pink-500/30 text-xs font-bold transition flex items-center gap-1"
                      title="Threadsでいいね投票"
                    >
                      <span>Threads投票</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
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
            className="absolute top-6 right-6 p-3 rounded-full bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700 transition"
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
