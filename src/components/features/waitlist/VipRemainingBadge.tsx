"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Crown, Flame, Sparkles, ArrowRight, Award } from "lucide-react";

interface VipRemainingBadgeProps {
  variant?: "compact" | "card";
  showDiagnosisBanner?: boolean;
}

interface StoredDiagnosisSummary {
  estimatedToeicScore?: number;
  effectiveWPM?: number;
  recommendedLevel?: string;
}

export function VipRemainingBadge({
  variant = "compact",
  showDiagnosisBanner = false,
}: VipRemainingBadgeProps) {
  const [vipLimit, setVipLimit] = useState<number>(20);
  const [vipRemaining, setVipRemaining] = useState<number | null>(null);
  const [diagnosisData, setDiagnosisData] =
    useState<StoredDiagnosisSummary | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchVipStatus() {
      try {
        const res = await fetch("/api/waitlist");
        if (res.ok) {
          const data = await res.json();
          if (mounted) {
            setVipLimit(typeof data.vipLimit === "number" ? data.vipLimit : 20);
            setVipRemaining(
              typeof data.vipRemaining === "number" ? data.vipRemaining : 14
            );
          }
        }
      } catch {
        if (mounted) {
          setVipRemaining(14);
        }
      }
    }

    fetchVipStatus();

    if (showDiagnosisBanner && typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("shadowlog_assessment_result");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed.estimatedToeicScore === "number") {
            setDiagnosisData({
              estimatedToeicScore: parsed.estimatedToeicScore,
              effectiveWPM: parsed.effectiveWPM,
              recommendedLevel: parsed.recommendedLevel,
            });
          }
        }
      } catch {
        // ignore
      }
    }

    return () => {
      mounted = false;
    };
  }, [showDiagnosisBanner]);

  const displayRemaining = vipRemaining ?? 14;
  const filledCount = Math.max(0, vipLimit - displayRemaining);
  const progressPct = Math.min(100, Math.round((filledCount / vipLimit) * 100));

  if (variant === "compact") {
    return (
      <div className="inline-flex flex-wrap items-center justify-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30 shadow-sm">
        <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
        <span>
          先着{vipLimit}名限定 VIPモニター枠（Pro無制限）：
          <strong className="text-rose-600 dark:text-rose-400 underline underline-offset-2 ml-1">
            残り {displayRemaining} 名
          </strong>
        </span>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-3">
      {/* Personalized Diagnosis Handoff Banner (if user came from /diagnosis) */}
      {showDiagnosisBanner && diagnosisData?.estimatedToeicScore && (
        <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-left flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 font-black">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-indigo-600 dark:text-indigo-300">
                診断結果引き継ぎ中：推定TOEIC {diagnosisData.estimatedToeicScore}点（実効 {diagnosisData.effectiveWPM ?? 110} WPM）
              </div>
              <p className="text-[11px] text-muted-foreground">
                あなたの診断カルテと弱点データを保存して、専用レベル（{diagnosisData.recommendedLevel}）からすぐ練習できます！
              </p>
            </div>
          </div>
        </div>
      )}

      {/* VIP 20-User Cap Status Card */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-indigo-500/10 border border-amber-500/30 shadow-sm space-y-3 text-left">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-rose-500 text-white uppercase">
              <Flame className="w-3 h-3" /> 先着{vipLimit}名限定
            </span>
            <span className="text-xs sm:text-sm font-extrabold text-foreground">
              初期VIPユーザー枠（Proプラン無料開放）
            </span>
          </div>
          <div className="text-xs sm:text-sm font-black text-rose-600 dark:text-rose-400">
            残り <span className="text-lg sm:text-xl">{displayRemaining}</span> / {vipLimit} 名
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-rose-500 transition-all duration-500"
            style={{ width: `${Math.max(15, progressPct)}%` }}
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
          <p className="text-[11px] text-muted-foreground">
            ※ VIP登録者は10/30まで月額1,480円の全Pro機能（短文・長文・AIコーチ）が無制限0円で使い放題になります。
          </p>
          <Link
            href="/signup?vip=1"
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shrink-0 transition shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>今すぐVIP枠で始める</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
