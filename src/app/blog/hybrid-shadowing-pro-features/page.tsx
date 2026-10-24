import type { Metadata } from "next";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  Clock,
  CheckCircle2,
  ChevronLeft,
  Train,
  Moon,
  ShieldCheck,
} from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";

export const metadata: Metadata = {
  title: "【満員電車のスキマ特訓×夜の声出し】社会人の挫折を防ぐ新しい英語習慣と、論文・IR記事から「自分専用の教材」を作る方法 | ShadowLog公式ブログ",
  description:
    "仕事で英語を話す機会がない社会人が無理なく毎日英語を口に出すためのハイブリッド学習法。電車内Silent Drillと夜のAIシャドーイング、さらに論文・IR記事・海外ニュースから実践英語を生み出す新機能を解説。",
  keywords: [
    "社会人 英語 勉強 習慣化",
    "満員電車 英語 スキマ時間",
    "シャドーイング 電車",
    "英語 論文 シャドーイング",
    "ShadowLog ブログ",
    "AI シャドーイング おすすめ",
  ],
  openGraph: {
    title: "【満員電車のスキマ特訓×夜の声出し】社会人の挫折を防ぐ新しい英語習慣と、論文・IR記事から「自分専用の教材」を作る方法",
    description: "仕事で英語を使う機会ゼロから始める新発想。朝の電車パズル×夜の声出し、さらに自分の読みたい資料が教材化するPro機能を解説。",
    type: "article",
    publishedTime: "2026-10-24T00:00:00Z",
  },
};

export default function HybridShadowingProFeaturesBlogPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: "【満員電車のスキマ特訓×夜の声出し】社会人の挫折を防ぐ新しい英語習慣と、論文・IR記事から「自分専用の教材」を作る方法",
    description:
      "仕事で英語を話す機会がない社会人が無理なく毎日英語を口に出すためのハイブリッド学習法。電車内Silent Drillと夜のAIシャドーイング、さらに論文・IR記事・海外ニュースから実践英語を生み出す新機能を解説。",
    datePublished: "2026-10-24T00:00:00Z",
    dateModified: "2026-10-24T00:00:00Z",
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/blog"
              className="p-2 rounded-xl bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 transition"
              title="ブログ一覧に戻る"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <Link href="/" className="flex items-center gap-2 group hover:opacity-90 transition">
              <BrandLogo size="md" inverted priority />
              <span className="text-xs text-slate-400 font-semibold ml-1 px-1.5 py-0.5 rounded-md bg-slate-800 border border-slate-700">
                METHOD
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

      {/* Main Container */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-10">
        {/* Article Header */}
        <div className="space-y-4 border-b border-slate-800 pb-8">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-indigo-400">
            <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30">
              最新メソッド ＆ Pro新機能予告
            </span>
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
              習慣化・実務特化
            </span>
            <span className="text-slate-400 flex items-center gap-1 ml-auto">
              <Clock className="w-3.5 h-3.5" /> 約 5 分で読めます
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight">
            【満員電車のスキマ特訓×夜の声出し】<br className="hidden sm:inline" />
            社会人の挫折を防ぐ新しい英語習慣と、<br className="hidden sm:inline" />
            論文・IR記事から「自分専用の教材」を作る方法
          </h1>

          <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
            「英語を話せるようになりたいけれど、日常生活で声を発する機会が全くない」「月額2万円超のスクールは高すぎて続かない」。そんな忙しいビジネスパーソンに向けて、ShadowLogが提案する**「挫折ゼロのハイブリッド学習」**と、**Pro版の新機能ロードマップ**を解説します。
          </p>
        </div>

        {/* Section 1 */}
        <section className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 border-l-4 border-indigo-500 pl-3">
            1. なぜ社会人のシャドーイングは「続かない」のか？
          </h2>
          <div className="text-slate-300 leading-relaxed space-y-4 text-sm sm:text-base">
            <p>
              英語スピーキング力を伸ばす最強のトレーニング法として知られる「シャドーイング」。しかし、多くの社会人が途中で挫折してしまうのには、明確な2つの理由があります。
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-rose-400 font-bold text-sm flex items-center gap-1">
                  ❌ 挫折理由 ①
                </span>
                <p className="text-xs sm:text-sm text-slate-300">
                  <strong>「声を出せる場所と時間が限られている」</strong><br />
                  朝の満員電車やオフィスでは当然声を出せません。帰宅後は疲れてバタバタし、「今日も声を出せずに終わった…」という罪悪感が積み重なってフェードアウトしてしまいます。
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-rose-400 font-bold text-sm flex items-center gap-1">
                  ❌ 挫折理由 ②
                </span>
                <p className="text-xs sm:text-sm text-slate-300">
                  <strong>「教材が自分の仕事と関係ない」</strong><br />
                  市販の教材やニュース英語（TEDやBBC）は抽象的で、明日自分の職場で口にするイメージが湧きません。「これ、いつ使うんだろう？」と思った瞬間、モチベーションは急降下します。
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2 */}
        <section className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 border-l-4 border-indigo-500 pl-3">
            2. 解決策：朝の「Silent Drill」× 夜の「声出し」完全連動ループ
          </h2>
          <div className="text-slate-300 leading-relaxed space-y-4 text-sm sm:text-base">
            <p>
              この「場所と時間の制約」を打ち破るためにShadowLogが開発したのが、**【朝のスキマ特訓 × 夜の声出し】**のハイブリッド学習サイクルです。
            </p>

            <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-950/60 to-slate-950 border border-indigo-500/30 space-y-5">
              <div className="flex items-start gap-4">
                <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 shrink-0 mt-1">
                  <Train className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">
                    🚆 朝（通勤電車の中）：声出し不要の「Silent Drill（チャンク並べ替え）」
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1">
                    満員電車ではスマホを片手に、英文が意味の塊（チャンク）に分解されたパズルを親指タップで「1 ➔ 2 ➔ 3」と並べ替えます。声を一切出さずに、英語の語順感覚（返り読みをしない直読直解）を頭にインストールできます。
                  </p>
                </div>
              </div>

              <div className="h-px bg-slate-800" />

              <div className="flex items-start gap-4">
                <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0 mt-1">
                  <Moon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">
                    🏠 夜（自宅や自室）：Whisper AIによる「0秒即時判定シャドーイング」
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1">
                    夜、リラックスした時間にShadowLogを開き、朝にパズルで頭に入れたフレーズを自分の声で発声。AIがお手本音声とのズレや脱落音を0秒で色分け判定し、WPM（発話速度）も自動記録されます。
                  </p>
                </div>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-400">
              朝のうちに単語や語順が頭に入っているため、夜の発声で噛んだり詰まったりすることが激減し、「スラスラ言えた！」という強い達成感が得られます。
            </p>
          </div>
        </section>

        {/* Section 3 */}
        <section className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 border-l-4 border-indigo-500 pl-3">
            3. 月額500円（ベーシック）で「自分の職種の英語」が毎日届く
          </h2>
          <div className="text-slate-300 leading-relaxed space-y-4 text-sm sm:text-base">
            <p>
              ShadowLogでは、エントリープランである**ベーシックプラン（月額500円）から「ペルソナ設定機能」を標準搭載**しています。
            </p>
            <p>
              設定画面で「海外営業」「ソフトウェアエンジニア」「医療製薬」「コンサルタント」「人事」などの職種や専門業界、商談・デイリースタンドアップ・トラブル対応といったシチュエーションを登録するだけで、AIがあなた専用の英文を自動生成します。
            </p>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm space-y-2">
              <span className="text-indigo-400 font-bold block">💡 実際の生成例（半導体 × 海外営業 × 価格交渉）:</span>
              <p className="text-white italic">
                “Could you let us know if the volume discounts we discussed would be viable for the upcoming orders?”
              </p>
              <p className="text-slate-400">
                （私たちが話し合ったボリュームディスカウントが今後の注文に適用可能か教えていただけますか？）
              </p>
            </div>
            <p>
              教科書の定型文ではなく、「明日現場でそのまま使える生々しい実務英語」だからこそ、やる気が途切れません。
            </p>
          </div>
        </section>

        {/* Section 4 */}
        <section className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 border-l-4 border-indigo-500 pl-3">
            4. 【Pro版先行予告】論文・IR資料から「自分専用教材」を生み出す新機能
          </h2>
          <div className="text-slate-300 leading-relaxed space-y-4 text-sm sm:text-base">
            <p>
              さらに、本格的に実務力を極めたい方向けの**Proプラン（月額1,000円）**において、現在開発中の大型キラー機能**「Doc Shadow（カスタム資料解析・マイスクラップ）」**を発表します。
            </p>

            <div className="p-6 rounded-2xl bg-slate-950 border border-emerald-500/30 space-y-4">
              <h3 className="font-bold text-emerald-300 flex items-center gap-2 text-base">
                <Sparkles className="w-5 h-5 text-amber-400" />
                Doc Shadow（マイスクラップ機能）の3大特長
              </h3>
              <ul className="space-y-3 text-xs sm:text-sm">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">公開論文・IR決算サマリー・海外記事URLをドロップするだけ</strong>
                    <p className="text-slate-400 mt-0.5">
                      自分が読みたい海外テックニュースのリンクや公開資料をセットすると、AIが要点と専門用語を即座に解析。
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">最高峰「GPT-4o」による洗練された要約・スピーチ化</strong>
                    <p className="text-slate-400 mt-0.5">
                      Pro版ではOpenAIの最高峰モデル「GPT-4o」を採用。資料の核心的ロジックを理解した上で、会議でサクッと報告・議論するための自然なフレーズへと昇華します。
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">「朝の電車パズル」と「夜の声出し」にも完全連動</strong>
                    <p className="text-slate-400 mt-0.5">
                      登録したドキュメントから、朝はチャンクパズル（Silent Drill）で語順を頭に入れ、夜はそのままシャドーイングで発声特訓できます。
                    </p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Compliance notice */}
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-amber-100">※ コンプライアンス・安心設計について</strong>
                <p className="mt-0.5 text-amber-200/80">
                  企業の社外秘・機密情報や個人情報のアップロードは厳格に禁止しております。一般公開されている学術論文、上場企業の決算発表、海外ニュースメディアなどの公開ソースをご活用いただく設計です。
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5 / Pricing Summary */}
        <section className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 border-l-4 border-indigo-500 pl-3">
            5. まずは月額500円から。いつでも差額でProへアップグレード可能
          </h2>
          <div className="text-slate-300 leading-relaxed space-y-4 text-sm sm:text-base">
            <p>
              ShadowLogは、すべての社会人が経済的な負担なく英語を口に出せる習慣を作れるよう、価格体系も極限までシンプルに設計しています。
            </p>
            <ul className="list-disc list-inside space-y-2 text-xs sm:text-sm pl-2">
              <li>
                <strong>ベーシックプラン（月額500円）</strong>: 短文シャドーイング無制限 ＆ 電車内スキマ特訓無制限 ＆ 職種ペルソナ設定
              </li>
              <li>
                <strong>Proプラン（月額1,000円）</strong>: 長文スピーチ特訓 ＆ 高度AIコーチ ＆ 新機能「Doc Shadow」先行アクセス
              </li>
            </ul>
            <p>
              500円のベーシックプランから始めて、「もっと長く話す練習をしたい」「資料解析を使ってみたい」と思ったら、**いつでもStripeの日割り差額決済（その月の残日数に応じた差額のみ）で気兼ねなくProへ切り替えることが可能**です。
            </p>
          </div>
        </section>

        {/* CTA Box */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-950 to-slate-950 border border-indigo-500/40 text-center space-y-4 mt-8">
          <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold inline-block">
            登録不要・ブラウザで今すぐ試せます
          </span>
          <h3 className="text-lg sm:text-2xl font-bold text-white">
            今日から「電車内のスキマ特訓 × 夜の声出し」を始めてみませんか？
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
            1回3分、あなたのスマートフォンが専属のAIスピーキングコーチになります。
          </p>
          <div className="pt-2">
            <Link
              href="/practice"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm sm:text-base transition shadow-lg shadow-indigo-600/30 active:scale-95"
            >
              <span>無料で今すぐ練習を始める</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
