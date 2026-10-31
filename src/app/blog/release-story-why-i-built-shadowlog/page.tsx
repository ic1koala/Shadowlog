import type { Metadata } from "next";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  Clock,
  CheckCircle2,
  ChevronLeft,
  Heart,
  ShieldCheck,
  Zap,
  Rocket,
  MessageSquare,
} from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";

export const metadata: Metadata = {
  title: "【祝・正式リリース】月2万円のスクールに挫折した社会人が、AIシャドーイング「ShadowLog」を開発した理由と開発秘話 | ShadowLog公式ブログ",
  description:
    "2026年11月、AIシャドーイング習慣化アプリ「ShadowLog」が待望の正式ローンチ！「月2万円のスクールは高すぎて続かない」「仕事で英語を話す機会がゼロ」という自身の悔しさから個人開発をスタートした舞台裏と、挫折を防ぐプロダクト設計の全貌を語ります。",
  keywords: [
    "ShadowLog リリース",
    "英語アプリ 個人開発",
    "シャドーイング アプリ おすすめ",
    "シャドテン 高い 続かない",
    "社会人 英語 独学",
    "ShadowLog 開発秘話",
  ],
  openGraph: {
    title: "【祝・正式リリース】月2万円のスクールに挫折した社会人が、AIシャドーイング「ShadowLog」を開発した理由と開発秘話",
    description: "2026年11月正式ローンチ！月2万円のスクールに挫折した悔しさから生まれたAIシャドーイングアプリ「ShadowLog」誕生の軌跡。",
    type: "article",
    publishedTime: "2026-11-01T06:00:00+09:00",
  },
};

export default function ReleaseStoryBlogPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: "【祝・正式リリース】月2万円のスクールに挫折した社会人が、AIシャドーイング「ShadowLog」を開発した理由と開発秘話",
    description:
      "2026年11月、AIシャドーイング習慣化アプリ「ShadowLog」が待望の正式ローンチ！開発者自身の挫折から生まれた新時代の英語習慣。",
    datePublished: "2026-11-01T06:00:00+09:00",
    dateModified: "2026-11-01T06:00:00+09:00",
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
            <span className="text-xs text-amber-400 font-bold bg-amber-950/60 border border-amber-800/60 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Rocket className="w-3 h-3" />
              正式リリース記念
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        {/* Article Header */}
        <header className="space-y-4 border-b border-slate-800 pb-8">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              祝・11月正式ローンチ特別編
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              読了目安 6分
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400">2026.11.01 06:00 公開</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight">
            【祝・正式リリース】月2万円のスクールに挫折した社会人が、AIシャドーイング「ShadowLog」を開発した理由と開発秘話
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            本日、2026年11月1日。AIシャドーイング習慣化Webサービス「ShadowLog」を正式ローンチいたしました！
            数ヶ月間にわたるクローズドβテスト、Threadsでのロゴアニメーション総選挙、テスターの皆様からの熱いフィードバックを経て、ついに一般の皆様へお届けできる日を迎えました。
            なぜ一人の社会人が、既存の高額スクールでも大手英会話アプリでもなく、この「ShadowLog」をゼロから開発したのか？そのすべての舞台裏をお話しします。
          </p>
        </header>

        {/* Article Body */}
        <article className="py-8 space-y-10 text-slate-300 text-sm sm:text-base leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 border-l-4 border-amber-500 pl-3">
              <Heart className="w-6 h-6 text-rose-400" />
              1. 「英語を話す機会ゼロ」と「月2万円」の大きな壁
            </h2>
            <p>
              多くの社会人が抱えている共通のジレンマがあります。
            </p>
            <p>
              「仕事で英語を使えるようになりたい。TOEICの点数はそこそこ取れたけれど、いざ外国人を前にすると全く言葉が出てこないし、早口の英語が聞き取れない…」
            </p>
            <p>
              私自身もまったく同じでした。職場に外国人が常駐しているわけでもなく、日常会話で英語を口に出す機会は完全にゼロ。
              そこでリスニングとスピーキングの特効薬として有名な「シャドーイング添削サービス」を検討しました。
            </p>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-sm text-slate-300">
              <strong className="text-rose-400">ぶつかった最大の現実：月額 21,780 円（税込）。</strong><br />
              年間で約26万円。いくら人手による丁寧な添削があるとはいえ、普通のビジネスパーソンが毎月払い続けるにはあまりに高額すぎました。
              「お金をかけられない人は、独学で不安を抱えながらやるしかないのか？」という強い悔しさが、すべての開発の原点です。
            </div>
          </section>

          {/* Section 2 */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 border-l-4 border-indigo-500 pl-3">
              <Zap className="w-6 h-6 text-indigo-400" />
              2. 「人手添削の24時間待ち」vs「AIの0秒即時フィードバック」
            </h2>
            <p>
              人手による添削サービスにも素晴らしい価値があります。しかし、学習心理学の研究（Hattie & Timperley, 2007）では、<strong>「フィードバックは学習行動の直後であればあるほど学習効率が高い」</strong>ことが証明されています。
            </p>
            <p>
              夜に録音を提出して、翌日の夜（24時間後）に赤ペン添削が返ってきても、自分が「どんな口の動かし方をして噛んだのか」「どんな息継ぎをしたのか」の感覚はすでに薄れてしまっています。
            </p>
            <p>
              「OpenAIのWhisper音声認識やMicrosoft Azure AIの音響波形解析エンジンを活用すれば、<strong>吹き込んだ瞬間に0秒で発音・WPM・弱点単語を可視化できるのではないか？</strong>」
            </p>
            <p>
              この仮説を検証するために開発したプロトタイプは、想像以上の精度を発揮しました。
              ネイティブの音響波形と直接照合することで、L/Rのズレや音の脱落（リダクション）を瞬時にハイライト。人手を介さないため、<strong>月額わずか500円〜1,000円という圧倒的な低価格</strong>で使い放題の環境が実現したのです。
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 border-l-4 border-indigo-500 pl-3">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
              3. 挫折を防ぐShadowLogの3大独自機能
            </h2>
            <p>
              「どんなに素晴らしい学習法でも、続けられなければ意味がない」。
              忙しい社会人が三日坊主にならないよう、ShadowLogには徹底的な習慣化設計を組み込みました。
            </p>

            <div className="space-y-4 my-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  ① 満員電車でもできる「サイレント特訓（Silent Drill）」
                </div>
                <p className="text-xs sm:text-sm text-slate-400">
                  「声を出せない通勤電車の中でも勉強したい」というテスターの声から生まれた語順パズル。親指タップだけで、返り読みをしない音速サイトトランスレーションが身につきます。
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  ② 3,600問の実践バンク ＆ 週10%自動ローテーション
                </div>
                <p className="text-xs sm:text-sm text-slate-400">
                  IT・ビジネス・マーケティング・日常会話の4大ジャンル×3難易度。毎週新しい英文が供給されるため、飽きずに一生続けられます。
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  ③ 光り輝く「ストリークスフィア（継続の球体）」
                </div>
                <p className="text-xs sm:text-sm text-slate-400">
                  日々の練習を重ねるごとに3Dの球体が光り輝き、成長が目に見えるビジュアル報酬システム。数字とグラフィックで「努力の可視化」を実現しました。
                </p>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 border-l-4 border-indigo-500 pl-3">
              <MessageSquare className="w-6 h-6 text-indigo-400" />
              4. クローズドβテスターの皆様への感謝
            </h2>
            <p>
              9月下旬からスタートしたクローズドβテストでは、毎日のように熱いバグレポートや機能提案をいただきました。
              「Bluetoothイヤホンの頭切れ防止機能」や「2ボタン（リピーティング／シャドーイング）切り替え」「チャンクスラッシュ表示」など、現在ShadowLogのコアとなっている機能の多くは、ユーザーの皆様と一緒に磨き上げたものです。
            </p>
            <p>
              Threadsで行ったロゴアニメーション総選挙でも、多くの方に投票や応援コメントをいただきました。この場を借りて、心より御礼申し上げます。
            </p>
          </section>

          {/* Section 5: Launch Special CTA */}
          <section className="space-y-4 p-6 rounded-2xl bg-gradient-to-br from-indigo-950/60 to-purple-950/40 border border-indigo-500/40">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              【正式リリース記念】まずは無料体験であなたのWPMを測ってみてください
            </h2>
            <p className="text-sm text-slate-300">
              ShadowLogは、登録不要・ブラウザだけで今すぐ体験いただけます。
              「月2万円のスクールに通うのは厳しいけれど、今年こそ本気で英語の耳と口を鍛えたい」
              そう願うすべての社会人の皆さんに、このアプリが新しい一歩となることを願っています。
            </p>
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <Link
                href="/practice"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition text-center"
              >
                <span>今すぐ無料でシャドーイングを体験する</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/diagnosis"
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm border border-slate-700 transition text-center"
              >
                <span>30秒無料AI発話診断</span>
              </Link>
            </div>
          </section>
        </article>

        {/* Article Footer & CTA */}
        <footer className="border-t border-slate-800 pt-8 mt-12 space-y-6">
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
