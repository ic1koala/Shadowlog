"use client";

import { useState, useRef, useEffect } from "react";
import {
  ExternalLink,
  RefreshCw,
  Calculator,
  Sparkles,
  Users,
} from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";

interface ManagementDashboardSectionProps {
  onOpenCustomersTab?: () => void;
}

export function ManagementDashboardSection({
  onOpenCustomersTab,
}: ManagementDashboardSectionProps) {
  const [key, setKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === "SHADOWLOG_OPEN_CUSTOMERS") {
        if (onOpenCustomersTab) {
          onOpenCustomersTab();
          window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
          window.location.href = "/admin/customers";
        }
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onOpenCustomersTab]);

  const handleRefresh = () => {
    setIsLoading(true);
    setKey((prev) => prev + 1);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner / Actions Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-emerald-500/10 border border-primary/20 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <BrandLogo variant="icon" size="md" priority className="shrink-0" />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-bold text-foreground">
                ShadowLog 統括ダッシュボード
              </h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                <Sparkles className="w-3 h-3" />
                収益化ロードマップ ＆ 基本仕様設計書
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              ステージ別タスク進捗・デイリーアクセス解析・Threads広報CRM・マスター基本仕様設計書を一元管理できます。
            </p>
          </div>
        </div>

        {/* Quick External Links & Controls */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {onOpenCustomersTab && (
            <button
              type="button"
              onClick={() => {
                onOpenCustomersTab();
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 transition shadow-xs cursor-pointer"
            >
              <Users className="w-3.5 h-3.5" />
              <span>顧客管理タブへ</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-background border border-border hover:bg-muted text-foreground transition shadow-xs cursor-pointer"
            title="ダッシュボードを再読み込み"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>再読み込み</span>
          </button>

          <a
            href="/simulation.html"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 transition shadow-xs"
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>収益シミュレーター ↗</span>
          </a>

          <a
            href="/management.html"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition shadow-xs"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>全画面で開く ↗</span>
          </a>
        </div>
      </div>

      {/* Embedded Management Dashboard Frame */}
      <div className="relative w-full rounded-2xl border border-border shadow-sm overflow-hidden bg-background">
        {isLoading && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-xs flex items-center justify-center z-10">
            <div className="flex flex-col items-center gap-2 text-muted-foreground text-xs font-medium">
              <RefreshCw className="w-5 h-5 animate-spin text-primary" />
              <span>統括ダッシュボードを読み込み中...</span>
            </div>
          </div>
        )}

        <iframe
          key={key}
          ref={iframeRef}
          src="/management.html"
          title="ShadowLog 統括ダッシュボード"
          className="w-full h-[850px] sm:h-[950px] border-0 bg-slate-50"
          onLoad={() => setIsLoading(false)}
        />
      </div>
    </div>
  );
}
