"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, X, Crown, Target } from "lucide-react";
import { getTicketStatus } from "@/lib/storage/ticket-store";
import { isPersonaEligible, getPersonaProfile } from "@/lib/storage/persona-store";

export function PersonaPromptBanner() {
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    const checkEligibility = () => {
      const ticket = getTicketStatus();
      const eligible = isPersonaEligible(ticket.plan);
      if (!eligible) {
        setShouldShow(false);
        return;
      }

      // Check if user has already set up persona
      const profile = getPersonaProfile();
      const hasPersona = Boolean(
        profile &&
        profile.enabled !== false &&
        (profile.jobRole?.trim() || profile.industryField?.trim() || profile.targetScenario?.trim())
      );

      if (hasPersona) {
        setShouldShow(false);
        return;
      }

      // Check if dismissed in this session
      const dismissed = sessionStorage.getItem("shadowlog_persona_banner_dismissed");
      if (dismissed === "true") {
        setShouldShow(false);
        return;
      }

      setShouldShow(true);
    };

    checkEligibility();

    window.addEventListener("shadowlog:persona-update", checkEligibility);
    window.addEventListener("shadowlog:ticket-update", checkEligibility);

    return () => {
      window.removeEventListener("shadowlog:persona-update", checkEligibility);
      window.removeEventListener("shadowlog:ticket-update", checkEligibility);
    };
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem("shadowlog_persona_banner_dismissed", "true");
    setShouldShow(false);
  };

  if (!shouldShow) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-indigo-950/50 border border-indigo-500/40 p-4 sm:p-5 shadow-lg shadow-indigo-950/30 animate-in fade-in duration-300">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0 mt-0.5">
            <Crown className="w-5 h-5 text-amber-400 fill-amber-400" />
          </div>
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs sm:text-sm font-bold text-white">
                👑 VIP特典：あなたの職種・業界に特化した英語をAI生成！
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                新機能
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              海外営業・エンジニア・PdM・経営企画など、ご自身の専門領域や実務シチュエーションを登録すると、明日の仕事でそのまま使える実践英語が出題されます。
            </p>
            <div className="pt-2">
              <Link
                href="/settings?section=persona"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-600/20 cursor-pointer active:scale-95"
              >
                <Target className="w-3.5 h-3.5" />
                <span>ペルソナを設定する（1分で完了）</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition shrink-0 cursor-pointer"
          title="閉じる"
          aria-label="バナーを閉じる"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
