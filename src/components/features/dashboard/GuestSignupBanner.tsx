"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Gift, ArrowRight, Sparkles } from "lucide-react";
import { getTicketStatus, TicketStatus } from "@/lib/storage/ticket-store";

export function GuestSignupBanner() {
  const [ticketStatus, setTicketStatus] = useState<TicketStatus | null>(null);

  useEffect(() => {
    setTicketStatus(getTicketStatus());

    const handleUpdate = () => {
      setTicketStatus(getTicketStatus());
    };
    window.addEventListener("shadowlog:ticket-update", handleUpdate);
    return () => {
      window.removeEventListener("shadowlog:ticket-update", handleUpdate);
    };
  }, []);

  // 会員登録済みのユーザーには表示しない（ゲストのみ）
  if (!ticketStatus || ticketStatus.isRegistered) {
    return null;
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-4 sm:p-5 text-white shadow-md animate-in fade-in-50 duration-300">
      {/* Background glow decoration */}
      <div className="absolute -right-8 -top-8 w-36 h-36 bg-white/10 rounded-full blur-xl pointer-events-none" />

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-bold backdrop-blur-xs">
            <Gift className="w-3.5 h-3.5 text-amber-300" />
            <span>無料会員登録特典</span>
          </div>
          <h3 className="text-sm sm:text-base font-bold text-white leading-snug">
            無料アカウント作成で、<span className="text-amber-300 underline decoration-amber-300/60 underline-offset-2">追加15回チケット ＆ Pro体験2回</span> をプレゼント！
          </h3>
          <p className="text-xs text-blue-100 leading-relaxed">
            Googleで1秒登録。学習カルテ・つまずき単語帳がクラウドに自動保存され、スマホや別端末でも続きから練習できます。
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          <Link
            href="/login?mode=signup"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white text-indigo-700 font-bold text-xs sm:text-sm hover:bg-white/95 active:scale-95 transition shadow-sm min-h-[42px]"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>無料でアカウントを作成</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
