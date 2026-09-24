import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "利用規約 | ShadowLog",
  description: "ShadowLogの利用規約（Terms of Service）です。",
};

export default function TermsPage() {
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
            <ShieldCheck className="w-3.5 h-3.5" />
            リーガル情報
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">利用規約</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            最終更新日: 2026年9月25日
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6 text-xs sm:text-sm leading-relaxed">
          <p>
            本利用規約（以下「本規約」といいます。）は、ShadowLog（以下「本サービス」といいます。）の提供条件および本サービスの利用に関する運営者（以下「当方」といいます。）とユーザーの皆様（以下「ユーザー」といいます。）との間の権利義務関係を定めるものです。本サービスの利用に際しては、本規約の全文をお読みいただいた上で、本規約に同意いただく必要があります。
          </p>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-foreground border-b border-border/60 pb-1">第1条（適用）</h2>
            <ol className="list-decimal pl-5 space-y-1.5">
              <li>本規約は、ユーザーと当方との間の本サービスの利用に関わる一切の関係に適用されます。</li>
              <li>当方が本サービス上で掲載する本サービスの利用に関するルール、ヘルプ、注意事項等（以下「個別規定」といいます。）は、本規約の一部を構成するものとします。本規約と個別規定の内容が異なる場合は、個別規定が優先して適用されます。</li>
            </ol>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-foreground border-b border-border/60 pb-1">第2条（定義）</h2>
            <p>本規約において使用する用語の定義は、以下のとおりとします。</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>「本サービス」</strong>: 当方が提供する英語シャドーイング学習Webサービス「ShadowLog」を指します。</li>
              <li><strong>「ユーザー」</strong>: 本規約に同意の上、本サービスの利用登録または利用を行った個人または法人を指します。</li>
              <li><strong>「AI生成コンテンツ」</strong>: 本サービス内で人工知能（AI）技術を用いて自動生成される英文、日本語訳、音声等のコンテンツを指します。</li>
              <li><strong>「発話データ」</strong>: ユーザーが本サービスの利用にあたりマイク等を通じて録音・送信した音声データおよびこれを文字起こししたテキストデータを指します。</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-foreground border-b border-border/60 pb-1">第3条（アカウント登録および管理）</h2>
            <ol className="list-decimal pl-5 space-y-1.5">
              <li>本サービスの利用を希望する者は、本規約を遵守することに同意し、当方の定める方法に従い登録情報を当方に提供することにより、利用登録を行うことができます。</li>
              <li>ユーザーは、自己の責任において本サービスのアカウント情報（メールアドレス、パスワード等）を厳重に管理するものとします。</li>
              <li>ユーザーは、いかなる場合もアカウントを第三者に譲渡、貸与、または共用することはできません。</li>
            </ol>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-foreground border-b border-border/60 pb-1">第4条（有料サービス・利用料金および支払方法）</h2>
            <ol className="list-decimal pl-5 space-y-1.5">
              <li>ユーザーは、有料サービス（月額サブスクリプション等）を利用する場合、当方が別途定め、本サービス上に表示する利用料金を、当方が指定する決済方法（Stripe等の決済代行サービス）により支払うものとします。</li>
              <li><strong>自動更新</strong>: 有料サブスクリプションプランは、ユーザーが更新解約手続きを行わない限り、従前の契約期間満了時に自動的に同期間延長（更新）されます。</li>
              <li><strong>解約</strong>: ユーザーは、いつでも有料プランの解約手続きを行うことができます。解約手続きが完了した場合でも、すでに支払われた有効期間終了までは引き続きサービスを利用することができます。</li>
              <li><strong>返金ポリシー</strong>: デジタルコンテンツおよびSaaSの性質上、すでに支払われた利用料金の返金、および日割り計算による減額・返金は一切行わないものとします。</li>
            </ol>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-foreground border-b border-border/60 pb-1">第5条（AI技術および外部連携サービスに関する特記事項）</h2>
            <ol className="list-decimal pl-5 space-y-1.5">
              <li>本サービスは、OpenAI Inc.が提供するAPI等の外部AIサービスを利用して例文生成、音声合成（TTS）、音声文字起こし（Whisper）等の機能を提供しています。</li>
              <li><strong>生成結果の非保証</strong>: 当方は、AI生成コンテンツおよび音声文字起こし結果の正確性、完全性、有用性、特定目的への適合性等について、明示的にも黙示的にも一切保証いたしません。</li>
              <li>外部AIサービスの仕様変更やダウンタイム等に起因して本サービスの一部または全部が利用不能となった場合、当方はこれによりユーザーに生じた損害について一切の責任を負いません。</li>
            </ol>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-foreground border-b border-border/60 pb-1">第6条（知的財産権およびデータの取扱い）</h2>
            <ol className="list-decimal pl-5 space-y-1.5">
              <li>本サービスを構成するプログラム、デザイン、ロゴ等に関する知的財産権は、すべて当方または当方にライセンスを許諾している者に帰属します。</li>
              <li>ユーザーが本サービスに送信した発話データに関する権利はユーザーに帰属します。ただし、ユーザーは、当方が音声認識・Diff解析処理、サービス改善のために、発話データを無償、非独占的かつ全世界的に使用・処理することを許諾するものとします。</li>
            </ol>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-foreground border-b border-border/60 pb-1">第7条（禁止事項）</h2>
            <p>ユーザーは、本サービスの利用にあたり、法令違反行為、不正アクセス、過度なリクエストによるサーバーへの負荷、リバースエンジニアリング、他のユーザーや第三者への権利侵害等の行為を行ってはなりません。</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-foreground border-b border-border/60 pb-1">第8条（免責事項）</h2>
            <p>当方は、本サービスに起因してユーザーに生じたあらゆる損害について、当方の故意または重過失による場合を除き、一切の責任を負いません。また、当方が損害賠償責任を負う場合であっても、過去1ヶ月間にユーザーから受領した利用料金の額を上限とします。</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-foreground border-b border-border/60 pb-1">第9条（規約の変更）</h2>
            <p>当方は、必要と判断した場合には、本規約を変更することができます。変更後の本規約は、本サービス上に掲載した時点より効力を生じるものとします。</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-foreground border-b border-border/60 pb-1">第10条（準拠法および管轄裁判所）</h2>
            <p>本規約の解釈にあたっては日本法を準拠法とし、本サービスに関して紛争が生じた場合には、東京地方裁判所を第一審の専属的合意管轄裁判所とします。</p>
          </section>
        </div>

        {/* Footer Navigation */}
        <div className="border-t border-border pt-6 flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:underline">プライバシーポリシー</Link>
            <span>•</span>
            <Link href="/tokushoho" className="hover:underline">特定商取引法に基づく表記</Link>
          </div>
          <p>© {new Date().getFullYear()} ShadowLog. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
