import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Award, Layers, Sparkles, Calendar, Clock } from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { SCHEDULED_ARTICLES } from "@/lib/blog/scheduled-articles";

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

interface ArticleItem {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  displayDate: string;
  readTime: string;
  category: string;
  tags: string[];
  isFeatured?: boolean;
}

const STATIC_ARTICLES: ArticleItem[] = [
  {
    slug: "release-story-why-i-built-shadowlog",
    title: "【祝・正式リリース】月2万円のスクールに挫折した社会人が、AIシャドーイング「ShadowLog」を開発した理由と開発秘話",
    description:
      "2026年11月、ShadowLogが待望の正式ローンチ！「月2万円のスクールは高すぎて続かない」「仕事で英語を話す機会ゼロ」という悔しさからスタートした個人開発の舞台裏と、挫折を防ぐプロダクト設計の全貌。",
    publishedAt: "2026-11-01T06:00:00+09:00",
    displayDate: "2026.11.01",
    readTime: "6分",
    category: "祝・正式リリース特別編",
    tags: ["正式リリース", "開発秘話", "個人開発", "シャドーイング習慣化"],
    isFeatured: true,
  },
  {
    slug: "busy-professional-micro-learning",
    title: "「忙しくて英語の勉強時間が取れない」社会人が毎日10分で成果を出すマイクロラーニング術",
    description:
      "仕事や家事で忙しい社会人が英語学習を習慣化するための科学的メソッド。エビングハウスの忘却曲線と分散学習効果、If-Thenプランニングを活用し、1日10分のスキマ時間で成果を出す方法を解説。",
    publishedAt: "2026-10-31T06:00:00+09:00",
    displayDate: "2026.10.31",
    readTime: "5分",
    category: "習慣化・生産性",
    tags: ["習慣化", "社会人英語", "マイクロラーニング", "分散学習"],
    isFeatured: false,
  },
  {
    slug: "stop-backward-translation-sight-translation",
    title: "英語を後ろから訳していませんか？「返り読み」を強制終了して英語脳を作る方法",
    description:
      "長文読解やTOEICリスニングで時間が足りなくなる最大の原因「返り読み」。同時通訳者の基本訓練法である「サイトトランスレーション」と「チャンク・シャドーイング」を組み合わせ、語順のまま理解する技術を解説。",
    publishedAt: "2026-10-29T06:00:00+09:00",
    displayDate: "2026.10.29",
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
    publishedAt: "2026-10-27T06:00:00+09:00",
    displayDate: "2026.10.27",
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
    publishedAt: "2026-10-25T06:00:00+09:00",
    displayDate: "2026.10.25",
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
    publishedAt: "2026-10-24T06:00:00+09:00",
    displayDate: "2026.10.24",
    readTime: "5分",
    category: "メソッド・新機能",
    tags: ["習慣化", "スキマ特訓", "論文・IR解析", "Pro新機能"],
    isFeatured: false,
  },
];

// Combine static articles with scheduled future articles
const ALL_COMBINED_ARTICLES: ArticleItem[] = [
  ...SCHEDULED_ARTICLES.map((item) => ({
    slug: item.slug,
    title: item.title,
    description: item.description,
    publishedAt: item.publishedAt,
    displayDate: item.publishedAt.slice(0, 10).replace(/-/g, "."),
    readTime: item.readTime,
    category: item.category,
    tags: item.tags,
    isFeatured: false,
  })),
  ...STATIC_ARTICLES,
].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

export default function BlogIndexPage() {
  const now = new Date();

  // Articles that are already live
  const publishedArticles = ALL_COMBINED_ARTICLES.filter(
    (a) => new Date(a.publishedAt) <= now
  );

  // Articles scheduled for future release
  const upcomingArticles = ALL_COMBINED_ARTICLES.filter(
    (a) => new Date(a.publishedAt) > now
  ).reverse(); // show nearest first

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
          <span>英語学習＆AIシャドーイング知恵袋（2日に1回更新中）</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight">
          ShadowLog <span className="text-indigo-400">公式ブログ</span>
        </h1>

        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
          第二言語習得論（SLA）と認知脳科学のエビデンスに基づき、
          英語リスニングの壁を突破し、最短で英語脳を作る実践ノウハウをお届けします。
        </p>
      </section>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pb-20 space-y-16">
        {/* Published Articles List */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <span>最新公開記事</span>
            </h2>
            <span className="text-xs text-slate-500">{publishedArticles.length} 件の記事</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {publishedArticles.map((article) => (
              <article
                key={article.slug}
                className="group p-6 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-950 transition flex flex-col justify-between space-y-4 shadow-sm"
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-bold">
                      {article.category}
                    </span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {article.readTime}
                    </span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-400">{article.displayDate}</span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-indigo-300 transition leading-snug">
                    <Link href={`/blog/${article.slug}`}>{article.title}</Link>
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-400 line-clamp-3 leading-relaxed">
                    {article.description}
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-800/60 text-xs">
                  <div className="flex flex-wrap gap-1.5">
                    {article.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="text-slate-500">
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <Link
                    href={`/blog/${article.slug}`}
                    className="inline-flex items-center gap-1 text-indigo-400 font-semibold group-hover:translate-x-1 transition"
                  >
                    <span>読む</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Scheduled / Upcoming Articles Section */}
        {upcomingArticles.length > 0 && (
          <section className="space-y-6 pt-6 border-t border-slate-800/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-amber-400" />
                  <span>公開予約スケジュール（11月予定記事）</span>
                </h2>
                <p className="text-xs text-slate-400">
                  2日に1回のペースで順次本公開されます。（先行プレビュー可能）
                </p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-semibold self-start sm:self-auto">
                予約中 {upcomingArticles.length} 本
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingArticles.map((article) => (
                <div
                  key={article.slug}
                  className="p-5 rounded-xl bg-slate-950/40 border border-slate-800/80 hover:border-amber-500/40 transition flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-amber-400 font-bold flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {article.displayDate} 公開
                      </span>
                      <span className="text-slate-500 text-[11px]">{article.readTime}</span>
                    </div>
                    <h3 className="font-bold text-sm text-slate-200 hover:text-amber-300 transition line-clamp-2">
                      <Link href={`/blog/${article.slug}`}>{article.title}</Link>
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {article.description}
                    </p>
                  </div>
                  <div className="pt-2 flex items-center justify-between border-t border-slate-800/50 text-[11px]">
                    <span className="text-slate-500">{article.category}</span>
                    <Link
                      href={`/blog/${article.slug}`}
                      className="text-amber-400/90 hover:text-amber-300 font-semibold flex items-center gap-1"
                    >
                      <span>先行確認</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
