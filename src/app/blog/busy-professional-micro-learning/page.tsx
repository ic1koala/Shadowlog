import type { Metadata } from "next";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  Clock,
  CheckCircle2,
  ChevronLeft,
  Calendar,
  Brain,
  Zap,
  BookOpen,
  Coffee,
} from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";

export const metadata: Metadata = {
  title: "「忙しくて英語の勉強時間が取れない」社会人が毎日10分で成果を出すマイクロラーニング術 | ShadowLog公式ブログ",
  description:
    "仕事や家事で忙しい社会人が英語学習を習慣化するための科学的メソッド。エビングハウスの忘却曲線と「分散学習効果（Distributed Practice Effect）」、習慣化の決定打「If-Thenプランニング」を活用し、1日10分のスキマ時間で英語力を劇的に伸ばす具体策を解説。",
  keywords: [
    "社会人 英語 勉強時間 ない",
    "英語学習 習慣化 コツ",
    "マイクロラーニング 英語",
    "分散学習 英語",
    "If-Thenプランニング 勉強",
    "ShadowLog ブログ",
  ],
  openGraph: {
    title: "「忙しくて英語の勉強時間が取れない」社会人が毎日10分で成果を出すマイクロラーニング術",
    description: "忙しい社会人のための1日10分マイクロラーニング術。週末2時間より効果的な「分散学習×If-Thenプランニング」。",
    type: "article",
    publishedTime: "2026-10-31T00:00:00Z",
  },
};

export default function BusyProfessionalMicroLearningBlogPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: "「忙しくて英語の勉強時間が取れない」社会人が毎日10分で成果を出すマイクロラーニング術",
    description:
      "仕事や家事で忙しい社会人が英語学習を習慣化するための科学的メソッド。エビングハウスの忘却曲線と「分散学習効果（Distributed Practice Effect）」、習慣化の決定打「If-Thenプランニング」を活用し、1日10分のスキマ時間で英語力を劇的に伸ばす具体策を解説。",
    datePublished: "2026-10-31T00:00:00Z",
    dateModified: "2026-10-31T00:00:00Z",
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
              習慣化 ＆ 生産性
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
              習慣化・マイクロラーニング
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              読了目安 5分
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400">2026.10.31 公開</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight">
            「忙しくて英語の勉強時間が取れない」社会人が毎日10分で成果を出すマイクロラーニング術
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            平日は深夜残業や家事に追われ、机に向かって1時間テキストを開く気力なんてとても湧かない——。
            真面目な学習者ほど「毎日まとまった時間を取らなければ」という義務感に押しつぶされ、挫折してしまいがちです。
            しかし、最新の学習科学では「週末に2時間まとめて勉強する」よりも「1日2分×5回に分散させる」方が、記憶の定着率が圧倒的に高いことが実証されています。
            忙しい社会人のための1日10分マイクロラーニング術を大公開します。
          </p>
        </header>

        {/* Article Body */}
        <article className="py-8 space-y-10 text-slate-300 text-sm sm:text-base leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 border-l-4 border-indigo-500 pl-3">
              <Calendar className="w-6 h-6 text-indigo-400" />
              1. 「週末にまとめて勉強」が失敗する脳科学的理由
            </h2>
            <p>
              「平日は忙しいから、土日にまとめて3〜4時間カフェで集中しよう」と計画していませんか？
              残念ながら、このスタイルは語学学習において最も効率が悪いアプローチの一つです。
            </p>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-sm">
              <div className="text-indigo-300 font-bold">エビングハウスの忘却曲線（Ebbinghaus Forgetting Curve）：</div>
              <p className="text-slate-400">
                人間の脳は、一度覚えたことでも<strong>翌日には約74%を忘却</strong>します。土曜日に頑張って詰め込んだ知識も、次の土曜日まで放置されれば記憶の定着率はほぼゼロに逆戻りしてしまいます。
              </p>
            </div>
            <p>
              認知心理学者のセペダ（Cepeda et al., 2006）らによる大規模なメタ分析研究でも、同じ学習時間であれば、一括で学習する「集中学習（Massed Practice）」よりも、時間を空けて繰り返す<strong>「分散学習（Distributed Practice）」の方が、長期記憶の保持率が約50%〜200%向上する</strong>ことが確認されています。
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 border-l-4 border-indigo-500 pl-3">
              <Brain className="w-6 h-6 text-indigo-400" />
              2. 脳の負荷を最小化する「マイクロラーニング」の威力
            </h2>
            <p>
              「1日30分机に向かう」と思うと、脳は「面倒くさい」「エネルギーを消費する」と判断し、強力な先延ばし（プロクラスティネーション）を引き起こします。
            </p>
            <p>
              一方、「1回2分、スマホで1センテンスだけ声に出す」であれば、意志の力（ウィルパワー）をほとんど消費しません。
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <h3 className="font-bold text-white text-base">従来の英語学習（挫折しやすい）</h3>
                <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
                  <li>机に座り、テキストとノートを広げる</li>
                  <li>長文を解き、辞書を引いて赤ペンで丸つけ</li>
                  <li>開始するまでに大きな精神的ハードル</li>
                  <li>疲れている日はスキップ ➔ 自己嫌悪で断念</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/20 space-y-2">
                <h3 className="font-bold text-indigo-300 text-base">マイクロラーニング（継続率90%超）</h3>
                <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                  <li>スマホを開いて1問タップするだけ（所要1分）</li>
                  <li>AIが0秒で発音・WPMを判定＆自動記録</li>
                  <li>スキマ時間の移動中・歯磨き中に完了</li>
                  <li>「今日も継続できた」という小さな自己効力感の蓄積</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 border-l-4 border-indigo-500 pl-3">
              <Zap className="w-6 h-6 text-indigo-400" />
              3. 意志力ゼロで続く「If-Thenプランニング」
            </h2>
            <p>
              ニューヨーク大学のピーター・ゴルヴィツァー（Peter Gollwitzer）教授が提唱した「If-Thenプランニング」は、行動科学において最も強力な目標達成テクニックとされています。
            </p>
            <p>
              「時間が空いたら英語を勉強しよう」という曖昧な計画は99%失敗します。
              代わりに、<strong>「［すでにある日常のトリガー］が起きたら、［英語アクション］をする」</strong>と脳に条件づけを行います。
            </p>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 my-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Coffee className="w-4 h-4 text-amber-400" />
                社会人向けおすすめIf-Thenレシピ3選：
              </div>
              <div className="space-y-2 text-xs sm:text-sm text-slate-300">
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-indigo-400 font-mono font-bold">朝:</span> 「通勤電車に乗ったら」➔「語順パズル（Silent Drill）を1問解く」
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-indigo-400 font-mono font-bold">昼:</span> 「ランチを食べ終わったら」➔「単語カードを3枚タップして発音チェック」
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-indigo-400 font-mono font-bold">夜:</span> 「お風呂から上がったら」➔「マイクに向かってシャドーイングを1分吹き込む」
                </div>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 border-l-4 border-indigo-500 pl-3">
              <BookOpen className="w-6 h-6 text-indigo-400" />
              4. 1日10分の積み重ねが1年後に生み出す巨大な差
            </h2>
            <p>
              「たった1日10分で本当に話せるようになるのか？」と疑問に思うかもしれません。
            </p>
            <p>
              しかし、1日10分＝年間約3,650分（約60時間）の純粋な「能動的アウトプット（発話・知覚）」時間です。
              週末にダラダラと2時間聞き流しをする人（年間でも実質アウトプット数時間）と比べ、<strong>実際に自分の口を動かして脳の神経回路を刺激した回数では、マイクロラーニング実践者が圧倒的な大差をつけて勝利します</strong>。
            </p>
          </section>

          {/* Section 5: Practical Action */}
          <section className="space-y-4 p-5 rounded-2xl bg-indigo-950/30 border border-indigo-500/30">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              忙しいあなたの毎日に寄り添う「ShadowLog」の仕組み
            </h2>
            <p className="text-sm text-slate-300">
              ShadowLogは、まさに「仕事で忙しい社会人」のために開発された英語習慣化アプリです。
            </p>
            <ul className="text-xs sm:text-sm text-slate-300 space-y-2 list-disc list-inside">
              <li>通勤電車でも声を出さずにできる「サイレント特訓（Silent Drill）」</li>
              <li>夜の30秒声出しで、AIがWPM（発話速度）と発音を即座にスコア化</li>
              <li>練習を忘れそうな時間に優しく通知する「習慣化Web Pushリマインド」</li>
            </ul>
            <div className="pt-2">
              <Link
                href="/practice"
                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition"
              >
                <span>まずは1分！無料体験でシャドーイングを試す</span>
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
                忙しい毎日に、1分間の英語新習慣。AIがあなたの発音・速度をサポート。
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
