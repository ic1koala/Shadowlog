import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { ToeicDiagnosisClient } from "@/components/features/assessment/ToeicDiagnosisClient";
import { VipRemainingBadge } from "@/components/features/waitlist/VipRemainingBadge";

export const metadata: Metadata = {
  title: "【無料 1min】AI英語発話スピード（WPM）＆TOEIC実力レンジ診断テスト（全5問） | ShadowLog",
  description:
    "登録不要・全5問（約1分）英語を声に出すだけで、Whisper AIがあなたの実効WPM・音の連結（リンキング）再現力・TOEIC推定実力レンジ（例: 650〜740点レベル）を算出！",
  keywords: [
    "英語 WPM 測定",
    "TOEIC スコア 診断 無料",
    "TOEIC 実力 レンジ",
    "英語 発音 テスト AI",
    "シャドーイング レベル診断",
    "英語 スピーキング 速度 テスト",
    "ShadowLog 診断",
  ],
  openGraph: {
    title: "【無料 1min】AI英語発話スピード（WPM）＆TOEIC実力レンジ診断（全5問）",
    description:
      "全5問（約1分）声に出すだけで、あなたの有効WPMとTOEIC推定実力帯・弱点リンキングをAIが客観的に可視化！",
    type: "website",
    url: "https://shadowlog.vercel.app/diagnosis",
    images: [
      {
        url: "https://shadowlog.vercel.app/og-image.png",
        width: 1200,
        height: 630,
        alt: "【無料 1min】AI英語発話スピード（WPM）＆TOEIC実力レンジ診断 | ShadowLog",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "【無料 1min】AI英語発話スピード（WPM）＆TOEIC実力レンジ診断（全5問）",
    description: "全5問声を吹き込むだけで、WPMや連結音の弱点、TOEIC推定実力レンジをAIが即時判定！",
    images: ["https://shadowlog.vercel.app/og-image.png"],
  },
};

export default function PublicDiagnosisPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "ShadowLog AI英語WPM＆推定TOEIC実力レンジ診断ツール",
    applicationCategory: "EducationalApplication",
    operatingSystem: "All",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "JPY",
    },
    description:
      "全5問の英文を発声するだけで、Whisper AIが有効WPM・リンキング再現率・TOEIC推定実力レンジを無料診断するWebツール。",
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Top Navigation */}
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/85 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-15 flex items-center justify-between">
          <Link href="/waitlist" className="flex items-center gap-2 group hover:opacity-90 transition">
            <BrandLogo size="sm" priority />
            <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-primary/10 text-primary border border-primary/20">
              AI実力診断
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/waitlist"
              className="text-xs font-bold text-muted-foreground hover:text-foreground transition px-2 py-1"
            >
              アプリ紹介LP
            </Link>
            <Link
              href="/signup?vip=1"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition shadow-xs"
            >
              <span>VIP限定特典で登録</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Intro */}
      <section className="pt-6 pb-4 px-4 sm:px-6 text-center max-w-3xl mx-auto space-y-3">
        <VipRemainingBadge variant="compact" />

        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground leading-tight pt-1">
          全5問で判定！AI英語スピード＆TOEIC実力レンジ診断
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
          登録不要・わずか1分（全5問）完結。あなたの声をWhisper AIが1単語単位で解析し、
          <strong className="text-foreground">「有効WPM」「リンキング再現率」「TOEIC推定実力レンジ」</strong>
          を客観的に可視化します。
        </p>
      </section>

      {/* Main Interactive 3-Step Test */}
      <main className="flex-1 w-full px-4 sm:px-6 pt-2">
        <ToeicDiagnosisClient mode="public" />
      </main>

      {/* Footer */}
      <footer className="border-t border-border/80 py-6 text-center text-xs text-muted-foreground">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/waitlist" className="hover:text-foreground font-semibold">
              ShadowLog 紹介LP
            </Link>
            <span>•</span>
            <Link href="/compare/shadoten" className="hover:text-foreground">
              他社比較
            </Link>
            <span>•</span>
            <Link href="/blog" className="hover:text-foreground">
              公式ブログ
            </Link>
          </div>
          <p>© {new Date().getFullYear()} ShadowLog. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
