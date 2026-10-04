import type { Metadata } from "next";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  Clock,
  CheckCircle2,
  ChevronLeft,
  Heart,
} from "lucide-react";

export const metadata: Metadata = {
  title: "社会人が英語を口に出す「きっかけ」を作るために。ShadowLogを開発した理由 | ShadowLog公式ブログ",
  description:
    "仕事で英語を使わない社会人が、無理なく毎日英語を話す習慣を作るには？開発者自身が抱いた課題感と、自分専用の英文で声を出す英語アプリ「ShadowLog」を作った想いを語ります。",
  keywords: [
    "ShadowLog 開発秘話",
    "社会人 英語 勉強 きっかけ",
    "英語 話す機会がない 社会人",
    "英語 シャドーイング 習慣化",
    "英語アプリ 個人開発",
    "ShadowLog ブログ",
  ],
  openGraph: {
    title: "社会人が英語を口に出す「きっかけ」を作るために。ShadowLogを開発した理由",
    description: "仕事で英語を使わない日々の中で、毎日声を出す習慣を作る。ShadowLog誕生のストーリー。",
    type: "article",
    publishedTime: "2026-04-01T00:00:00Z",
  },
};

export default function WhyIBuiltShadowlogBlogPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: "社会人が英語を口に出す「きっかけ」を作るために。ShadowLogを開発した理由",
    description:
      "仕事で英語を使わない社会人が無理なく毎日英語を話す習慣を作るために。ShadowLog開発の背景と込めた想い。",
    datePublished: "2026-04-01T00:00:00Z",
    dateModified: "2026-04-01T00:00:00Z",
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
                Shadow<span className="text-indigo-400">Log</span> <span className="text-xs text-slate-400 font-normal ml-1">STORY</span>
              </span>
            </Link>
          </div>

          <Link
            href="/practice"
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm transition shadow-lg shadow-indigo-600/30 flex items-center gap-1.5"
          >
            <span>今すぐ無料で体験</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* Article Body Container */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-10">
        {/* Article Header */}
        <div className="space-y-4 border-b border-slate-800 pb-8">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-indigo-400">
            <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30">
              開発ストーリー
            </span>
            <span className="px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-1">
              <Heart className="w-3 h-3 text-rose-400" /> 想いとビジョン
            </span>
            <span className="text-slate-400 flex items-center gap-1 ml-auto">
              <Clock className="w-3.5 h-3.5" /> 約 4 分で読めます
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight">
            社会人が英語を口に出す「きっかけ」を作るために。<br />
            ShadowLogを開発した理由
          </h1>

          <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
            社会人になって「英語が話せるようになりたい」と思っても、仕事で使う機会もなく普段の生活で声を出す環境もない。そんな悩みから生まれたのがAIシャドーイングアプリ「ShadowLog」です。
          </p>
        </div>

        {/* Story Section 1 */}
        <section className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 border-l-4 border-indigo-500 pl-3">
            1. 「勉強したい。でも口に出すきっかけがない」社会人のモヤモヤ
          </h2>
          <div className="text-slate-300 leading-relaxed space-y-4 text-sm sm:text-base">
            <p>
              社会人になると、ふとした瞬間に「英語を自由に話せるようになりたいな」と思うことがあります。
            </p>
            <p>
              しかし現実は、職場でもプライベートでも英語を使う機会はほとんどありません。周りに外国人の同僚がいるわけでもなく、毎日の生活の中で「英語を口に出すきっかけ」すら作れないのが現実でした。
            </p>
            <p>
              「英会話を始めようかな」と思っても、本格的な英語コーチングやスクールは月額数万円〜2万円以上と非常に高額で、なかなか一歩を踏み出せません。
            </p>
          </div>
        </section>

        {/* Story Section 2 */}
        <section className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 border-l-4 border-indigo-500 pl-3">
            2. 単語暗記だけじゃない。「声を出す習慣」が欲しい
          </h2>
          <div className="text-slate-300 leading-relaxed space-y-4 text-sm sm:text-base">
            <p>
              一方で、手軽な無料・格安の英語アプリを試してみると、その多くは「単語を暗記する」「クイズに答える」といったインプット中心の学習がメインでした。
            </p>
            <p>
              もちろん単語を覚えることも大切ですが、本当に欲しかったのは<strong>「毎日実際に自分の声を出して英語を喋るきっかけ」</strong>でした。
            </p>
            <p>
              語学を身につける一番の近道は、声に出して耳と口と体に馴染ませること。いくら頭で知っていても、発話していなければいざという時に声は出てきません。
            </p>
          </div>
        </section>

        {/* Story Section 3 */}
        <section className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 border-l-4 border-indigo-500 pl-3">
            3. 自分に関わる英語が自動で届く。だから「ShadowLog」を作った
          </h2>
          <div className="text-slate-300 leading-relaxed space-y-4 text-sm sm:text-base">
            <p>
              「高額な費用をかけずに、社会人が毎日無理なく英語を口に出せる場所を作りたい」——その想いからShadowLogの開発をスタートしました。
            </p>

            <div className="p-6 rounded-2xl bg-slate-950 border border-indigo-500/30 space-y-4">
              <h3 className="font-bold text-indigo-300 flex items-center gap-2 text-base">
                <Sparkles className="w-5 h-5 text-amber-400" />
                ShadowLogが大切にしている3つのこだわり
              </h3>
              <ul className="space-y-3 text-xs sm:text-sm">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">自分に関わる業界・興味に合わせた英文生成</strong>
                    <p className="text-slate-400 mt-0.5">IT・ビジネス・マーケティング・日常会話など、自分が関わる範囲のフレーズがAIによって最適化されて生成されます。</p>
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">Whisper AIによる即時発音・単語可視化</strong>
                    <p className="text-slate-400 mt-0.5">言えなかった単語や脱落した音覚えが瞬時に色の差分（Diff）で表示され、その場で改善できます。</p>
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">自分専用のカルテ・得意不得意の記録</strong>
                    <p className="text-slate-400 mt-0.5">発話のスピード（WPM）や苦手な単語が自動蓄積され、振り返りが簡単に行えます。</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Story Section 4 / Wish */}
        <section className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 border-l-4 border-indigo-500 pl-3">
            4. 開発者に込めた願い
          </h2>
          <div className="text-slate-300 leading-relaxed space-y-4 text-sm sm:text-base">
            <p>
              英語学習で一番難しいのは「続けること」です。
            </p>
            <p>
              忙しい毎日のなかで、1日たった3分でも5分でもいい。ShadowLogを開いて声を出し、「今日も英語を喋ったぞ」という小さな達成感を積み重ねてほしいと思っています。
            </p>
            <p>
              自分の声で練習し、苦手な部分を記録し、少しずつ口と体に馴染ませていく——。ShadowLogが、あなたの英語学習の『最初で最高のきっかけ』になれたら、これ以上の喜びはありません。
            </p>

            {/* Call to Action Box */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-950 to-slate-950 border border-indigo-500/40 text-center space-y-4 mt-8">
              <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold inline-block">
                登録不要・ブラウザで今すぐ試せます
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-white">
                今日から「英語を口に出す習慣」を始めてみませんか？
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
                PC・スマホどちらでも、マイクをオンにするだけで一発で声を録音＆分析できます。
              </p>
              <Link
                href="/practice"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition shadow-lg shadow-indigo-600/30"
              >
                <span>ShadowLogを無料体験する</span>
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
