import Link from "next/link";
import { ArrowLeft, Scale } from "lucide-react";

export const metadata = {
  title: "特定商取引法に基づく表記 | ShadowLog",
  description: "ShadowLogの特定商取引法に基づく表記です。",
};

export default function TokushohoPage() {
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
            <Scale className="w-3.5 h-3.5" />
            リーガル情報
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">特定商取引法に基づく表記</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            最終更新日: 2026年9月25日
          </p>
        </div>

        {/* Content Table */}
        <div className="bg-card rounded-2xl border border-border shadow-xs overflow-hidden">
          <div className="divide-y divide-border text-xs sm:text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-3 p-4 sm:p-5 gap-2 bg-muted/20">
              <span className="font-bold text-foreground">販売事業者</span>
              <div className="sm:col-span-2 text-muted-foreground space-y-1">
                <p>ShadowLog 運営事務局</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 p-4 sm:p-5 gap-2">
              <span className="font-bold text-foreground">代表責任者</span>
              <div className="sm:col-span-2 text-muted-foreground">
                <p>鈴木 秀明</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 p-4 sm:p-5 gap-2 bg-muted/20">
              <span className="font-bold text-foreground">所在地・電話番号</span>
              <div className="sm:col-span-2 text-muted-foreground space-y-1 text-xs">
                <p>所在地および電話番号については、取引時に請求があった場合、遅滞なく電子メール等により開示いたします。</p>
                <p className="text-muted-foreground/80">開示をご希望の方は下記メールアドレスまでご連絡ください。</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 p-4 sm:p-5 gap-2">
              <span className="font-bold text-foreground">お問い合わせ先</span>
              <div className="sm:col-span-2 text-muted-foreground">
                <p className="font-mono">shadowlog.app@gmail.com</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">※ お問い合わせは原則としてメールにて受け付けております。</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 p-4 sm:p-5 gap-2 bg-muted/20">
              <span className="font-bold text-foreground">販売価格（対価）</span>
              <div className="sm:col-span-2 text-muted-foreground space-y-1">
                <p>・<strong>ベースプラン</strong>: 月額 500 円（税込）</p>
                <p>・<strong>Proプラン</strong>: 月額 1,480 円（税込）</p>
                <p className="text-[11px]">※ プランの詳細な仕様はプラン案内画面（アップセル画面）に表示されます。</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 p-4 sm:p-5 gap-2">
              <span className="font-bold text-foreground">商品代金以外の必要料金</span>
              <div className="sm:col-span-2 text-muted-foreground">
                <p>インターネット接続料金、通信料金（お客様のご負担となります）</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 p-4 sm:p-5 gap-2 bg-muted/20">
              <span className="font-bold text-foreground">お支払方法</span>
              <div className="sm:col-span-2 text-muted-foreground">
                <p>クレジットカード決済（Visa, Mastercard, American Express, JCB等）</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">※ 決済処理は Stripe Inc. の安全な決済システムを利用しています。</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 p-4 sm:p-5 gap-2">
              <span className="font-bold text-foreground">代金の支払時期</span>
              <div className="sm:col-span-2 text-muted-foreground space-y-1">
                <p>・<strong>初回購入時</strong>: お申し込み完了時に即時決済されます。</p>
                <p>・<strong>サブスクリプション更新時</strong>: 初回決済日を起算日として、毎月同日に自動継続決済されます。</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 p-4 sm:p-5 gap-2 bg-muted/20">
              <span className="font-bold text-foreground">役務の提供時期</span>
              <div className="sm:col-span-2 text-muted-foreground">
                <p>クレジットカード決済手続き完了後、即時に対象プランの全機能をご利用いただけます。</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 p-4 sm:p-5 gap-2">
              <span className="font-bold text-foreground">解約および返金について</span>
              <div className="sm:col-span-2 text-muted-foreground space-y-2">
                <div>
                  <p className="font-semibold text-foreground">【解約について】</p>
                  <p className="text-xs">マイページ・設定画面よりいつでも解約手続きが可能です。解約後も、すでに支払われた有効期限終了日まで引き続き有料機能をご利用いただけます。</p>
                </div>
                <div>
                  <p className="font-semibold text-foreground">【返品・返金について】</p>
                  <p className="text-xs">デジタルコンテンツおよびSaaSの性質上、購入完了後の返品・返金・日割り計算による減額は一切お受けできません。</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 p-4 sm:p-5 gap-2 bg-muted/20">
              <span className="font-bold text-foreground">推奨動作環境</span>
              <div className="sm:col-span-2 text-muted-foreground text-xs space-y-1">
                <p>・<strong>推奨ブラウザ</strong>: Google Chrome（最新版）、Apple Safari（最新版）、Microsoft Edge（最新版）</p>
                <p>・<strong>必須機能</strong>: マイク入力機能（音声認識・録音が可能な端末）</p>
                <p>・<strong>通信環境</strong>: 安定したインターネット接続環境</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="border-t border-border pt-6 flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <Link href="/terms" className="hover:underline">利用規約</Link>
            <span>•</span>
            <Link href="/privacy" className="hover:underline">プライバシーポリシー</Link>
          </div>
          <p>© {new Date().getFullYear()} ShadowLog. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
