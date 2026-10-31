import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Award, Layers } from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";

export const metadata: Metadata = {
  title: "ShadowLog 公式ブログ | 英語シャドーイング・WPM向上・AI英語学習ノウハウ",
  description:
    "英語リスニング力を短期間で引き上げるシャドーイングの実践法、WPM（1分間のワード数）向上の極意、Whisper AIを使った語学学習法を解説するShadowLog公式ブログ。",
  keywords: [
    "英語 シャドーイング ブログ",
    "WPM 測り方",
    "シャドーイング コツ",
    "ShadowLog ブログ",
    "英語学習 AI",
    "シャドテン 比較",
  ],
  openGraph: {
    title: "ShadowLog 公式ブログ | 英語シャドーイング・WPM向上ノウハウ",
    description: "AIを活用した効率的英語シャドーイングのコツとWPM向上ノウハウを公開中。",
    type: "website",
  },
};

const ARTICLES = [
  {
    slug: "busy-professional-micro-learning",
    title: "「忙しくて英語の勉強時間が取れない」社会人が毎日10分で成果を出すマイクロラーニング術",
    description:
      "仕事や家事で忙しい社会人が英語学習を習慣化するための科学的メソッド。エビングハウスの忘却曲線と分散学習効果、If-Thenプランニングを活用し、1日10分のスキマ時間で成果を出す方法を解説。",
    date: "2026.10.31",
    readTime: "5分",
    category: "習慣化・生産性",
    tags: ["習慣化", "社会人英語", "マイクロラーニング", "分散学習"],
    isFeatured: true,
  },
  {
    slug: "stop-backward-translation-sight-translation",
    title: "英語を後ろから訳していませんか？「返り読み」を強制終了して英語脳を作る方法",
    description:
      "長文読解やTOEICリスニングで時間が足りなくなる最大の原因「返り読み」。同時通訳者の基本訓練法である「サイトトランスレーション」と「チャンク・シャドーイング」を組み合わせ、語順のまま理解する技術を解説。",
    date: "2026.10.29",
    readTime: "5分",
    category: "リーディング・リスニング",
    tags: ["返り読み", "サイトトランスレーション", "チャンク", "英語脳"],
    isFeatured: false,
  },
  {
    slug: "why-passive-listening-fails",
    title: "「英語の聞き流し」はなぜ効果が薄いのか？脳科学（音韻ループ理論）が明かす真実",
    description:
      "洋楽や英語ニュースをBGMのように聞き流しても英語が話せるようにならないのはなぜ？アラン・バドリー教授による「音韻ループ理論」とワーキングメモリの仕組みから、本当に効果の出るアクティブ・リスニング法を解説。",
    date: "2026.10.27",
    readTime: "5分",
    category: "脳科学・記憶理論",
    tags: ["聞き流し", "音韻ループ", "ワーキングメモリ", "シャドーイング"],
    isFeatured: false,
  },
  {
    slug: "why-listening-is-hard-speech-perception",
    title: "なぜ知っている単語なのに聞き取れないのか？英語リスニングの壁を壊す「音声知覚」の正体",
    description:
      "英文を文字で見ると中学レベルなのに、ネイティブが喋ると一瞬で置いていかれる理由とは？第二言語習得論（SLA）の「音声知覚と意味理解の二段階処理モデル」をもとに、リスニングの壁を突破する科学的シャドーイング法を解説。",
    date: "2026.10.25",
    readTime: "5分",
    category: "リスニング科学",
    tags: ["リスニング", "音声知覚", "第二言語習得論", "ワーキングメモリ"],
    isFeatured: false,
  },
  {
    slug: "hybrid-shadowing-pro-features",
    title: "【満員電車のスキマ特訓×夜の声出し】社会人の挫折を防ぐ新しい英語習慣と、論文・IR記事から「自分専用の教材」を作る方法",
    description:
      "仕事で英語を話す機会がない社会人が無理なく毎日英語を口に出すためのハイブリッド学習法。電車内Silent Drillと夜のAIシャドーイング、さらに論文・IR記事から実践英語を生み出す新機能を解説。",
    date: "2026.10.24",
    readTime: "5分",
    category: "メソッド・新機能",
    tags: ["習慣化", "スキマ特訓", "論文・IR解析", "Pro新機能"],
    isFeatured: false,
  },
  {
    slug: "why-i-built-shadowlog",
    title: "社会人が英語を口に出す「きっかけ」を作るために。ShadowLogを開発した理由",
    description:
      "仕事で英語を使わない日常の中で、どうすれば毎日声を出す習慣を作れるか？開発者自身が感じた課題と、自分専用の英文で喋るShadowLogに込めた想いを語ります。",
    date: "2026.04.01",
    readTime: "4分",
    category: "開発ストーリー",
    tags: ["開発秘話", "習慣化", "社会人英語"],
    isFeatured: false,
  },
  {
    slug: "wpm-guide",
    title: "【2026年最新】チャンクとは？WPM向上のための英語シャドーイング実践ガイド",
    description:
      "単語単位のブツ切りリスニングを脱却！チャンク（意味の塊）処理能力を高め、ネイティブスピードに追いつくための実践的AIシャドーイング手順を解説。",
    date: "2026.03.25",
    readTime: "5分",
    category: "ノウハウ",
    tags: ["チャンク", "WPM", "シャドーイング"],
    isFeatured: false,
  },
];

export default function BlogIndexPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group hover:opacity-90 transition">
            <BrandLogo size="md" inverted priority />
            <span className="text-xs text-slate-400 font-semibold ml-1 px-1.5 py-0.5 rounded-md bg-slate-800 border border-slate-700">
              BLOG
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/compare/shadoten"
              className="text-xs sm:text-sm font-semibold text-slate-300 hover:text-white transition hidden sm:inline-block"
            >
              シャドテン比較
            </Link>
            <Link
              href="/practice"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm transition shadow-lg shadow-indigo-600/30 flex items-center gap-1.5"
            >
              <span>今すぐ無料で試す</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-14 px-4 sm:px-6 text-center max-w-4xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-bold">
          <BookOpen className="w-4 h-4 text-indigo-400" />
          <span>英語学習＆AIシャドーイング知恵袋</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight">
          ShadowLog <span className="text-indigo-400">公式ブログ</span>
        </h1>
        <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
          WPM（発話・聴解スピード）の改善法から音の連結（リンキング）克服、最新Whisper AIを活用した科学的英語トレまで最新情報をお届けします。
        </p>
      </section>

      {/* Article Grid Section */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pb-20 space-y-12">
        {/* Featured Article Card */}
        {ARTICLES.filter((a) => a.isFeatured).map((article) => (
          <div
            key={article.slug}
            className="p-6 sm:p-8 rounded-3xl bg-slate-950 border border-indigo-500/30 shadow-2xl relative overflow-hidden flex flex-col md:flex-row gap-6 items-center"
          >
            <div className="w-full md:w-1/3 aspect-video bg-gradient-to-br from-indigo-900 to-slate-900 rounded-2xl flex flex-col items-center justify-center p-6 border border-indigo-500/20 text-center">
              <Layers className="w-12 h-12 text-indigo-400 mb-2 animate-pulse" />
              <span className="text-xs font-bold text-indigo-300">WPM & チャンク解説</span>
              <span className="text-[10px] text-slate-400 mt-1">ピックアップ記事</span>
            </div>

            <div className="w-full md:w-2/3 space-y-3">
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2.5 py-0.5 rounded-md bg-indigo-600 text-white font-bold">
                  {article.category}
                </span>
                <span className="text-slate-400">{article.date}</span>
                <span className="text-slate-400">• 約{article.readTime}</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-white leading-snug hover:text-indigo-400 transition">
                <Link href={`/blog/${article.slug}`}>{article.title}</Link>
              </h2>

              <p className="text-slate-300 text-sm leading-relaxed line-clamp-3">
                {article.description}
              </p>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  {article.tags.map((tag) => (
                    <span key={tag} className="text-[11px] text-indigo-300 bg-indigo-950/60 px-2 py-1 rounded-md border border-indigo-800/40">
                      #{tag}
                    </span>
                  ))}
                </div>

                <Link
                  href={`/blog/${article.slug}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition"
                >
                  <span>続きを読む</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        ))}

        {/* Compare LP Link Section */}
        <section className="p-6 sm:p-8 rounded-3xl bg-slate-950/80 border border-slate-800 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
            <Award className="w-6 h-6" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white">
            他社サービスとの違いをお探しですか？
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
            シャドテン（月額21,780円）とShadowLog（月額500円〜（Pro 1,000円））の料金・即時AI判定・WPM計測機能の徹底比較ガイドをご用意しています。
          </p>
          <Link
            href="/compare/shadoten"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm transition border border-slate-700"
          >
            <span>シャドテン vs ShadowLog 比較記事を読む</span>
            <ArrowRight className="w-4 h-4 text-indigo-400" />
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-8 text-center text-xs text-slate-400">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
            <Link href="/" className="hover:text-white">ShadowLog ホーム</Link>
            <span>•</span>
            <Link href="/compare/shadoten" className="hover:text-white">シャドテン比較</Link>
            <span>•</span>
            <Link href="/practice" className="hover:text-white">練習アプリ</Link>
          </div>
          <p>© {new Date().getFullYear()} ShadowLog Blog. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
