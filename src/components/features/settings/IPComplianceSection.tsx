"use client";

import { ShieldCheck, CheckCircle2, Scale, ExternalLink } from "lucide-react";
import Link from "next/link";
import { IP_COMPLIANCE_LOGS } from "@/lib/compliance/ip-log";

export function IPComplianceSection() {
  return (
    <div className="bg-card rounded-2xl border border-border p-5 sm:p-6 space-y-5 shadow-xs">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-foreground">
              IP（知財）コンプライアンス監査ログ
            </h2>
            <p className="text-xs text-muted-foreground">
              特許・商標・著作権等のリスクアセスメントおよび統括管理ステータス
            </p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            ランクA対策完了
          </span>
        </div>
      </div>

      {/* Summary Banner */}
      <div className="p-4 rounded-xl bg-muted/40 border border-border/60 text-xs sm:text-sm space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-foreground flex items-center gap-1.5">
            <Scale className="w-4 h-4 text-primary" />
            リリース前 知財ガバナンス評価: <span className="text-emerald-600 dark:text-emerald-400 font-bold">安全 (PASS)</span>
          </span>
          <span className="text-[11px] text-muted-foreground font-mono">監査日: 2026年9月28日</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          サードパーティ商標表記（Powered by OpenAI API）および生成AIの著作権侵害防止プロンプト制約（ランクA対策）をアプリコードに反映済み。基礎アルゴリズム（Needleman-Wunsch / Levenshtein）はパブリックドメインであることが確認されています。
        </p>
      </div>

      {/* Audit Log Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-foreground">
          <span>監査ログ履歴 ({IP_COMPLIANCE_LOGS.length}件)</span>
          <Link
            href="/terms"
            className="text-primary hover:underline inline-flex items-center gap-1 text-[11px]"
          >
            利用規約を見る <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        <div className="divide-y divide-border border border-border rounded-xl overflow-hidden text-xs">
          {IP_COMPLIANCE_LOGS.map((log) => (
            <div key={log.id} className="p-3 sm:p-4 space-y-2 bg-card hover:bg-muted/20 transition-colors">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      log.rank === "A"
                        ? "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                        : log.rank === "B"
                        ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                        : "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                    }`}
                  >
                    ランク {log.rank}
                  </span>
                  <span className="font-semibold text-foreground text-xs sm:text-sm">
                    {log.title}
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3 h-3" />
                  対応完了
                </span>
              </div>
              <p className="text-muted-foreground text-[11px] sm:text-xs">
                {log.details}
              </p>
              <div className="pt-1 flex items-center justify-between text-[10px] text-muted-foreground/80 font-mono">
                <span>措置: {log.actionTaken}</span>
                <span>担当: {log.reviewer}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
