"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Sparkles, Check, Zap, Shield, X } from "lucide-react";
import { getTicketStatus, TicketStatus } from "@/lib/storage/ticket-store";
import { BrandLogo } from "@/components/ui/BrandLogo";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketStatus?: TicketStatus;
  userEmail?: string | null;
}

export function UpgradeModal({
  isOpen,
  onClose,
  ticketStatus,
}: UpgradeModalProps) {
  const [errorMessage] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const resolvedTicketStatus = ticketStatus ?? getTicketStatus();
  const isGuest = !resolvedTicketStatus.isRegistered;

  const modalContent = (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-card text-foreground rounded-2xl sm:rounded-3xl shadow-2xl border border-border max-h-[90vh] sm:max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95"
      >
        {/* Sticky Header with Title & Close Button */}
        <div className="shrink-0 flex items-center justify-between px-5 py-3 sm:px-6 sm:py-3.5 bg-muted/40 backdrop-blur-xs border-b border-border">
          <div className="flex items-center gap-2">
            <BrandLogo variant="icon" size="sm" />
            <span className="text-xs font-bold text-foreground">プランの選択・アップグレード</span>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1.5 rounded-full hover:bg-muted transition min-h-[36px] min-w-[36px] flex items-center justify-center"
            aria-label="閉じる"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div
          className="flex-1 overflow-y-auto p-5 sm:p-8 overscroll-contain space-y-6"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {/* Header */}
          <div className="text-center max-w-md mx-auto space-y-2 mb-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              ShadowLog プレミアムプラン
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">
              シャドーイングで英語脳を覚醒させよう
            </h2>
            <p className="text-xs text-muted-foreground">
              他社サービスの1/15の価格で、AIによるリアルタイム即時添削 ＆ WPM話速測定を無制限に。
            </p>
          </div>

          {/* Closed Beta Testing Notice */}
          <div className="mb-4 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-left space-y-1">
            <div className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
              <span>📢</span>
              <span>現在、無料会員ベータ版テストを実施中</span>
            </div>
            <p className="text-[11px] text-amber-900/80 dark:text-amber-200/80 leading-relaxed">
              有料プラン（ベース / Pro）は現在VIPテスター限定で先行公開中（一般受付準備中）です。
              無料会員登録を行うことで、累計20回（ゲスト5回＋登録15回）およびPro長文2回のお試しをご利用いただけます。
            </p>
          </div>

          {/* Guest Upsell to Free Registration */}
          {isGuest && (
            <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-left">
                <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  🎁 無料会員登録で「さらに15回分」チケットプレゼント！
                </div>
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                  学習カルテの保存とストリーク機能、Pro長文モード2回お試し、カスタムマイ単語も解放されます。
                </div>
              </div>
              <a
                href="/login?mode=signup"
                className="shrink-0 text-xs font-bold px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition"
              >
                無料登録して試す
              </a>
            </div>
          )}

          {/* Plans Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {/* Base Plan */}
            <div
              className="p-5 rounded-2xl border border-border bg-card flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-muted/40 text-muted-foreground">
                    🔒 VIP先行公開中
                  </span>
                  <div className="text-right">
                    <span className="text-2xl font-extrabold text-foreground">¥500</span>
                    <span className="text-xs text-muted-foreground"> /月</span>
                  </div>
                </div>
                <h3 className="font-bold text-foreground text-base mb-1">ベースプラン</h3>
                <p className="text-xs text-muted-foreground mb-4">毎日の短文シャドーイングを習慣化したい方に</p>

                <ul className="space-y-2 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span><strong className="text-foreground">短文シャドーイング無制限</strong>（使い放題）</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    Whisper即時Diff添削 ＆ WPM測定
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    つまずき単語帳 ＆ 個人カルテ無制限
                  </li>
                </ul>
              </div>

              <div className="mt-6 w-full py-2.5 px-4 text-xs font-bold text-center rounded-xl bg-muted/40 text-muted-foreground border border-border">
                🔒 VIPテスター限定先行公開中
              </div>
            </div>

            {/* Pro Plan */}
            <div
              className="p-5 rounded-2xl border-2 border-indigo-600/50 bg-indigo-500/5 shadow-md relative flex flex-col justify-between"
            >
              <div className="absolute -top-3 right-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-[10px] font-bold px-3 py-0.5 rounded-full shadow-sm">
                🔒 VIP先行公開中
              </div>

              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                    完全無制限
                  </span>
                  <div className="text-right">
                    <span className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">¥1,000</span>
                    <span className="text-xs text-muted-foreground"> /月</span>
                  </div>
                </div>
                <h3 className="font-bold text-foreground text-base mb-1">Proプラン</h3>
                <p className="text-xs text-muted-foreground mb-4">ビジネス実務・長文プレゼン通し練習に特化</p>

                <ul className="space-y-2 text-xs text-foreground font-medium">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span>👑 <strong>長文スピーチモード（60〜90語）</strong></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    4ジャンル別英文（IT・ビジネス・マーケ・日常）即時生成
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    練習回数 <strong>完全無制限</strong>（毎日何回でもOK）
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    エグゼクティブ話速・息継ぎAI指導
                  </li>
                </ul>
              </div>

              <div className="mt-6 w-full py-2.5 px-4 text-xs font-bold text-center rounded-xl bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/25">
                🔒 VIPテスター限定先行公開中
              </div>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 text-center">
              {errorMessage}
            </div>
          )}

          {/* Footer Security Badges */}
          <div className="flex flex-col items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
            <div className="flex items-center justify-center gap-4">
              <span className="flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-emerald-500" />
                Stripe安全暗号化決済
              </span>
              <span>•</span>
              <span>いつでもマイページから1クリック解約可能</span>
            </div>
            <div className="text-[10px] text-muted-foreground pt-0.5">
              お申し込み前に
              <Link href="/terms" target="_blank" className="text-indigo-600 dark:text-indigo-400 underline mx-1 hover:opacity-80">
                利用規約・解約規定
              </Link>
              および
              <Link href="/tokushoho" target="_blank" className="text-indigo-600 dark:text-indigo-400 underline mx-1 hover:opacity-80">
                特定商取引法に基づく表記
              </Link>
              をご確認ください。
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
