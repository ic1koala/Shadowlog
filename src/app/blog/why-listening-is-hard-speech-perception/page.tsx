import type { Metadata } from "next";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  Clock,
  CheckCircle2,
  ChevronLeft,
  Headphones,
  Brain,
  Zap,
  BookOpen,
} from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";

export const metadata: Metadata = {
  title: "なぜ知っている単語なのに聞き取れないのか？英語リスニングの壁を壊す「音声知覚」の正体 | ShadowLog公式ブログ",
  description:
    "英文を文字で見ると中学レベルなのに、ネイティブが喋ると一瞬で置いていかれる理由とは？第二言語習得論（SLA）の「音声知覚と意味理解の二段階処理モデル」をもとに、リスニングの壁を突破する科学的シャドーイング法を解説。",
  keywords: [
    "英語 リスニング 聞き取れない",
    "英語 音声知覚",
    "シャドーイング 効果",
    "第二言語習得論 リスニング",
    "ワーキングメモリ 英語",
    "ShadowLog ブログ",
  ],
  openGraph: {
    title: "なぜ知っている単語なのに聞き取れないのか？英語リスニングの壁を壊す「音声知覚」の正体",
    description: "知ってる単語なのに耳に入ってこないのはなぜ？脳科学と第二言語習得論が解き明かすリスニングの壁と、今日からできる克服トレーニング。",
    type: "article",
    publishedTime: "2026-10-25T00:00:00Z",
  },
};

export default function WhyListeningIsHardBlogPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: "なぜ知っている単語なのに聞き取れないのか？英語リスニングの壁を壊す「音声知覚」の正体",
    description:
      "英文を文字で見ると中学レベルなのに、ネイティブが喋ると一瞬で置いていかれる理由とは？第二言語習得論（SLA）の「音声知覚と意味理解の二段階処理モデル」をもとに、リスニングの壁を突破する科学的シャドーイング法を解説。",
    datePublished: "2026-10-25T00:00:00Z",
    dateModified: "2026-10-25T00:00:00Z",
    author: {
      "@type": "Organization",
      name: "ShadowLog 開発チーム",
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

      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            href="/blog"
            className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-400 hover:text-white transition"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>ブログ一覧へ戻る</span>
          </Link>
          <div className="flex items-center gap-2">
            <BrandLogo size="sm" inverted />
            <span className="text-xs text-indigo-400 font-bold bg-indigo-950/60 border border-indigo-800/60 px-2 py-0.5 rounded-md">
              SLA ＆ 脳科学
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        {/* Article Header */}
        <header className="space-y-4 border-b border-slate-800 pb-8">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-bold">
              第二言語習得論・リスニング科学
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              読了目安 5分
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400">2026.10.25 公開</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight">
            なぜ知っている単語なのに聞き取れないのか？英語リスニングの壁を壊す「音声知覚」の正体
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            スクリプトを見れば「なんだ、こんな簡単な英語だったのか」と拍子抜けするのに、音声だけで流れると一瞬で置いていかれる——。
            最近話題の書籍『100日後に英語がものになる』などを読んで実践している方からも、非常によくいただく悩みです。
            実はこれ、単語力や耳の良さの問題ではなく、脳科学における「音声知覚（音の認識）」の仕組みに根本的な原因があります。
          </p>
        </header>

        {/* Article Body */}
        <article className="py-8 space-y-10 text-slate-300 text-sm sm:text-base leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 border-l-4 border-indigo-500 pl-3">
              <Headphones className="w-6 h-6 text-indigo-400" />
              1. スクリプトを見れば分かるのに、なぜ耳で追えないのか？
            </h2>
            <p>
              例えば、海外ドラマやTOEICのリスニングで次のようなフレーズが流れたとします。
            </p>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-sm sm:text-base text-indigo-300">
              &quot;I thought you were going to check it out last night.&quot;
            </div>
            <p>
              文字で見れば、難しい単語は1つもありません。高校入試レベル、いや中学英語レベルの単語ばかりです。
              しかし、ネイティブが通常の速度（約150〜180 WPM）で喋ると、私たちの耳には次のように聞こえます。
            </p>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-sm text-slate-400">
              「アイソーチュワ ガナ チェケラウッ ラスナイッ」
            </div>
            <p>
              ここで脳内で大渋滞が起きます。「チェケラウッ？ラスナイッ？…あ、check it outか！」と思い出した頃には、音声はもう2文先へ進んでおり、完全にリスニングの迷子になってしまうのです。
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 border-l-4 border-indigo-500 pl-3">
              <Brain className="w-6 h-6 text-indigo-400" />
              2. 脳科学で解き明かす「二段階処理モデル」
            </h2>
            <p>
              言語学および第二言語習得論（SLA）の権威である門田修平教授（関西学院大学）らの研究によると、人間が外国語を聞いて理解するプロセスは、大きく分けて次の<strong>2つの段階</strong>で行われています。
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
              <div className="p-4 rounded-xl bg-slate-850 border border-indigo-500/20 bg-indigo-950/20 space-y-2">
                <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                  第1段階
                </div>
                <h3 className="font-bold text-white text-base">音声知覚（Phonological Decoding）</h3>
                <p className="text-xs sm:text-sm text-slate-400">
                  耳から入ってきた空気の振動（音波）を、脳内の心内辞書（メンタルレキシコン）と照合して「英語の単語」として同定する処理。
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-850 border border-emerald-500/20 bg-emerald-950/20 space-y-2">
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  第2段階
                </div>
                <h3 className="font-bold text-white text-base">意味理解（Semantic Processing）</h3>
                <p className="text-xs sm:text-sm text-slate-400">
                  同定された単語の並びや文脈から、「誰が・何を・どうしたのか」というメッセージの意味を脳内で解釈・構築する処理。
                </p>
              </div>
            </div>

            <p>
              ここで極めて重要なのが、人間の<strong>「ワーキングメモリ（作業記憶）」の容量には厳格な限界がある</strong>という点です。
            </p>
            <p>
              ネイティブスピーカーは、第1段階の「音声知覚」を無意識かつ瞬時に行える（自動化されている）ため、ワーキングメモリのほぼ100%を第2段階の「意味理解」に使うことができます。
            </p>
            <p>
              一方、英語学習者の多くは、<strong>ワーキングメモリの90%以上を「今の音はどの単語だったっけ…？」という音声知覚の解読に浪費してしまいます</strong>。その結果、意味を理解するための脳のCPUが残っておらず、「音は聞こえたけれど、内容はさっぱり頭に入ってこない」という現象が起きるのです。
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 border-l-4 border-indigo-500 pl-3">
              <Zap className="w-6 h-6 text-indigo-400" />
              3. 「聞き流し」では音声知覚が自動化されない理由
            </h2>
            <p>
              「たくさん英語のラジオやYouTubeを聞き流していれば、いつか自然に耳が慣れる」と信じている方も多いかもしれません。しかし、認知心理学の研究（Baddeleyの音韻ループ理論）では、<strong>人間は「自分が正しく発音できない音」を言語として長期記憶に保持できない</strong>ことが実証されています。
            </p>
            <p>
              文字（スペル）を見ずに、耳から入ってきた音だけを頼りに意味を掴むためには、自分の唇や舌などの調音器官を実際に動かし、<strong>「音と口の筋肉の動き（調音運動）」を脳内で一致させる</strong>必要があります。
            </p>
            <p>
              文字の知識（視覚情報）に頼ったまま聞き流しを続けても、脳は流れてくる早口の英語を「単なるBGM（雑音）」として右から左へ受け流してしまうのです。
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 border-l-4 border-indigo-500 pl-3">
              <BookOpen className="w-6 h-6 text-indigo-400" />
              4. 解決策：シャドーイングによる「音声知覚の自動化」
            </h2>
            <p>
              では、どうすれば音声知覚を無意識のレベルまで自動化できるのでしょうか？
              その最も確実で科学的に実証されているトレーニングが<strong>「シャドーイング（Shadowing）」</strong>です。
            </p>
            <p>
              流れてくる英語の音声を、影（シャドウ）のように0.5秒遅れで真似して発声することで、脳は次の3つの革命的な変化を起こします。
            </p>

            <ul className="space-y-3 my-4">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">音の脱落・連結（リンキング）への即応:</strong>
                  <span className="text-slate-400 text-sm block mt-0.5">
                    「get up ➔ ゲラップ」のように、音の変化を耳だけでなく口の筋肉で覚えるため、次に聞いた時に0.1秒で認識できるようになります。
                  </span>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">返り読みの物理的強制終了:</strong>
                  <span className="text-slate-400 text-sm block mt-0.5">
                    音声と同じスピード（130〜160 WPM）で口を動かし続けるため、日本語に後ろから訳す暇がなくなり、「英語の語順のまま理解する脳」が作られます。
                  </span>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">ワーキングメモリの解放:</strong>
                  <span className="text-slate-400 text-sm block mt-0.5">
                    音声知覚がほぼ無意識（消費リソース10%未満）で行われるようになり、残りの90%以上を「会話の文脈や要点の把握」にフル活用できるようになります。
                  </span>
                </div>
              </li>
            </ul>
          </section>

          {/* Section 5: Practical Action */}
          <section className="space-y-4 p-5 rounded-2xl bg-indigo-950/30 border border-indigo-500/30">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              今日からできる1分アクション：現在の「発話WPM」を測ってみよう
            </h2>
            <p className="text-sm text-slate-300">
              リスニング力を伸ばす第一歩は、「自分が今、どれくらいのスピード（WPM＝1分間の語数）で英語を滑らかに発話できているか」を客観的に知ることです。
            </p>
            <div className="bg-slate-900/80 rounded-xl p-4 border border-indigo-500/20 text-xs sm:text-sm space-y-2">
              <div className="font-semibold text-white">📊 発話スピード（WPM）の目安：</div>
              <div className="grid grid-cols-2 gap-2 text-slate-400">
                <div>・初級者レベル: 90〜110 WPM</div>
                <div>・TOEICリスニング: 130〜150 WPM</div>
                <div>・ニュース英語: 150〜170 WPM</div>
                <div>・ネイティブ日常会話: 160〜190 WPM</div>
              </div>
            </div>
            <p className="text-sm text-slate-300">
              ShadowLogでは、スマホやPCのマイクに向かって短い英文を吹き込むだけで、AIが瞬時に発音・発話WPM・推定TOEICスコアを無料判定する診断ツールを公開しています。登録不要・30秒で測定できますので、ぜひご自身の「現在地」をチェックしてみてください。
            </p>
            <div className="pt-2">
              <Link
                href="/diagnosis"
                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition"
              >
                <span>30秒で無料判定！AI発話スピード診断を試す</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </section>
        </article>

        {/* Article Footer & CTA */}
        <footer className="border-t border-slate-800 pt-8 mt-12 space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-2xl bg-slate-950 border border-slate-800">
            <div className="space-y-1 text-center sm:text-left">
              <h3 className="font-bold text-white text-base">
                AIシャドーイング習慣化アプリ「ShadowLog」
              </h3>
              <p className="text-xs sm:text-sm text-slate-400">
                月2万円のスクールに通わなくても、毎日1分のAIフィードバックで英語耳を作る。
              </p>
            </div>
            <Link
              href="/practice"
              className="px-5 py-2.5 rounded-xl bg-white text-slate-950 font-bold text-xs sm:text-sm hover:bg-slate-200 transition shrink-0"
            >
              無料体験はこちら
            </Link>
          </div>

          <div className="flex justify-between items-center text-xs text-slate-500 pt-4">
            <Link href="/blog" className="hover:text-slate-300 transition flex items-center gap-1">
              <ChevronLeft className="w-3.5 h-3.5" />
              ブログトップに戻る
            </Link>
            <span>© 2026 ShadowLog All Rights Reserved.</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
