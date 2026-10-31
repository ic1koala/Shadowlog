import type { Metadata } from "next";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  Clock,
  CheckCircle2,
  ChevronLeft,
  ArrowRightCircle,
  Brain,
  Zap,
  BookOpen,
} from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";

export const metadata: Metadata = {
  title: "英語を後ろから訳していませんか？「返り読み」を強制終了して英語脳を作る方法 | ShadowLog公式ブログ",
  description:
    "長文読解やTOEICリスニングで時間が足りなくなる最大の原因「返り読み」。同時通訳者の基本訓練法である「サイトトランスレーション」と「チャンク・シャドーイング」を組み合わせ、頭の中で日本語訳せず英語の語順のまま理解する技術を解説。",
  keywords: [
    "英語 返り読み やめる方法",
    "英語 語順のまま理解",
    "サイトトランスレーション コツ",
    "チャンクリーディング 英語",
    "英語脳 作り方",
    "ShadowLog ブログ",
  ],
  openGraph: {
    title: "英語を後ろから訳していませんか？「返り読み」を強制終了して英語脳を作る方法",
    description: "返り読みを脱却し、英語を英語の語順のまま理解するスラッシュ×シャドーイング訓練法。",
    type: "article",
    publishedTime: "2026-10-29T00:00:00Z",
  },
};

export default function StopBackwardTranslationBlogPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: "英語を後ろから訳していませんか？「返り読み」を強制終了して英語脳を作る方法",
    description:
      "長文読解やTOEICリスニングで時間が足りなくなる最大の原因「返り読み」。同時通訳者の基本訓練法である「サイトトランスレーション」と「チャンク・シャドーイング」を組み合わせ、頭の中で日本語訳せず英語の語順のまま理解する技術を解説。",
    datePublished: "2026-10-29T00:00:00Z",
    dateModified: "2026-10-29T00:00:00Z",
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
              リーディング ＆ リスニング
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
              語順処理・サイトトランスレーション
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              読了目安 5分
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400">2026.10.29 公開</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight">
            英語を後ろから訳していませんか？「返り読み」を強制終了して英語脳を作る方法
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            TOEICのリーディングPart 7で最後まで解き切れず塗り絵になってしまう。
            リスニングでも、文の半分を過ぎたあたりで頭の中の日本語訳が追いつかなくなる——。
            これらの原因はすべて、英文を後ろから前に戻って訳す「返り読み」にあります。
            同時通訳者が実践する「サイトトランスレーション」の技術を使って、左から右へ英語の語順のまま理解する回路を構築しましょう。
          </p>
        </header>

        {/* Article Body */}
        <article className="py-8 space-y-10 text-slate-300 text-sm sm:text-base leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 border-l-4 border-indigo-500 pl-3">
              <ArrowRightCircle className="w-6 h-6 text-indigo-400" />
              1. 日本人の脳を縛る「返り読み」の罠
            </h2>
            <p>
              英語と日本語は、言語学的に「語順の構造」が正反対です。
            </p>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-sm font-mono">
              <div className="text-slate-400">英語: ［主語］➔［動詞］➔［目的語］➔［修飾語］</div>
              <div className="text-indigo-300">日本語: ［主語］➔［修飾語］➔［目的語］➔［動詞］</div>
            </div>
            <p>
              学校教育で長年「綺麗な日本語に直す英文和訳」を繰り返してきた結果、多くの学習者は英文を読んだり聴いたりした際、無意識に後ろの修飾節から前に戻って訳す癖がついてしまっています。
            </p>
            <p>
              目で読むリーディングなら「視線を戻す」ことができますが、<strong>音声が容赦なく流れていくリスニングでは返り読みは即座にクラッシュを引き起こします</strong>。ネイティブの話す150〜180 WPMという速度に、後ろから訳す日本語処理が追いつくことは物理的に不可能なのです。
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 border-l-4 border-indigo-500 pl-3">
              <Brain className="w-6 h-6 text-indigo-400" />
              2. 解決の鍵：チャンク（意味の塊）とスラッシュリーディング
            </h2>
            <p>
              返り読みを断ち切る唯一の方法は、<strong>「意味の最小単位（チャンク）」でスラッシュ（/）を入れて区切り、左から右へと流れるままに理解すること</strong>です。
            </p>

            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 my-4">
              <h3 className="font-bold text-white text-base">具体例で比較する頭の中の処理</h3>
              <div className="space-y-3 text-sm">
                <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-500/20 text-rose-200">
                  <span className="font-bold block mb-1">❌ 返り読み（NG）:</span>
                  &quot;I received an email from the client explaining the new project requirements yesterday.&quot;<br />
                  ➔ 「昨日、新しいプロジェクトの要件を説明しているメールをクライアントから受け取った」と後ろから日本語を組み立て直す。
                </div>
                <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-emerald-200">
                  <span className="font-bold block mb-1">⭕ チャンク処理（サイトトランスレーション）:</span>
                  &quot;I received an email / from the client / explaining the new project requirements / yesterday.&quot;<br />
                  ➔ 「メールを受け取った / クライアントから / 新しいプロジェクト要件を説明している / 昨日」
                </div>
              </div>
            </div>

            <p>
              このように、日本語の文法として完璧な文を作るのではなく、<strong>「誰が・どうした ➔ どこから ➔ どんな内容 ➔ いつ」と情報が付け足される順番のまま脳に情景を描く</strong>のが「英語脳」の正体です。
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 border-l-4 border-indigo-500 pl-3">
              <Zap className="w-6 h-6 text-indigo-400" />
              3. シャドーイングが「返り読み」を強制終了させる理由
            </h2>
            <p>
              頭では「左から右へ読もう」と意識していても、紙や画面のテキストを見ていると、ついつい視線が後ろへ戻ってしまうことがあります。
            </p>
            <p>
              そこで絶大な効果を発揮するのが<strong>「シャドーイング（音声追従発声）」</strong>です。
            </p>
            <ul className="space-y-3 my-4">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">物理的な不可逆性:</strong>
                  <span className="text-slate-400 text-sm block mt-0.5">
                    音声は0.5秒遅れで次々と先へ進むため、後ろへ戻って訳す時間が1ミリ秒も与えられません。脳は生き残るために、強制的に前からの理解に切り替えます。
                  </span>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">息継ぎ・ポーズの感覚化:</strong>
                  <span className="text-slate-400 text-sm block mt-0.5">
                    ネイティブが話す時の微細な間（ポーズ）は、まさにチャンクの切れ目です。シャドーイングでその息継ぎを真似することで、チャンクの境界線が直感的に身につきます。
                  </span>
                </div>
              </li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 border-l-4 border-indigo-500 pl-3">
              <BookOpen className="w-6 h-6 text-indigo-400" />
              4. 満員電車でもできる「語順パズル特訓（Silent Drill）」
            </h2>
            <p>
              「声を出せる環境ならシャドーイングができるけれど、通勤電車の中では声が出せない…」という方も多いはず。
            </p>
            <p>
              そこでおすすめなのが、<strong>チャンクごとにバラバラになった語群を、英語の語順通りに指先タップで並び替える「語順パズルトレーニング」</strong>です。
            </p>
            <p>
              「主語・動詞の骨格」➔「修飾情報」という英語のブロック組み立てを指先と視線で素早く反復することで、声を出せない環境でも返り読みしない脳の配線を鍛え上げることができます。
            </p>
          </section>

          {/* Section 5: Practical Action */}
          <section className="space-y-4 p-5 rounded-2xl bg-indigo-950/30 border border-indigo-500/30">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              ShadowLogの「チャンクスラッシュ機能」で語順マスターになろう
            </h2>
            <p className="text-sm text-slate-300">
              ShadowLogでは、すべての出題英文に視覚的な青い太字スラッシュ（`/`）を表示。ネイティブの息継ぎや意味の塊が一目で分かり、返り読みを物理的に防止します。
            </p>
            <p className="text-sm text-slate-300">
              さらに、電車内でも声を出さずに語順感覚を研ぎ澄ませる「Silent Drill（スキマ特訓）」も搭載。夜のリアル声出しと組み合わせることで、最短で英語脳が手に入ります。
            </p>
            <div className="pt-2">
              <Link
                href="/practice"
                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition"
              >
                <span>無料体験でチャンクシャドーイングを試す</span>
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
                返り読みを卒業し、英語を語順のまま理解する。毎日の1分AIトレーニング。
              </p>
            </div>
            <Link
              href="/diagnosis"
              className="px-5 py-2.5 rounded-xl bg-white text-slate-950 font-bold text-xs sm:text-sm hover:bg-slate-200 transition shrink-0"
            >
              無料WPM診断はこちら
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
