"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Sparkles, Check, Zap, Shield, ArrowRight, X } from "lucide-react";
import { TicketStatus } from "@/lib/storage/ticket-store";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketStatus: TicketStatus;
  userEmail?: string | null;
}

export function UpgradeModal({
  isOpen,
  onClose,
  ticketStatus,
  userEmail,
}: UpgradeModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<"base" | "pro">("pro");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
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

  const handleCheckout = async (plan: "base" | "pro") => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, email: userEmail }),
      });

      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || "決済セッションの作成に失敗しました");
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "決済エラーが発生しました";
      setErrorMessage(msg);
      setIsLoading(false);
    }
  };

  const isGuest = !ticketStatus.isRegistered;

  const modalContent = (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 max-h-[90vh] sm:max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95"
      >
        {/* Sticky Header with Title & Close Button */}
        <div className="shrink-0 flex items-center justify-between px-5 py-3 sm:px-6 sm:py-3.5 bg-slate-50/80 backdrop-blur-xs border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold text-slate-800">プランの選択・アップグレード</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-200/60 transition min-h-[36px] min-w-[36px] flex items-center justify-center"
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
          <div className="text-center max-w-md mx-auto space-y-2 mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              ShadowLog プレミアムプラン
            </div>
            <h2 className="text-2xl font-bold text-slate-900">
              シャドーイングで英語脳を覚醒させよう
            </h2>
            <p className="text-xs text-slate-500">
              シャドテンの1/15の価格で、AIによるリアルタイム即時添削 ＆ WPM話速測定を無制限に。
            </p>
          </div>

          {/* Guest Upsell to Free Registration */}
          {isGuest && (
            <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-left">
                <div className="text-xs font-bold text-amber-900">
                  🎁 無料会員登録で「さらに15回分」プレゼント！
                </div>
                <div className="text-[11px] text-amber-700 mt-0.5">
                  学習カルテの保存とストリーク機能、Pro長文モード2回お試しも解放されます。
                </div>
              </div>
              <a
                href="/login"
                className="shrink-0 text-xs font-bold px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white shadow-sm transition"
              >
                無料登録する
              </a>
            </div>
          )}

          {/* Plans Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {/* Base Plan */}
            <div
              onClick={() => setSelectedPlan("base")}
              className={`p-5 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between ${
                selectedPlan === "base"
                  ? "border-indigo-600 bg-indigo-50/30 shadow-md"
                  : "border-slate-200 hover:border-slate-300 bg-white"
              }`}
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    ライト習慣化
                  </span>
                  <div className="text-right">
                    <span className="text-2xl font-extrabold text-slate-900">¥500</span>
                    <span className="text-xs text-slate-500"> /月</span>
                  </div>
                </div>
                <h3 className="font-bold text-slate-900 text-base mb-1">ベースプラン</h3>
                <p className="text-xs text-slate-500 mb-4">毎日の短文シャドーイングを習慣化したい方に</p>

                <ul className="space-y-2 text-xs text-slate-600">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span><strong>1日 30回</strong>まで短文シャドーイング</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    Whisper即時Diff添削 ＆ WPM測定
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    つまずき単語帳 ＆ 個人カルテ無制限
                  </li>
                </ul>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCheckout("base");
                }}
                disabled={isLoading}
                className="mt-6 w-full py-2.5 px-4 text-xs font-bold rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 transition"
              >
                ベースプランを選ぶ
              </button>
            </div>

            {/* Pro Plan */}
            <div
              onClick={() => setSelectedPlan("pro")}
              className={`p-5 rounded-2xl border-2 transition cursor-pointer relative flex flex-col justify-between ${
                selectedPlan === "pro"
                  ? "border-indigo-600 bg-indigo-50/40 shadow-lg ring-2 ring-indigo-600/20"
                  : "border-slate-200 hover:border-slate-300 bg-white"
              }`}
            >
              <div className="absolute -top-3 right-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-[10px] font-bold px-3 py-0.5 rounded-full shadow-sm">
                一番人気 / おすすめ
              </div>

              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                    完全無制限
                  </span>
                  <div className="text-right">
                    <span className="text-2xl font-extrabold text-indigo-600">¥1,480</span>
                    <span className="text-xs text-slate-500"> /月</span>
                  </div>
                </div>
                <h3 className="font-bold text-slate-900 text-base mb-1">Proプラン</h3>
                <p className="text-xs text-slate-500 mb-4">ビジネス実務・長文プレゼン通し練習に特化</p>

                <ul className="space-y-2 text-xs text-slate-700 font-medium">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span>👑 <strong>長文スピーチモード（60〜90語）</strong></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    業界別英文（IT/医療/金融/法務）即時生成
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    練習回数 <strong>完全無制限</strong>（毎日何回でもOK）
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    エグゼクティブ話速・息継ぎAI指導
                  </li>
                </ul>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCheckout("pro");
                }}
                disabled={isLoading}
                className="mt-6 w-full py-2.5 px-4 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 transition flex items-center justify-center gap-1.5"
              >
                {isLoading ? "決済画面へ接続中..." : (
                  <>
                    Proプランで始める
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-600 text-center">
              {errorMessage}
            </div>
          )}

          {/* Footer Security Badges */}
          <div className="flex flex-col items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <div className="flex items-center justify-center gap-4">
              <span className="flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-emerald-500" />
                Stripe安全暗号化決済
              </span>
              <span>•</span>
              <span>いつでもマイページから1クリック解約可能</span>
            </div>
            <div className="text-[10px] text-slate-400 pt-0.5">
              お申し込み前に
              <Link href="/terms" target="_blank" className="text-indigo-600 underline mx-1 hover:text-indigo-800">
                利用規約・解約規定
              </Link>
              および
              <Link href="/tokushoho" target="_blank" className="text-indigo-600 underline mx-1 hover:text-indigo-800">
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
