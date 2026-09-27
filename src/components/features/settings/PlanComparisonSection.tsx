"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Check,
  Crown,
  Zap,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { UserPlanType } from "@/types";

interface PlanComparisonSectionProps {
  currentPlan: UserPlanType;
  isRegistered: boolean;
  userEmail: string | null;
}

export function PlanComparisonSection({
  currentPlan,
  isRegistered,
  userEmail,
}: PlanComparisonSectionProps) {
  const [loadingPlan, setLoadingPlan] = useState<"base" | "pro" | null>(null);

  const handleStripeCheckout = async (plan: "base" | "pro") => {
    setLoadingPlan(plan);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          email: userEmail,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || "決済セッションの作成に失敗しました");
      }

      window.location.href = data.url;
    } catch (err: unknown) {
      console.error(err);
      alert(
        err instanceof Error
          ? err.message
          : "Stripe決済の起動に失敗しました。時間をおいてお試しください。"
      );
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="bg-card rounded-2xl p-5 sm:p-8 border border-border/80 shadow-xs space-y-6">
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-foreground font-bold text-base sm:text-lg">
          <Crown className="w-5 h-5 text-amber-500" />
          <span>料金プラン・コース案内</span>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          あなたの学習スタイルや目標に合わせて選べる3つのプランをご用意しています。いつでもプランの変更・解約が可能です。
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 items-stretch">
        {/* 1. Free Plan */}
        <div className="rounded-2xl border border-border bg-background p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="space-y-1">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                体験・フリー
              </span>
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
            </ul>
          </div>

          <div className="pt-3">
            {!isRegistered ? (
              <Link
                href="/login?mode=signup"
                className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-primary/30 bg-primary/10 text-primary font-bold text-xs hover:bg-primary/20 transition min-h-[40px]"
              >
                <span>無料アカウント作成</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : currentPlan === "free" || currentPlan === "guest" ? (
              <div className="w-full text-center py-2 text-xs font-semibold text-muted-foreground bg-muted/60 rounded-xl">
                現在のプラン
              </div>
            ) : null}
          </div>
        </div>

        {/* 2. Base Plan */}
        <div className="rounded-2xl border border-border bg-background p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="space-y-1">
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                毎日の習慣化
              </span>
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
                <span><strong>短文シャドーイング無制限</strong>（使い放題）</span>
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
                <span>広告なし・ストレスフリーな学習環境</span>
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
                type="button"
                onClick={() => handleStripeCheckout("base")}
                disabled={loadingPlan !== null}
                className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-bold text-xs transition min-h-[40px] disabled:opacity-50"
              >
                {loadingPlan === "base" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <span>ベーシックに登録</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* 3. Pro Plan (Featured) */}
        <div className="rounded-2xl border-2 border-primary bg-primary/5 p-5 flex flex-col justify-between space-y-4 relative shadow-sm">
          <div className="absolute -top-3 right-4 bg-primary text-primary-foreground text-[10px] font-extrabold px-3 py-0.5 rounded-full shadow-xs">
            ★ おすすめ / 完全無制限
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <span className="text-xs font-bold text-primary uppercase tracking-wider">
                本気で英語をモノにする
              </span>
              <h3 className="text-lg font-bold text-foreground flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>Proプラン</span>
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                回数無制限 ＆ 長文総合診断で最速上達を目指す方に。
              </p>
            </div>

            <div className="pt-2 border-t border-primary/20">
              <span className="text-2xl font-extrabold text-foreground">¥1,480</span>
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
                <span>業界別特化英文生成（Tech / ビジネス / 医療など全開放）</span>
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
                type="button"
                onClick={() => handleStripeCheckout("pro")}
                disabled={loadingPlan !== null}
                className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 active:scale-95 transition shadow-sm min-h-[40px] disabled:opacity-50"
              >
                {loadingPlan === "pro" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    <span>Proプランに申し込む</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
