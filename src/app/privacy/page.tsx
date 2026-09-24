import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";

export const metadata = {
  title: "プライバシーポリシー | ShadowLog",
  description: "ShadowLogの個人情報保護方針（Privacy Policy）です。",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground py-10 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Back Link */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition"
          >
            <ArrowLeft className="w-4 h-4" />
            ダッシュボードへ戻る
          </Link>
        </div>

        {/* Header */}
        <div className="border-b border-border pb-6 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
            <Lock className="w-3.5 h-3.5" />
            リーガル情報
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">プライバシーポリシー</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            最終更新日: 2026年9月25日
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6 text-xs sm:text-sm leading-relaxed">
          <p>
            ShadowLog（以下「当方」といいます。）は、英語シャドーイング学習Webサービス「ShadowLog」（以下「本サービス」といいます。）におけるユーザーの個人情報およびプライバシー情報の取扱いについて、以下のとおりプライバシーポリシー（以下「本ポリシー」といいます。）を定めます。
          </p>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-foreground border-b border-border/60 pb-1">第1条（基本方針）</h2>
            <p>当方は、個人情報の重要性を認識し、個人情報の保護に関する法律（以下「個人情報保護法」といいます。）その他の関係法令を遵守するとともに、適切な取得・利用・管理に努めます。</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-foreground border-b border-border/60 pb-1">第2条（収集する情報および取得方法）</h2>
            <p>本サービスにおいて、当方は以下の情報を取得・収集します。</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>アカウント情報</strong>: メールアドレス、ユーザーID等</li>
              <li><strong>設定情報</strong>: 業種、関心分野、目標レベル等の英語学習カスタマイズ用情報</li>
              <li><strong>発話・学習データ</strong>: マイクを通じて録音されたユーザーの発話音声データ、文字起こし結果、発話Diff差分データ、学習ログ（発話単語数、練習回数、ストリーク）</li>
              <li><strong>決済情報</strong>: 有料プランの購入履歴、契約プラン（※クレジットカード情報は決済代行業者であるStripe Inc.が直接安全に処理し、当方のサーバーには保管されません）</li>
              <li><strong>アクセス情報</strong>: IPアドレス、アクセスログ、クッキーおよびローカルストレージ情報</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-foreground border-b border-border/60 pb-1">第3条（利用目的）</h2>
            <p>当方は、収集した情報を以下の目的で利用します。</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>本サービスの提供、ログイン認証、本人確認のため</li>
              <li>ユーザーに最適化された英語例文のAI生成、フレーズ音声の再生、音声文字起こし、発話差分（Diff）解析のため</li>
              <li>有料プランの決済処理、サブスクリプション管理のため</li>
              <li>本サービスの品質向上、機能改善、不具合調査およびセキュリティ維持のため</li>
              <li>重要なお知らせやサポート対応のため</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-foreground border-b border-border/60 pb-1">第4条（第三者APIサービスへの委託・データ連携）</h2>
            <ol className="list-decimal pl-5 space-y-1.5">
              <li><strong>OpenAI Inc. へのデータ送信</strong>: 本サービスは、英文生成、音声合成（TTS）、音声文字起こし（Whisper）のためにOpenAI APIを利用しています。API経由で送信されたデータは、OpenAI側のAIモデルの学習（Training）には利用されません。</li>
              <li><strong>クラウド・インフラ事業者への委託</strong>: データの保管および処理のため、Vercel Inc.、Supabase Inc.、Stripe Inc.等の信頼性の高い事業者に安全管理のもと業務を委託しています。</li>
            </ol>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-foreground border-b border-border/60 pb-1">第5条（安全管理措置）</h2>
            <p>当方は、個人情報の漏えい、滅失またはき損の防止その他の個人情報の安全管理のために、SSL/TLSによる通信の暗号化、アクセス権限の適切な管理等の必要な措置を講じます。</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-foreground border-b border-border/60 pb-1">第6条（開示・訂正・利用停止・削除）</h2>
            <p>ユーザーは、ご自身の個人情報の開示、訂正、利用停止、または削除を希望される場合、本サービス所定の窓口までご連絡いただくことにより、速やかに対応いたします。</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-foreground border-b border-border/60 pb-1">第7条（お問い合わせ窓口）</h2>
            <p>本ポリシーに関するお問い合わせは、特定商取引法に基づく表記に記載の連絡先までお願いいたします。</p>
          </section>
        </div>

        {/* Footer Navigation */}
        <div className="border-t border-border pt-6 flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <Link href="/terms" className="hover:underline">利用規約</Link>
            <span>•</span>
            <Link href="/tokushoho" className="hover:underline">特定商取引法に基づく表記</Link>
          </div>
          <p>© {new Date().getFullYear()} ShadowLog. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
