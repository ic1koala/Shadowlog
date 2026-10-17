"use client";

import Link from "next/link";
import {
  Check,
  Crown,
  ArrowRight,
  Sparkles,
  Lock,
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
}: PlanComparisonSectionProps) {
  return (
    <div className="bg-card rounded-2xl p-5 sm:p-8 border border-border/80 shadow-xs space-y-6">
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-foreground font-bold text-base sm:text-lg">
          <Crown className="w-5 h-5 text-amber-500" />
          <span>料金プラン・コース案内</span>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          あなたの学習スタイルや目標に合わせて選べるプランをご用意しています。
        </p>
      </div>

      {/* Beta Notice Banner */}
      <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5">
        <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
          <span className="font-bold">📢 現在、無料会員でのベータ版テストを実施中です。</span>
          <span className="block text-[11px] text-muted-foreground mt-0.5">
            ベースプラン・Proプランは現在VIPテスター限定で先行公開中（一般受付準備中）です。まずは無料会員登録にてチケット制の体験テストにご参加ください。
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 items-stretch">
        {/* 1. Free Plan */}
        <div className="rounded-2xl border-2 border-emerald-500/40 bg-emerald-500/5 p-5 flex flex-col justify-between space-y-4 relative">
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  ベータテスト対象
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  現在受付中
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
                <span>無料アカウント作成（ベータ参加）</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : currentPlan === "free" || currentPlan === "guest" ? (
              <div className="w-full text-center py-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                ✓ 現在ご利用中（無料会員ベータ）
              </div>
            ) : null}
          </div>
        </div>

        {/* 2. Base Plan */}
        <div className="rounded-2xl border border-border bg-background p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  毎日の習慣化
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                  🔒 VIP先行公開中
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
              <div className="w-full text-center py-2.5 px-3 text-xs font-bold text-muted-foreground bg-muted/60 rounded-xl border border-border/80 flex items-center justify-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                <span>VIPテスター限定先行公開中</span>
              </div>
            )}
          </div>
        </div>

        {/* 3. Pro Plan (Featured) */}
        <div className="rounded-2xl border-2 border-primary/50 bg-primary/5 p-5 flex flex-col justify-between space-y-4 relative shadow-sm">
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-primary uppercase tracking-wider">
                  本気で英語をモノにする
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                  🔒 VIP先行公開中
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
                <span>業界別特化英文生成（Tech / ビジネス / マーケティング / 日常会話）</span>
              </li>
            </ul>
          </div>

          <div className="pt-3">
            {currentPlan === "pro" ? (
              <div className="w-full text-center py-2 text-xs font-bold text-primary bg-primary/10 border border-primary/30 rounded-xl">
                👑 現在ご利用中（完全無制限）
              </div>
            ) : (
              <div className="w-full text-center py-2.5 px-3 text-xs font-bold text-muted-foreground bg-muted/60 rounded-xl border border-border/80 flex items-center justify-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                <span>VIPテスター限定先行公開中</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
