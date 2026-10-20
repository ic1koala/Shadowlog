"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Check,
  Crown,
  ArrowRight,
  Shield,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { UserPlanType } from "@/types";

interface PlanComparisonSectionProps {
  currentPlan: UserPlanType;
  isRegistered: boolean;
  userEmail?: string | null;
}

export function PlanComparisonSection({
  currentPlan,
  isRegistered,
  userEmail,
}: PlanComparisonSectionProps) {
  const [loadingPlan, setLoadingPlan] = useState<"base" | "pro" | "portal" | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleCheckout = async (plan: "base" | "pro") => {
    setErrorMessage(null);
    if (!isRegistered) {
      window.location.href = `/login?mode=signup&redirect=/settings`;
      return;
    }

    setLoadingPlan(plan);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, email: userEmail }),
      });

      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || "決済ページの生成に失敗しました。時間をおいて再試行してください。");
      }

      window.location.href = data.url;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "決済処理の開始に失敗しました";
      setErrorMessage(msg);
      setLoadingPlan(null);
    }
  };

  const handleOpenCustomerPortal = async () => {
    setErrorMessage(null);
    setLoadingPlan("portal");
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || "カスタマーポータルの呼び出しに失敗しました。");
      }

      window.location.href = data.url;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "ポータルへの遷移に失敗しました";
      setErrorMessage(msg);
      setLoadingPlan(null);
    }
  };

  const isPaidPlan = currentPlan === "base" || currentPlan === "pro";

  return (
    <div className="bg-card rounded-2xl p-5 sm:p-8 border border-border/80 shadow-xs space-y-6">
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-foreground font-bold text-base sm:text-lg">
          <Crown className="w-5 h-5 text-amber-500" />
          <span>料金プラン・コース案内</span>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          あなたの学習スタイルや目標に合わせて選べるプランをご用意しています。いつでも解約可能です。
        </p>
      </div>

      {/* Stripe Customer Portal Link for Subscribed Users */}
      {isPaidPlan && (
        <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="text-xs font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>サブスクリプション契約中（{currentPlan === "pro" ? "Proプラン" : "ベースプラン"}）</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              クレジットカード情報の変更、次回請求日の確認、解約手続きはStripeポータルから安全に行えます。
            </p>
          </div>
          <button
            onClick={handleOpenCustomerPortal}
            disabled={loadingPlan === "portal"}
            className="shrink-0 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-card hover:bg-muted text-foreground border border-border font-bold text-xs transition shadow-xs disabled:opacity-50 min-h-[36px]"
          >
            {loadingPlan === "portal" ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>ポータルへ移動中...</span>
              </>
            ) : (
              <>
                <span>解約・カード情報変更</span>
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
              </>
            )}
          </button>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 text-center">
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 items-stretch">
        {/* 1. Free Plan */}
        <div className="rounded-2xl border-2 border-emerald-500/40 bg-emerald-500/5 p-5 flex flex-col justify-between space-y-4 relative">
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  まずは無料体験
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  いつでも受付中
                </span>
              </div>
              <h3 className="text-lg font-bold text-foreground">無料会員</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                まずは手軽にシャドーイングの習慣を始めたい方に。
              </p>
            </div>

            <div className="pt-2 border-t border-border/60">
              <span className="text-2xl font-extrabold text-foreground">¥0</span>
              <span className="text-xs text-muted-foreground ml-1">/ 永年無料</span>
            </div>

            <ul className="space-y-2 text-xs text-muted-foreground pt-1">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>累計20回（ゲスト5+登録15）の短文練習</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>AI音声認識 ＆ リアルタイムDiff採点</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>学習カルテ・苦手単語帳のクラウド自動同期</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>長文Proモード体験チケット（2回分）</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>カスタムマイ単語生成（累計2回）</span>
              </li>
            </ul>
          </div>

          <div className="pt-3">
            {!isRegistered ? (
              <Link
                href="/login?mode=signup"
                className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500 text-white font-bold text-xs hover:bg-emerald-600 transition min-h-[40px] shadow-xs"
              >
                <span>無料アカウント作成</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : currentPlan === "free" || currentPlan === "guest" ? (
              <div className="w-full text-center py-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                ✓ 現在ご利用中
              </div>
            ) : null}
          </div>
        </div>

        {/* 2. Base Plan */}
        <div className={`rounded-2xl border p-5 flex flex-col justify-between space-y-4 ${
          currentPlan === "base" ? "border-indigo-600 bg-indigo-500/5 shadow-md" : "border-border bg-background"
        }`}>
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  毎日の習慣化
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
                  人気プラン
                </span>
              </div>
              <h3 className="text-lg font-bold text-foreground">ベーシックプラン</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                1日1問〜数問、毎日コツコツ発話を継続したい方に。
              </p>
            </div>

            <div className="pt-2 border-t border-border/60">
              <span className="text-2xl font-extrabold text-foreground">¥500</span>
              <span className="text-xs text-muted-foreground ml-1">/ 月 (税込)</span>
            </div>

            <ul className="space-y-2 text-xs text-muted-foreground pt-1">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <span><strong>短文シャドーイング完全無制限</strong>（使い放題）</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <span>苦手単語の自動抽出 ＆ パーソナライズ復習</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <span>学習アクティビティ・WPMトレンド永続保存</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <span>パーソナライズ英語ペルソナ設定</span>
              </li>
            </ul>
          </div>

          <div className="pt-3">
            {currentPlan === "base" ? (
              <div className="w-full text-center py-2 text-xs font-semibold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 rounded-xl">
                ✓ 現在ご利用中
              </div>
            ) : (
              <button
                onClick={() => handleCheckout("base")}
                disabled={loadingPlan !== null}
                className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition min-h-[40px] disabled:opacity-50"
              >
                {loadingPlan === "base" ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>決済ページへ移動中...</span>
                  </>
                ) : (
                  <>
                    <span>ベースプランを始める (¥500/月)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* 3. Pro Plan (Featured) */}
        <div className={`rounded-2xl border-2 p-5 flex flex-col justify-between space-y-4 relative shadow-sm ${
          currentPlan === "pro" ? "border-indigo-600 bg-indigo-500/10" : "border-primary/50 bg-primary/5"
        }`}>
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-primary uppercase tracking-wider">
                  本気で英語をモノにする
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                  人気No.1
                </span>
              </div>
              <h3 className="text-lg font-bold text-foreground flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>Proプラン</span>
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                回数無制限 ＆ 長文総合診断で最速上達を目指す方に。
              </p>
            </div>

            <div className="pt-2 border-t border-primary/20">
              <span className="text-2xl font-extrabold text-foreground">¥1,000</span>
              <span className="text-xs text-muted-foreground ml-1">/ 月 (税込)</span>
            </div>

            <ul className="space-y-2 text-xs text-foreground pt-1 font-medium">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span><strong>完全無制限</strong>（毎日何回でもシャドーイング）</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span><strong>長文スピーチ演習</strong>（60〜90語・息継ぎ指導）</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>AI英語発音コーチによる音声変化・リンキング詳細解説</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>業界別特化英文生成（Tech / ビジネス / マーケ / 日常）</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>パーソナライズ英語ペルソナ設定</span>
              </li>
            </ul>
          </div>

          <div className="pt-3">
            {currentPlan === "pro" ? (
              <div className="w-full text-center py-2 text-xs font-bold text-primary bg-primary/10 border border-primary/30 rounded-xl">
                👑 現在ご利用中（完全無制限）
              </div>
            ) : (
              <button
                onClick={() => handleCheckout("pro")}
                disabled={loadingPlan !== null}
                className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-xs shadow-md transition min-h-[40px] disabled:opacity-50"
              >
                {loadingPlan === "pro" ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>決済ページへ移動中...</span>
                  </>
                ) : (
                  <>
                    <span>Proプランを始める (¥1,000/月)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="text-center pt-2 text-[11px] text-muted-foreground flex flex-wrap items-center justify-center gap-3">
        <span>🔒 Stripe 256bit SSL暗号化決済</span>
        <span>•</span>
        <Link href="/tokushoho" className="underline hover:text-foreground">特定商取引法に基づく表記</Link>
        <span>•</span>
        <Link href="/terms" className="underline hover:text-foreground">利用規約</Link>
      </div>
    </div>
  );
}
