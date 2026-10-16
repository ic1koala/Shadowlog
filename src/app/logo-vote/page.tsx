import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles, ArrowRight, Heart, ExternalLink } from "lucide-react";
import { LogoVoteClient } from "@/components/features/onboarding/LogoVoteClient";

export const metadata: Metadata = {
  title: "【公式投票】ShadowLog ロゴオープニングアニメーション総選挙 | ShadowLog",
  description:
    "技術相談役が制作した5つの公式ロゴオープニングアニメーション（無からの出現演出）。アプリ起動画面に採用するお気に入りの1つを投票で決定！",
  openGraph: {
    title: "【公式投票】ShadowLog ロゴオープニングアニメーション総選挙",
    description:
      "技術相談役が制作した5つの公式ロゴアニメーション。アプリ起動画面に採用する1つをみんなの投票で決定！",
    url: "https://shadowlog.vercel.app/logo-vote",
    images: [
      {
        url: "https://shadowlog.vercel.app/og-image.png",
        width: 1200,
        height: 630,
        alt: "ShadowLog ロゴアニメーション総選挙",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "【公式投票】ShadowLog ロゴアニメーション総選挙",
    description: "技術相談役が制作した5つの公式ロゴオープニング。みんなの投票で採用ロゴを決定！",
    images: ["https://shadowlog.vercel.app/og-image.png"],
  },
};

export default function LogoVotePage() {
  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#0B0F19]/85 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-base sm:text-lg text-white">
              Shadow<span className="text-blue-400">Log</span>
              <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-300 border border-blue-500/30">
                ロゴ総選挙
              </span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <a
              href="https://www.threads.com/@shadowlog_official"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-pink-500/20 to-purple-500/20 hover:from-pink-500/30 hover:to-purple-500/30 text-pink-300 border border-pink-500/30 text-xs font-bold transition shadow-sm"
            >
              <Heart className="w-3.5 h-3.5 text-pink-400" />
              <span>Threadsで投票する</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </a>

            <Link
              href="/practice"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-md shadow-blue-500/20"
            >
              <span>アプリを試す</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Interactive Voting Section */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <LogoVoteClient />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} ShadowLog. All rights reserved.</p>
      </footer>
    </div>
  );
}
