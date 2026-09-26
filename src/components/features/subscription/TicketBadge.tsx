"use client";

import { useEffect, useState } from "react";
import { Sparkles, Zap, Ticket } from "lucide-react";
import { getTicketStatus, TicketStatus, getCurrentUserEmail } from "@/lib/storage/ticket-store";
import { UpgradeModal } from "./UpgradeModal";

export function TicketBadge() {
  const [status, setStatus] = useState<TicketStatus | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const refreshStatus = () => {
    const s = getTicketStatus();
    setStatus(s);
    setUserEmail(getCurrentUserEmail());
  };

  useEffect(() => {
    refreshStatus();

    // Listen for custom ticket change events
    const handleUpdate = () => refreshStatus();
    window.addEventListener("shadowlog:ticket-update", handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener("shadowlog:ticket-update", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  if (!status) return null;

  return (
    <>
      <div className="flex items-center gap-2">
        {/* VIP / Pro Unlimited Badge */}
        {status.isVip || status.plan === "pro" ? (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/70 dark:bg-slate-800/70 backdrop-blur-md text-indigo-900 dark:text-indigo-100 border border-indigo-200/80 dark:border-indigo-700/60 text-xs font-bold shadow-xs">
            <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>{status.isVip ? "👑 VIP Tester (無制限)" : "👑 Pro (無制限)"}</span>
          </div>
        ) : status.plan === "base" ? (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/70 dark:bg-slate-800/70 backdrop-blur-md text-indigo-900 dark:text-indigo-100 border border-indigo-200/80 text-xs font-semibold shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>ベースプラン (1日30回)</span>
          </div>
        ) : (
          /* Free or Guest Ticket Badge */
          <div className="flex items-center gap-1.5">
            {/* Short Mode Tickets */}
            <button
              onClick={() => setIsModalOpen(true)}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold backdrop-blur-xs transition hover:scale-105 ${
                status.availableTickets <= 1
                  ? "bg-rose-50/80 text-rose-700 border-rose-200/80 animate-pulse"
                  : "bg-white/70 dark:bg-slate-800/70 text-slate-700 dark:text-slate-200 border-slate-200/80 hover:bg-white/90 shadow-2xs"
              }`}
            >
              <Ticket className="w-3.5 h-3.5 text-indigo-600" />
              <span>
                残り {status.availableTickets}/{status.totalTickets} 回
              </span>
            </button>

            {/* Pro Trial Badge if registered */}
            {status.isRegistered && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/70 dark:bg-slate-800/70 backdrop-blur-xs text-indigo-700 dark:text-indigo-200 border border-indigo-200/80 text-xs font-medium hover:bg-white/90 transition shadow-2xs"
              >
                <Zap className="w-3 h-3 text-amber-500" />
                <span>Pro体験: {status.availableProTrials}/2</span>
              </button>
            )}

            {/* Upgrade Button */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-2.5 py-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 transition"
            >
              アップグレード
            </button>
          </div>
        )}
      </div>

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        ticketStatus={status}
        userEmail={userEmail}
      />
    </>
  );
}
