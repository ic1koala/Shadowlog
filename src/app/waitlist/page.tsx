import { Metadata } from "next";
import Link from "next/link";
import {
  Sparkles,
  Volume2,
  CheckCircle2,
  Target,
  Zap,
  TrendingUp,
  ShieldCheck,
  Coffee,
  HelpCircle,
  ArrowRight,
  Headphones,
} from "lucide-react";
import { InteractiveShadowingDemo } from "@/components/features/waitlist/InteractiveShadowingDemo";
import { WaitlistForm } from "@/components/features/waitlist/WaitlistForm";

export const metadata: Metadata = {
  title: "ShadowLog - 気軽な価格で、生活に英語を発する機会を。",
  description:
    "音声AIがあなたの発音・話速を1単語単位で可視化。1回3分から始めるシャドーイング習慣化アプリ「ShadowLog」の事前登録（14日間無料クーポン付き）受付中。",
  openGraph: {
    title: "ShadowLog - 気軽な価格で、生活に英語を発する機会を。",
    description:
      "音声AIがあなたの発音・話速を1単語単位で可視化。1回3分から始めるシャドーイング習慣化アプリ「ShadowLog」の事前登録受付中。",
  },
};

export default function WaitlistPage() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 flex flex-col">
      {/* ── ナビゲーションバー ── */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-background/80 border-b border-border/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/waitlist" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
              <Headphones className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-lg sm:text-xl tracking-tight text-foreground">
              ShadowLog
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs sm:text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
            >
              ログイン
            </Link>
            <a
              href="#register"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-all"
            >
              <span>事前登録する</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* ── 1. Hero セクション ── */}
        <section className="relative pt-12 pb-16 sm:pt-20 sm:pb-24 px-4 sm:px-6 overflow-hidden">
          {/* Background Ambient Glows */}
          <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-primary/10 rounded-full blur-[120px] pointer-events-none -z-10" />

          <div className="max-w-4xl mx-auto text-center space-y-6 sm:space-y-8">
            {/* Promo Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25 shadow-sm animate-pulse">
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>🎁 事前登録限定：14日間無料体験クーポンプレゼント</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-foreground leading-[1.2] sm:leading-[1.15]">
              気軽な価格で、<br className="hidden sm:inline" />
              生活に英語を発する機会を。
            </h1>

            {/* Subtitle */}
            <p className="max-w-2xl mx-auto text-sm sm:text-lg text-muted-foreground leading-relaxed">
              音声AIがあなたの発音・話速を1単語単位で可視化。
              1回3分からスキマ時間で無理なく続けられる、次世代シャドーイング習慣化アプリ「ShadowLog」
            </p>

            {/* Waitlist Form Card in Hero */}
            <div id="register" className="max-w-xl mx-auto pt-2 scroll-mt-24">
              <div className="p-3 sm:p-5 rounded-3xl bg-card/60 backdrop-blur-md border border-border/80 shadow-xl">
                <WaitlistForm sourceLocation="hero" />
              </div>
            </div>
          </div>
        </section>

        {/* ── 2. 動くインタラクティブUIデモ ── */}
        <section className="py-8 sm:py-16 px-4 sm:px-6 bg-muted/20 border-y border-border/50">
          <div className="max-w-4xl mx-auto space-y-6 text-center">
            <div className="space-y-2">
              <span className="text-xs font-bold tracking-wider text-primary uppercase">
                Interactive Preview
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                発話した瞬間、AIが1単語ずつ判定
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto">
                「自分の発音が通じるか分からない」不安を解消。AIが聞き取れた単語と発音のズレをリアルタイムで色分けします。
              </p>
            </div>

            {/* Interactive simulation widget */}
            <InteractiveShadowingDemo />
          </div>
        </section>

        {/* ── 3. お悩み共感セクション ── */}
        <section className="py-16 sm:py-24 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto space-y-12">
            <div className="text-center space-y-2">
              <span className="text-xs font-bold tracking-wider text-rose-500 uppercase">
                Pain Points
              </span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                こんなお悩み、ありませんか？
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                英語学習者が直面する3つの大きな壁
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-sm space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center text-2xl">
                  🗣️
                </div>
                <h3 className="font-bold text-base text-foreground">声に出す機会がない</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  単語や文法をインプットしても、日常生活や仕事で実際に声を出してアウトプットする場がほとんどない。
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-sm space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center text-2xl">
                  🤔
                </div>
                <h3 className="font-bold text-base text-foreground">合っているか分からない</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  一人でシャドーイング練習をしても、ネイティブに通じる発音やリズムで話せているか客観的に判断できない。
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-sm space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-2xl">
                  💸
                </div>
                <h3 className="font-bold text-base text-foreground">コーチングは高すぎる</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  月額2〜3万円する英語コーチングや英会話スクールは経済的・時間的な負担が大きく、長続きしない。
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── 4. ShadowLogの3大特徴（解決策） ── */}
        <section className="py-16 sm:py-24 px-4 sm:px-6 bg-muted/30 border-y border-border/50">
          <div className="max-w-4xl mx-auto space-y-12">
            <div className="text-center space-y-2">
              <span className="text-xs font-bold tracking-wider text-primary uppercase">
                Solutions & Features
              </span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                ShadowLogが選ばれる3つの理由
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                テクノロジーの力で、高品質なスピーキングトレーニングをすべての人に
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="p-6 rounded-3xl bg-card border border-border shadow-sm flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">
                    音声AIによるリアルタイム色分け判定
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    言えていない単語や読み飛ばしを1単語単位で瞬時に色分け可視化。自分の発音のクセや弱点がひと目でわかります。
                  </p>
                </div>
                <div className="pt-3 border-t border-border/60 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <span>単語ごとの正誤判定</span>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="p-6 rounded-3xl bg-card border border-border shadow-sm flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">
                    話速（WPM）と発音スコアの見える化
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    1分間の発話単語数（WPM）と正解率を毎回グラフに記録。ネイティブスピードへの到達度が可視化され、日々の成長を実感できます。
                  </p>
                </div>
                <div className="pt-3 border-t border-border/60 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                  <span>WPM & スコア推移グラフ</span>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="p-6 rounded-3xl bg-card border border-border shadow-sm flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <Coffee className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">
                    続けやすい価格設定（月額500円〜）
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    高額な人件費を最新AIで自動化。カフェ1杯分の手軽な価格設定により、お財布の負担なく毎日の習慣として継続できます。
                  </p>
                </div>
                <div className="pt-3 border-t border-border/60 text-[11px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <span>月額500円で短文使い放題</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 5. 料金プラン予告 ── */}
        <section className="py-16 sm:py-24 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto space-y-12">
            <div className="text-center space-y-2">
              <span className="text-xs font-bold tracking-wider text-primary uppercase">
                Pricing Preview
              </span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                明瞭・手軽な3つのプラン
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                2026年11月の正式リリース時の予定料金です。事前登録者には無料クーポンを進呈します。
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Free Plan */}
              <div className="p-6 rounded-3xl bg-card border border-border/80 shadow-sm space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <span className="text-xs font-bold text-muted-foreground">お試し</span>
                  <h3 className="text-lg font-bold text-foreground">フリープラン</h3>
                  <div className="pt-1">
                    <span className="text-2xl font-black text-foreground">¥0</span>
                    <span className="text-xs text-muted-foreground ml-1">/ 永久無料</span>
                  </div>
                  <ul className="space-y-2 text-xs text-muted-foreground pt-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>登録時 チケット3枚プレゼント</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>短文シャドーイング体験</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>リアルタイム音声AI判定</span>
                    </li>
                  </ul>
                </div>
                <div className="pt-4 border-t border-border/50 text-xs text-center font-medium text-muted-foreground">
                  まずは気軽に体験
                </div>
              </div>

              {/* Basic Plan (Popular) */}
              <div className="p-6 rounded-3xl bg-card border-2 border-primary shadow-lg space-y-4 flex flex-col justify-between relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-black bg-primary text-primary-foreground uppercase tracking-wider">
                  人気No.1・毎日の習慣化
                </div>
                <div className="space-y-3 pt-2">
                  <span className="text-xs font-bold text-primary">習慣化に最適</span>
                  <h3 className="text-lg font-bold text-foreground">ベーシックプラン</h3>
                  <div className="pt-1">
                    <span className="text-3xl font-black text-foreground">¥500</span>
                    <span className="text-xs text-muted-foreground ml-1">/ 月 (税込)</span>
                  </div>
                  <ul className="space-y-2 text-xs text-muted-foreground pt-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span><strong>短文シャドーイング無制限（使い放題）</strong></span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>苦手単語の自動抽出 ＆ パーソナライズ復習</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>学習アクティビティ・WPMトレンド永続保存</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>広告なし・ストレスフリーな学習環境</span>
                    </li>
                  </ul>
                </div>
                <div className="pt-4 border-t border-border/50 text-xs text-center font-bold text-primary">
                  カフェ1杯分で毎日使い放題
                </div>
              </div>

              {/* Pro Plan */}
              <div className="p-6 rounded-3xl bg-card border border-border/80 shadow-sm space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <span className="text-xs font-bold text-muted-foreground">実務・本格派</span>
                  <h3 className="text-lg font-bold text-foreground">プロプラン</h3>
                  <div className="pt-1">
                    <span className="text-2xl font-black text-foreground">¥1,480</span>
                    <span className="text-xs text-muted-foreground ml-1">/ 月 (税込)</span>
                  </div>
                  <ul className="space-y-2 text-xs text-muted-foreground pt-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span>ベーシックの全機能使い放題</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span>長文パッセージ（60〜120語）本格練習</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span>AIコーチによる発音・イントネーション指導</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span>業界特化・長文スピーチモード</span>
                    </li>
                  </ul>
                </div>
                <div className="pt-4 border-t border-border/50 text-xs text-center font-medium text-muted-foreground">
                  本格的なスピーチ・プレゼン力へ
                </div>
              </div>
            </div>

            {/* Campaign Banner */}
            <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-center">
              <p className="text-xs sm:text-sm font-bold text-amber-700 dark:text-amber-400">
                ✨ 事前登録いただいた方全員に、正式リリース時に「14日間無料体験クーポン」を進呈します！
              </p>
            </div>
          </div>
        </section>

        {/* ── 6. フッターCTA ── */}
        <section className="py-16 sm:py-24 px-4 sm:px-6 bg-card border-t border-border/60">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>2026年11月 正式リリース予定</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground">
              先行登録で、お得に英語習慣を始めよう。
            </h2>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              登録はメールアドレスを入力するだけ。迷惑メールは一切送信いたしません。
            </p>

            <div className="pt-2">
              <WaitlistForm sourceLocation="footer" />
            </div>
          </div>
        </section>
      </main>

      {/* ── 7. フッター ── */}
      <footer className="py-8 px-4 sm:px-6 border-t border-border text-xs text-muted-foreground">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-foreground">ShadowLog</span>
            <span>&copy; 2026 ShadowLog Team. All rights reserved.</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/terms" className="hover:text-foreground transition-colors">
              利用規約
            </Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              プライバシーポリシー
            </Link>
            <Link href="/tokushoho" className="hover:text-foreground transition-colors">
              特定商取引法に基づく表記
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
