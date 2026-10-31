import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Sparkles,
  ArrowRight,
  Clock,
  ChevronLeft,
  BookOpen,
  Calendar,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { SCHEDULED_ARTICLES, BlogArticleData } from "@/lib/blog/scheduled-articles";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return SCHEDULED_ARTICLES.map((article) => ({
    slug: article.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = SCHEDULED_ARTICLES.find((a) => a.slug === slug);

  if (!article) {
    return {
      title: "記事が見つかりません | ShadowLog公式ブログ",
    };
  }

  return {
    title: `${article.title} | ShadowLog公式ブログ`,
    description: article.description,
    keywords: [...article.keywords, "ShadowLog ブログ", "英語学習", "シャドーイング"],
    openGraph: {
      title: article.title,
      description: article.description,
      type: "article",
      publishedTime: article.publishedAt,
    },
  };
}

export default async function DynamicScheduledBlogPage({ params }: PageProps) {
  const { slug } = await params;
  const article = SCHEDULED_ARTICLES.find((a) => a.slug === slug);

  if (!article) {
    notFound();
  }

  const isFuturePost = new Date(article.publishedAt) > new Date();
  const formattedDate = new Date(article.publishedAt).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tokyo",
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    description: article.description,
    datePublished: article.publishedAt,
    dateModified: article.publishedAt,
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
              {article.category}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        {/* Reservation Banner if future post */}
        {isFuturePost && (
          <div className="mb-6 p-4 rounded-xl bg-amber-950/30 border border-amber-500/30 flex items-center gap-3 text-xs sm:text-sm text-amber-200">
            <Calendar className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <span className="font-bold">【予約公開中】</span> この記事は <strong>{formattedDate} JST</strong> に本公開予定です。（先行プレビュー中）
            </div>
          </div>
        )}

        {/* Article Header */}
        <header className="space-y-4 border-b border-slate-800 pb-8">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-bold">
              {article.category}
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              読了目安 {article.readTime}
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400">{formattedDate} 公開</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight">
            {article.title}
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            {article.description}
          </p>

          {/* Academic Evidence Badge */}
          {article.evidence && (
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-2.5 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-300 font-semibold">参照文献・学術的エビデンス：</strong>
                <p className="mt-0.5 text-slate-400">{article.evidence}</p>
              </div>
            </div>
          )}
        </header>

        {/* Article Body */}
        <article className="py-8 space-y-10 text-slate-300 text-sm sm:text-base leading-relaxed">
          {article.sections.map((sec, idx) => (
            <section key={idx} className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 border-l-4 border-indigo-500 pl-3">
                <BookOpen className="w-5 h-5 text-indigo-400 shrink-0" />
                <span>{sec.heading}</span>
              </h2>
              {sec.paragraphs.map((p, pIdx) => (
                <p key={pIdx} className="whitespace-pre-line">
                  {p}
                </p>
              ))}
            </section>
          ))}

          {/* Action Tip Box */}
          {article.actionTip && (
            <section className="space-y-4 p-5 rounded-2xl bg-indigo-950/30 border border-indigo-500/30">
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                {article.actionTip.title}
              </h2>
              <p className="text-sm text-slate-300 whitespace-pre-line">
                {article.actionTip.description}
              </p>
              {article.actionTip.points && (
                <ul className="space-y-2 text-xs sm:text-sm text-slate-300 list-disc list-inside">
                  {article.actionTip.points.map((pt, ptIdx) => (
                    <li key={ptIdx}>{pt}</li>
                  ))}
                </ul>
              )}
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/diagnosis"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition text-center"
                >
                  <span>30秒無料AI発話診断を試す</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/practice"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm border border-slate-700 transition text-center"
                >
                  <span>無料体験で練習する</span>
                </Link>
              </div>
            </section>
          )}
        </article>

        {/* Article Footer & Navigation */}
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
