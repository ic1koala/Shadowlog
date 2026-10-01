import type { Metadata } from "next";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Clock,
  Coins,
  Zap,
  HelpCircle,
  Award,
} from "lucide-react";

export const metadata: Metadata = {
  title: "【2026年比較】シャドテン vs ShadowLog 徹底比較 | 料金・AI判定・即時性の違い",
  description:
    "月額21,780円のシャドテンと月額1,480円のShadowLogを徹底比較。プロ添削とAIリアルタイムDiff判定の違い、WPM自動計測機能、無料体験の始め方まで分かりやすく解説。",
  keywords: [
    "シャドテン",
    "シャドテン 比較",
    "シャドテン 料金 高い",
    "ShadowLog",
    "英語 シャドーイング AI",
    "シャドーイング 格安",
    "WPM 測り方",
  ],
  openGraph: {
    title: "【2026年比較】シャドテン vs ShadowLog 徹底比較",
    description: "月額21,780円 vs 月額1,480円！プロ人手添削とAI即時可視化の違いを徹底検証。",
    type: "article",
  },
};

export default function ShadotenComparisonPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "シャドテンとShadowLogの最大の違いは何ですか？",
        acceptedAnswer: {
          "@type": "Answer",
          text: "シャドテンはプロ講師による人手添削（数時間〜24時間後のフィードバック・月額21,780円）、ShadowLogはWhisper AIによる即時発音判定・単語レベルDiff可視化（リアルタイムフィードバック・月額500円〜1,480円）という違いがあります。",
        },
      },
      {
        "@type": "Question",
        name: "ShadowLogは無料で体験できますか？",
        acceptedAnswer: {
          "@type": "Answer",
          text: "はい、クレジットカード登録不要で、ブラウザを開いてすぐに無料体験（短文シャドーイングおよびPro試掘）をお試しいただけます。",
        },
      },
    ],
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Header / Navbar */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-bold text-lg text-white">
              Shadow<span className="text-indigo-400">Log</span>
            </span>
          </Link>

          <Link
            href="/practice"
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm transition shadow-lg shadow-indigo-600/30 flex items-center gap-1.5"
          >
            <span>今すぐ無料で試す</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-16 px-4 sm:px-6 text-center max-w-4xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-bold">
          <Award className="w-4 h-4 text-amber-400" />
          <span>2026年最新 サービス徹底比較</span>
        </div>

        <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white leading-tight tracking-tight">
          シャドテン vs <span className="text-indigo-400">ShadowLog</span><br />
          料金・AI即時判定・継続率を徹底検証
        </h1>

        <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
          「シャドテンは良さそうだけど月2万円以上は高すぎる…」「もっと安く、自分のペースで発音のズレを確認したい」とお悩みの方へ。プロ添削と最新AIリアルタイム判定の決定的な違いを解説します。
        </p>
      </section>

      {/* Main Comparison Table Card */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-16">
        <div className="bg-slate-950/90 rounded-3xl border border-slate-800 p-4 sm:p-8 shadow-2xl space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-lg sm:text-2xl font-bold text-white flex items-center justify-center gap-2">
              <span>📊</span> 一目でわかる主要機能・料金比較表
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              ※記載されている他社料金・仕様は公表情報に基づきます。
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-4 px-4 font-bold">比較項目</th>
                  <th className="py-4 px-4 font-bold text-center bg-slate-900/50 rounded-t-xl text-slate-300">
                    シャドテン (Shadoten)
                  </th>
                  <th className="py-4 px-4 font-bold text-center bg-indigo-950/60 rounded-t-xl text-indigo-300 border-x border-t border-indigo-500/30">
                    ✨ ShadowLog (シャドーログ)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {/* 1. 月額料金 */}
                <tr>
                  <td className="py-4 px-4 text-slate-300 font-bold flex items-center gap-2">
                    <Coins className="w-4 h-4 text-amber-400 shrink-0" />
                    月額料金
                  </td>
                  <td className="py-4 px-4 text-center text-slate-400 bg-slate-900/30">
                    <span className="text-base font-bold text-slate-200">月額 21,780 円</span>
                    <br />
                    <span className="text-[11px] text-slate-500">（年間 約26.1万円）</span>
                  </td>
                  <td className="py-4 px-4 text-center bg-indigo-950/40 border-x border-indigo-500/30">
                    <span className="text-lg font-black text-emerald-400">月額 500円 / 1,480円</span>
                    <br />
                    <span className="text-xs font-bold text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded-full inline-block mt-1">
                      シャドテンの約1/15の低価格
                    </span>
                  </td>
                </tr>

                {/* 2. フィードバック速度 */}
                <tr>
                  <td className="py-4 px-4 text-slate-300 font-bold flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-400 shrink-0" />
                    判定・フィードバック時間
                  </td>
                  <td className="py-4 px-4 text-center text-slate-400 bg-slate-900/30">
                    <span className="font-bold text-slate-300">数時間 〜 24時間以内</span>
                    <br />
                    <span className="text-[11px] text-slate-500">（プロ講師が手動添削）</span>
                  </td>
                  <td className="py-4 px-4 text-center bg-indigo-950/40 border-x border-indigo-500/30">
                    <span className="font-extrabold text-emerald-400 text-base">即時（約2秒）</span>
                    <br />
                    <span className="text-[11px] text-slate-400">（Whisper AIがその場で即時判定）</span>
                  </td>
                </tr>

                {/* 3. 音の可視化 */}
                <tr>
                  <td className="py-4 px-4 text-slate-300 font-bold flex items-center gap-2">
                    <Zap className="w-4 h-4 text-purple-400 shrink-0" />
                    発音のズレ・音の可視化
                  </td>
                  <td className="py-4 px-4 text-center text-slate-400 bg-slate-900/30">
                    テキスト解説・音声添削のみ
                  </td>
                  <td className="py-4 px-4 text-center bg-indigo-950/40 border-x border-indigo-500/30">
                    <span className="font-bold text-white">単語レベルのDiff可視化</span>
                    <br />
                    <span className="text-[11px] text-slate-300">
                      （赤:脱落 / 緑:一致 / 黄:余剰）
                    </span>
                  </td>
                </tr>

                {/* 4. WPM話速計測 */}
                <tr>
                  <td className="py-4 px-4 text-slate-300 font-bold flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
                    WPM（話速）自動計測
                  </td>
                  <td className="py-4 px-4 text-center text-slate-400 bg-slate-900/30">
                    <XCircle className="w-5 h-5 mx-auto text-slate-600" />
                  </td>
                  <td className="py-4 px-4 text-center bg-indigo-950/40 border-x border-indigo-500/30">
                    <CheckCircle2 className="w-5 h-5 mx-auto text-emerald-400" />
                    <span className="text-[11px] text-emerald-300 font-bold">1分あたりの発話語数を自動算出</span>
                  </td>
                </tr>

                {/* 5. 苦手単語の自動復習 */}
                <tr>
                  <td className="py-4 px-4 text-slate-300 font-bold flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
                    苦手単語の自動復習アルゴリズム
                  </td>
                  <td className="py-4 px-4 text-center text-slate-400 bg-slate-900/30">
                    なし（手動で意識）
                  </td>
                  <td className="py-4 px-4 text-center bg-indigo-950/40 border-x border-indigo-500/30 rounded-b-xl border-b">
                    <CheckCircle2 className="w-5 h-5 mx-auto text-emerald-400" />
                    <span className="text-[11px] text-emerald-300 font-bold">
                      間違えた単語をAIが自動出題
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Feature Deep Dive */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-16 space-y-8">
        <h2 className="text-xl sm:text-3xl font-bold text-white text-center">
          どちらを選ぶべき？おすすめの選び方
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Shadoten Case */}
          <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
            <div className="inline-block px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-bold">
              シャドテンが向いている方
            </div>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-slate-500">✓</span>
                <span>プロ英語プロ講師による人手のアドバイスを直接受けたい方</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-slate-500">✓</span>
                <span>月額21,780円の予算が確保できる方</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-slate-500">✓</span>
                <span>添削結果が翌日まで待てる時間のゆとりがある方</span>
              </li>
            </ul>
          </div>

          {/* ShadowLog Case */}
          <div className="p-6 rounded-2xl bg-indigo-950/60 border border-indigo-500/30 space-y-4 shadow-xl">
            <div className="inline-block px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
              ✨ ShadowLogが向いている方
            </div>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-200">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>月額500円〜1,480円でコスパ良く</strong>毎日練習したい方</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>録音したその場で<strong>赤・緑・黄色の視覚判定</strong>を見たい方</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>自分のWPM（話速）を数値化して成長を実感したい方</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA Box */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-20 text-center">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 border border-indigo-500/40 shadow-2xl space-y-6">
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            まずはクレジットカード不要で体験してみませんか？
          </h2>
          <p className="text-xs sm:text-sm text-indigo-100 max-w-xl mx-auto">
            ShadowLogは会員登録なしで無料体験が可能です。あなたの発音のズレがその場で可視化される瞬間を体験してください。
          </p>
          <div className="pt-2">
            <Link
              href="/practice"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-white text-indigo-950 font-black text-base hover:bg-slate-100 transition shadow-2xl hover:scale-105"
            >
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <span>ShadowLogを今すぐ無料お試し</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 space-y-2">
          <p>© {new Date().getFullYear()} ShadowLog. All rights reserved.</p>
          <div className="flex justify-center gap-4 text-slate-400">
            <Link href="/terms" className="hover:underline">利用規約</Link>
            <Link href="/privacy" className="hover:underline">プライバシーポリシー</Link>
            <Link href="/tokushoho" className="hover:underline">特定商取引法に基づく表記</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
