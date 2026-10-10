import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import { ToeicDiagnosisClient } from "@/components/features/assessment/ToeicDiagnosisClient";
import { VipRemainingBadge } from "@/components/features/waitlist/VipRemainingBadge";

export const metadata: Metadata = {
  title: "【無料30秒】AI英語発話スピード（WPM）＆推定TOEICスコア診断テスト | ShadowLog",
  description:
    "登録不要・わずか3問（30秒）英語を声に出すだけで、Whisper AIがあなたの実効WPM・音の連結（リンキング）再現力・推定TOEICスコア（300〜990点）を即時診断！",
  keywords: [
    "英語 WPM 測定",
    "TOEIC スコア 診断 無料",
    "英語 発音 テスト AI",
    "シャドーイング レベル診断",
    "英語 スピーキング 速度 テスト",
    "ShadowLog 診断",
  ],
  openGraph: {
    title: "【無料30秒】AI英語発話スピード（WPM）＆推定TOEICスコア診断",
    description:
      "3問声に出すだけで、あなたの有効WPMと推定TOEICスコア・弱点リンキングをAIが即時カルテ化！",
    type: "website",
    url: "https://shadowlog.vercel.app/diagnosis",
    images: [
      {
        url: "https://shadowlog.vercel.app/diagnosis/opengraph-image",
        width: 1200,
        height: 630,
        alt: "【無料30秒】AI英語発話スピード（WPM）＆推定TOEICスコア診断 | ShadowLog",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "【無料30秒】AI英語発声スピード（WPM）＆推定TOEICスコア診断",
    description: "3問声を吹き込むだけで、WPMや連結音の弱点、推定TOEICスコアをAIが即時判定！",
    images: ["https://shadowlog.vercel.app/diagnosis/opengraph-image"],
  },
};

export default function PublicDiagnosisPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "ShadowLog AI英語WPM＆推定TOEICスコア診断ツール",
    applicationCategory: "EducationalApplication",
    operatingSystem: "All",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "JPY",
    },
    description:
      "3問の英文を発声するだけで、Whisper AIが有効WPM・リンキング再現率・推定TOEICスコアを無料診断するWebツール。",
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
          <Link href="/waitlist" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-bold text-base sm:text-lg tracking-tight text-foreground">
              Shadow<span className="text-primary">Log</span>
              <span className="ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-primary/10 text-primary border border-primary/20">
                AI実力診断
              </span>
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
              <span>VIP先行登録</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Intro */}
      <section className="pt-6 pb-4 px-4 sm:px-6 text-center max-w-3xl mx-auto space-y-3">
        <VipRemainingBadge variant="compact" />

        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground leading-tight pt-1">
          3問でわかる！AI英語スピード＆推定TOEIC診断
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
          登録不要・30秒完結。あなたの声をWhisper AIが1単語単位で解析し、
          <strong className="text-foreground">「有効WPM」「リンキング再現率」「推定TOEICスコア」</strong>
          をその場で算出します。
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
