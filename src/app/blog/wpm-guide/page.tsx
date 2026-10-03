import type { Metadata } from "next";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  Clock,
  BookOpen,
  Zap,
  ChevronLeft,
} from "lucide-react";

export const metadata: Metadata = {
  title: "【2026年最新】チャンクとは？WPM向上のための英語シャドーイング実践ガイド | ShadowLog公式ブログ",
  description:
    "英語リスニングとスピーキングの鍵となる「チャンク（意味の塊）」を徹底解説。WPM（1分間あたりの単語数）を高め、ネイティブスピードに追いつくためのAIシャドーイング実践法を紹介。",
  keywords: [
    "チャンクとは 英語",
    "英語 チャンク リーディング",
    "WPM 英語 平均",
    "シャドーイング チャンク",
    "英語 リスニング 追いつかない",
    "WPM 測り方 英語",
    "ShadowLog ブログ",
  ],
  openGraph: {
    title: "【2026年最新】チャンクとは？WPM向上のための英語シャドーイング実践ガイド",
    description: "単語単位のブツ切り聞き取りを卒業！チャンク処理能力を高めてWPMを劇的に向上させる方法。",
    type: "article",
    publishedTime: "2026-03-25T00:00:00Z",
  },
};

export default function ChunkWpmGuideBlogPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: "【2026年最新】チャンクとは？WPM向上のための英語シャドーイング実践ガイド",
    description:
      "英語リスニングとスピーキングの鍵となる「チャンク（意味の塊）」を徹底解説。WPMを高めるためのAIシャドーイング実践法。",
    datePublished: "2026-03-25T00:00:00Z",
    dateModified: "2026-03-25T00:00:00Z",
    author: {
      "@type": "Organization",
      name: "ShadowLog 英語学習ラボ",
    },
    publisher: {
      "@type": "Organization",
      name: "ShadowLog",
      logo: {
        "@type": "ImageObject",
        url: "https://shadowlog.vercel.app/icon.png",
      },
    },
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Schema.org Article Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Header / Navbar */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/blog"
              className="p-2 rounded-xl bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 transition"
              title="ブログ一覧に戻る"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/20">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-bold text-lg text-white">
                Shadow<span className="text-indigo-400">Log</span> <span className="text-xs text-slate-400 font-normal ml-1">BLOG</span>
              </span>
            </Link>
          </div>

          <Link
            href="/practice"
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm transition shadow-lg shadow-indigo-600/30 flex items-center gap-1.5"
          >
            <span>AIでWPMを無料測定</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* Article Body Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-10">
        {/* Article Header Header */}
        <div className="space-y-4 text-center sm:text-left border-b border-slate-800 pb-8">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs font-semibold text-indigo-400">
            <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30">
              英語学習ノウハウ
            </span>
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
              WPM・シャドーイング
            </span>
            <span className="text-slate-400 flex items-center gap-1 ml-2">
              <Clock className="w-3.5 h-3.5" /> 約 5 分で読めます
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight">
            【2026年最新】チャンク（Chunk）とは？<br className="hidden sm:inline" />
            WPM向上のための英語シャドーイング実践ガイド
          </h1>

          <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
            「英語を単語ごとに訳していると、ネイティブのスピードに追いつかない…」そんなお悩みを解消するのが『チャンク（意味の塊）』での処理能力です。本記事ではチャンクの基本からWPM（Words Per Minute）との関係、最新AIを活用した練習法まで徹底解説します。
          </p>
        </div>

        {/* Table of Contents */}
        <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-400" />
            目次
          </h2>
          <ul className="space-y-2 text-sm text-slate-300">
            <li>
              <a href="#section-1" className="hover:text-indigo-400 transition">
                1. 英語の「チャンク（Chunk）」とは？なぜ重要なのか
              </a>
            </li>
            <li>
              <a href="#section-2" className="hover:text-indigo-400 transition">
                2. WPM（Words Per Minute）とチャンク処理能力の深いつながり
              </a>
            </li>
            <li>
              <a href="#section-3" className="hover:text-indigo-400 transition">
                3. チャンク認識を鍛えるシャドーイング実践ステップ
              </a>
            </li>
            <li>
              <a href="#section-4" className="hover:text-indigo-400 transition">
                4. ShadowLogのAI即時可視化でWPMとチャンク脱落をチェック！
              </a>
            </li>
            <li>
              <a href="#section-5" className="hover:text-indigo-400 transition">
                5. まとめ：プロ添削と比較したコスト最適化の知恵
              </a>
            </li>
          </ul>
        </div>

        {/* Section 1 */}
        <section id="section-1" className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 border-l-4 border-indigo-500 pl-3">
            1. 英語の「チャンク（Chunk）」とは？なぜ重要なのか
          </h2>
          <div className="text-slate-300 leading-relaxed space-y-4 text-sm sm:text-base">
            <p>
              英語の<strong>チャンク（Chunk）</strong>とは、2〜4語程度の「意味や文法上のまとまり（塊）」を指します。
            </p>
            <p>
              日本語と英語では語順が全く異なるため、1単語ずつ頭の中で日本語に訳そうとすると、リスニング中に脳のキャパシティ（ワーキングメモリー）がオーバーフローしてしまいます。
            </p>

            <div className="p-5 rounded-xl bg-slate-800/60 border border-slate-700/80 space-y-3">
              <p className="font-bold text-indigo-300 text-sm">💡 ブツ切り翻訳 vs チャンク処理の比較</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs sm:text-sm">
                <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/50">
                  <span className="font-bold text-rose-400 block mb-1">❌ 1単語ごとの戻り読み</span>
                  <p className="text-slate-300">&quot;I went to the store&quot; → 「私は」「行った」「〜へ」「その」「店」と後ろから訳すためリスニングで遅れが発生する。</p>
                </div>
                <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/50">
                  <span className="font-bold text-emerald-400 block mb-1">⭕ チャンクごとの直読直解</span>
                  <p className="text-slate-300">[I went] [to the store] → 語順のまま頭からカタマリで意味をイメージし、脳に負担をかけない。</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2 */}
        <section id="section-2" className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 border-l-4 border-indigo-500 pl-3">
            2. WPM（Words Per Minute）とチャンク処理能力の深いつながり
          </h2>
          <div className="text-slate-300 leading-relaxed space-y-4 text-sm sm:text-base">
            <p>
              <strong>WPM（Words Per Minute）</strong>とは、「1分間あたりに処理（発話・聞き取り）できる単語数」の指標です。
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-indigo-400 text-xs font-bold block mb-1">TOEIC 600点レベル</span>
                <span className="text-2xl font-black text-white">100~120</span>
                <span className="text-xs text-slate-400 block mt-1">WPM</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-emerald-400 text-xs font-bold block mb-1">ビジネス英語実務</span>
                <span className="text-2xl font-black text-white">140~160</span>
                <span className="text-xs text-slate-400 block mt-1">WPM</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-amber-400 text-xs font-bold block mb-1">ネイティブ日常会話</span>
                <span className="text-2xl font-black text-white">180+</span>
                <span className="text-xs text-slate-400 block mt-1">WPM</span>
              </div>
            </div>

            <p>
              WPM150以上のネイティブスピードについていくためには、チャンク単位で音声を認識し、音のつながり（リンキング）をそのまま発声するシャドーイングトレーニングが不可欠です。
            </p>
          </div>
        </section>

        {/* Section 3 */}
        <section id="section-3" className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 border-l-4 border-indigo-500 pl-3">
            3. チャンク認識を鍛えるシャドーイング実践ステップ
          </h2>
          <div className="text-slate-300 leading-relaxed space-y-4 text-sm sm:text-base">
            <ol className="space-y-3">
              <li className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0 text-sm">1</span>
                <div>
                  <h3 className="font-bold text-white mb-1">音源のスクリプトをスラッシュリーディングする</h3>
                  <p className="text-xs sm:text-sm text-slate-400">意味のまとまり（チャンク）ごとに「/」で区切り、頭から理解できる状態を作ります。</p>
                </div>
              </li>
              <li className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0 text-sm">2</span>
                <div>
                  <h3 className="font-bold text-white mb-1">音の連結（リンキング）・脱落（リダクション）を意識して真似る</h3>
                  <p className="text-xs sm:text-sm text-slate-400">「check it out」を「チェック・イット・アウト」ではなく「チェキライ」とチャンク単位の音で捉えます。</p>
                </div>
              </li>
              <li className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0 text-sm">3</span>
                <div>
                  <h3 className="font-bold text-white mb-1">自分の発音とモデル音声を録音・AI分析する</h3>
                  <p className="text-xs sm:text-sm text-slate-400">どの単語・チャンクで遅れが発生しているかを客観的に数値化します。</p>
                </div>
              </li>
            </ol>
          </div>
        </section>

        {/* Section 4 Banner */}
        <section id="section-4" className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 border-l-4 border-indigo-500 pl-3">
            4. ShadowLogのAI即時可視化でWPMとチャンク脱落をチェック！
          </h2>
          <div className="text-slate-300 leading-relaxed space-y-4 text-sm sm:text-base">
            <p>
              従来のシャドーイング学習では、「自分が本当に正確な速度・単語で言えているか」を確かめるために、プロ講師の添削を何時間も待つか、自分で録音を聞き返す必要がありました。
            </p>
            <p>
              ShadowLogでは、<strong>Whisper AI</strong>を活用してあなたの声を録音直後に単語レベルでDiff可視化。WPMの自動計測と脱落単語のハイライト表示をその場で行います。
            </p>

            <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-950/80 to-slate-950 border border-indigo-500/30 space-y-4 text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Whisper AI リアルタイムWPM計測</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white">
                あなたの現在のシャドーイングWPMを数秒で診断してみませんか？
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto">
                登録不要・完全無料ですぐにお持ちのPCやスマホのブラウザから体験できます。
              </p>
              <Link
                href="/practice"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition shadow-lg shadow-indigo-600/30"
              >
                <span>無料体験でWPMを測定してみる</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Section 5 */}
        <section id="section-5" className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 border-l-4 border-indigo-500 pl-3">
            5. まとめ：プロ添削と比較したコスト最適化の知恵
          </h2>
          <div className="text-slate-300 leading-relaxed space-y-4 text-sm sm:text-base">
            <p>
              シャドーイング専門サービスの中には、月額2万円を超えるプロ人手添削サービス（シャドテンなど）もありますが、「毎日AIで反復練習し、WPM数値を即座に伸ばしたい」方にはShadowLog（月額1,480円〜）が圧倒的コスパを発揮します。
            </p>
            <p>
              詳しい比較データについては、当サイトの徹底比較ページも合わせてご参照ください。
            </p>

            <div className="pt-2">
              <Link
                href="/compare/shadoten"
                className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-bold underline underline-offset-4 text-sm"
              >
                <span>→ シャドテン vs ShadowLog 徹底比較ガイドを見る</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-8 text-center text-xs text-slate-400 mt-16">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
            <Link href="/" className="hover:text-white">ShadowLog ホーム</Link>
            <span>•</span>
            <Link href="/blog" className="hover:text-white">ブログ一覧</Link>
            <span>•</span>
            <Link href="/compare/shadoten" className="hover:text-white">シャドテン比較</Link>
          </div>
          <p>© {new Date().getFullYear()} ShadowLog Blog. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
