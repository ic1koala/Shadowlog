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
  AlertTriangle,
} from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";

export const metadata: Metadata = {
  title: "「英語の聞き流し」はなぜ効果が薄いのか？脳科学（音韻ループ理論）が明かす真実 | ShadowLog公式ブログ",
  description:
    "洋楽や英語ニュースをBGMのように聞き流しても英語が話せるようにならないのはなぜ？認知心理学のアラン・バドリー（Alan Baddeley）教授による「音韻ループ理論」とワーキングメモリの仕組みから、科学的に正しいリスニング上達法を解説。",
  keywords: [
    "英語 聞き流し 効果ない",
    "英語 聞き流し 意味ない",
    "音韻ループ 英語",
    "ワーキングメモリ 英語学習",
    "シャドーイング 効果",
    "ShadowLog ブログ",
  ],
  openGraph: {
    title: "「英語の聞き流し」はなぜ効果が薄いのか？脳科学（音韻ループ理論）が明かす真実",
    description: "聞き流し学習で英語が上達しない脳科学的理由。音韻ループ理論から導く、本当に効果の出るアクティブ・リスニング法。",
    type: "article",
    publishedTime: "2026-10-27T00:00:00Z",
  },
};

export default function WhyPassiveListeningFailsBlogPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: "「英語の聞き流し」はなぜ効果が薄いのか？脳科学（音韻ループ理論）が明かす真実",
    description:
      "洋楽や英語ニュースをBGMのように聞き流しても英語が話せるようにならないのはなぜ？認知心理学のアラン・バドリー（Alan Baddeley）教授による「音韻ループ理論」とワーキングメモリの仕組みから、科学的に正しいリスニング上達法を解説。",
    datePublished: "2026-10-27T00:00:00Z",
    dateModified: "2026-10-27T00:00:00Z",
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
              脳科学 ＆ 記憶理論
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
              ワーキングメモリ・認知心理学
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              読了目安 5分
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400">2026.10.27 公開</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight">
            「英語の聞き流し」はなぜ効果が薄いのか？脳科学（音韻ループ理論）が明かす真実
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            「通勤中に英語ポッドキャストをずっと流しているのに、数ヶ月経っても全く聞き取れるようにならない…」
            多くの英語学習者が一度は経験するこの挫折。
            実は、人間の脳には「受動的に耳に入るだけの音」を自動的に遮断・忘却する強力なフィルターが存在します。
            認知心理学の金字塔であるバドリーの「ワーキングメモリ理論」をもとに、聞き流しの限界と真のリスニング突破口を解き明かします。
          </p>
        </header>

        {/* Article Body */}
        <article className="py-8 space-y-10 text-slate-300 text-sm sm:text-base leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 border-l-4 border-indigo-500 pl-3">
              <AlertTriangle className="w-6 h-6 text-amber-400" />
              1. 「赤ちゃんが言葉を覚えるように」の致命的な誤解
            </h2>
            <p>
              「赤ちゃんは親の言葉を聞き流しているだけで自然と言葉を覚える。だから大人も英語シャワーを浴びればペラペラになるはずだ」という言説を耳にしたことがあるかもしれません。
            </p>
            <p>
              しかし、第二言語習得論（SLA）において、これは<strong>大人の脳のメカニズムを無視した最大の誤解</strong>とされています。
            </p>
            <ul className="space-y-2 list-disc list-inside text-slate-400 pl-2">
              <li>乳幼児は「表情・指差し・感情・触覚」などの膨大な身体的コンテキストとセットで言葉を結びつけている</li>
              <li>すでに母語（日本語）の強固な文法・音韻体系が完成している大人の脳は、意味の分からない未知の外国語を「環境音（ホワイトノイズ）」と同等に処理してしまう</li>
            </ul>
            <p>
              言語学者スティーブン・クラッシェン（Stephen Krashen）の有名な「インプット仮説」でも、言語習得に寄与するのは単なるインプットではなく、<strong>「構造や意味を理解できるインプット（Comprehensible Input: i+1）」</strong>だけであると厳格に定義されています。
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 border-l-4 border-indigo-500 pl-3">
              <Brain className="w-6 h-6 text-indigo-400" />
              2. 脳の作業机「音韻ループ（Phonological Loop）」の仕組み
            </h2>
            <p>
              なぜ理解できない音は記憶に残らないのでしょうか？
              英国の認知心理学者アラン・バドリー（Alan Baddeley）が提唱した「ワーキングメモリ（作業記憶）モデル」がその答えを与えてくれます。
            </p>

            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 my-4">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                音韻ループの2大構成要素
              </h3>
              <div className="space-y-3 text-sm text-slate-400">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="font-bold text-indigo-300 block mb-1">① 音韻短期貯蔵庫（Phonological Store）</span>
                  耳から入った音声を「約1.5〜2秒間」だけ一時的に保持する脳のバッファ。何もしなければ2秒で完全に消滅します。
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="font-bold text-emerald-300 block mb-1">② 調音リハーサル機能（Articulatory Rehearsal Process）</span>
                  脳内で心の中でつぶやいたり（内言語）、実際に口を動かして発声することで、音声を再び貯蔵庫へ戻し「長期記憶」へと送る循環システム。
                </div>
              </div>
            </div>

            <p>
              聞き流しをしている時、脳内では「①音韻短期貯蔵庫」に音が入るものの、<strong>「②調音リハーサル（口で真似する・頭で反芻する）」が一切行われません</strong>。
            </p>
            <p>
              その結果、入ってきた英語音声は<strong>わずか2秒で脳から跡形もなく消え去る</strong>のです。1日何時間聞き流しても、脳にとっては「カフェのBGM」を聴き続けているのと何ら変わりがありません。
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 border-l-4 border-indigo-500 pl-3">
              <Zap className="w-6 h-6 text-indigo-400" />
              3. 「発音できない音」は脳にとって雑音と同じ
            </h2>
            <p>
              脳科学の研究において、言語理解の根幹をなす法則があります。それは、<strong>「人間は自分が正確に調音（発音）できる音しか、無意識に知覚・弁別できない」</strong>ということです。
            </p>
            <p>
              例えば、日本語には「L」と「R」、「B」と「V」、「S」と「TH」の区別がありません。
              舌や唇の位置を意識して自ら発音する訓練をしていない学習者にとって、これらはすべて同一のあやふやな音に聞こえます。
            </p>
            <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/20 text-indigo-200 text-sm">
              💡 <strong>結論：耳を鍛える最短ルートは「口を動かすこと」</strong><br />
              リスニング力とは「耳の良さ」ではなく、「口の筋肉（調音運動）と脳内辞書の同期精度」なのです。
            </div>
          </section>

          {/* Section 4 */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 border-l-4 border-indigo-500 pl-3">
              <BookOpen className="w-6 h-6 text-indigo-400" />
              4. 聞き流しを「10倍の効果」に変えるアクティブ・リスニングの3手順
            </h2>
            <p>
              受動的な聞き流しから脱却し、ワーキングメモリをフル稼働させて脳に英語を焼き付ける3つの具体的手順をご紹介します。
            </p>

            <ul className="space-y-4 my-4">
              <li className="flex items-start gap-3 p-4 rounded-xl bg-slate-950 border border-slate-800">
                <span className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                  1
                </span>
                <div className="space-y-1">
                  <strong className="text-white text-base">短文（1〜2文・15語程度）に絞る</strong>
                  <p className="text-xs sm:text-sm text-slate-400">
                    長時間のポッドキャストではなく、ワーキングメモリの許容量（15〜20語）に収まる短いセンテンスを対象にします。
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-3 p-4 rounded-xl bg-slate-950 border border-slate-800">
                <span className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                  2
                </span>
                <div className="space-y-1">
                  <strong className="text-white text-base">0.5秒遅れで即座にシャドーイング（口から出す）</strong>
                  <p className="text-xs sm:text-sm text-slate-400">
                    音声を聴いた瞬間、調音リハーサルを起動して口から音を再現します。声を出せない電車内なら「口パク（サイレント）」でも同等の神経回路が働きます。
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-3 p-4 rounded-xl bg-slate-950 border border-slate-800">
                <span className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                  3
                </span>
                <div className="space-y-1">
                  <strong className="text-white text-base">即時フィードバックで「ズレ」を修正する</strong>
                  <p className="text-xs sm:text-sm text-slate-400">
                    自分が発音した音とモデル音声のズレ（噛んだ単語、リンキングの失敗）をその場で可視化し、脳の予測誤差を修正します。
                  </p>
                </div>
              </li>
            </ul>
          </section>

          {/* Section 5: Practical Action */}
          <section className="space-y-4 p-5 rounded-2xl bg-indigo-950/30 border border-indigo-500/30">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              1回30秒！AIで「あなたの発話スピード（WPM）」を客観診断
            </h2>
            <p className="text-sm text-slate-300">
              「英語を聞き流すだけ」の受け身な勉強から、「自分の声を出してAIで即時チェックする」能動的な勉強へ切り替えてみませんか？
            </p>
            <p className="text-sm text-slate-300">
              ShadowLogでは、スマホのマイクに向かって30秒英文を吹き込むだけで、あなたの現在の発話速度（WPM）と発音の明瞭度をAIが即座に無料測定します。
            </p>
            <div className="pt-2">
              <Link
                href="/diagnosis"
                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition"
              >
                <span>30秒無料AI発話診断を試してみる</span>
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
                声を出して英語耳を鍛える。毎日1分のAIフィードバックで挫折しない習慣を。
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
