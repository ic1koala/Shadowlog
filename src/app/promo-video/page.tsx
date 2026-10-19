import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles, ArrowLeft, Video, Film, Share2 } from "lucide-react";
import { PromoVideoSimulator } from "@/components/features/promo/PromoVideoSimulator";

export const metadata: Metadata = {
  title: "【動画制作スタジオ】プロモーション動画シミュレーター | ShadowLog",
  description:
    "Threads・Instagram・Xで伸びるアプリ紹介プロモーション動画をブラウザ上でシミュレーション・録画できる開発者向けスタジオ。",
};

export default function PromoVideoPage() {
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
              <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/30">
                Promo Studio
              </span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/logo-vote"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/80 text-xs font-bold transition"
            >
              <Film className="w-3.5 h-3.5 text-blue-400" />
              <span>ロゴ総選挙へ</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Studio Body */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        {/* Title Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Video className="w-3.5 h-3.5" />
            <span>アプローチ2：Web完全自動アニメーション動画</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
            ShadowLog 公式プロモ動画スタジオ
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            ThreadsやInstagram、Xでバズっている「滑らかなUIズーム ＆ 音声波形解析」をWeb上で忠実に再現。
            再生ボタンを押して、Macの画面収録（Command+Shift+5）でそのまま高画質動画として保存できます。
          </p>
        </div>

        {/* Simulator Component */}
        <PromoVideoSimulator />

        {/* Feature Cards / Production Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
          <div className="bg-[#0B0F19] border border-slate-800/80 rounded-2xl p-4 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">
              1
            </div>
            <h4 className="font-bold text-sm text-white">滑らかなカメラオートズーム</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              ユーザーの視線を釘付けにするため、録音開始や採点結果のタイミングでスマホ画面へダイナミックにカメラが寄ります。
            </p>
          </div>

          <div className="bg-[#0B0F19] border border-slate-800/80 rounded-2xl p-4 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold">
              2
            </div>
            <h4 className="font-bold text-sm text-white">リアルタイム音声波形 ＆ WPM</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              声を吹き込んでいる臨場感を演出。話速メーターが148 WPMまで急上昇し、最先端AIのテクノロジー感をアピールします。
            </p>
          </div>

          <div className="bg-[#0B0F19] border border-slate-800/80 rounded-2xl p-4 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
              3
            </div>
            <h4 className="font-bold text-sm text-white">縦型（9:16）＆ 横型（16:9）両対応</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Threads/Reels/TikTok用の縦型と、X/YouTube用の横型をワンクリックで切り替え可能。それぞれの比率に最適化して再生されます。
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 py-6 text-center text-xs text-slate-500">
        © 2026 ShadowLog Promo Studio. Built for high-engagement product launches.
      </footer>
    </div>
  );
}
