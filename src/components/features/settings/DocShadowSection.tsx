"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Youtube,
  Globe,
  FileText,
  Sparkles,
  Trash2,
  CheckCircle2,
  Play,
  Loader2,
  AlertCircle,
  ExternalLink,
  Layers,
  ArrowRight,
} from "lucide-react";
import { UserPlanType } from "@/types";
import {
  ScrapSource,
  ScrapSourceType,
  MAX_PRO_SCRAP_SOURCES,
  getScrapStore,
  addScrapSource,
  deleteScrapSource,
  setActiveScrapSource,
  isScrapEligible,
} from "@/lib/storage/scrap-store";

interface DocShadowSectionProps {
  plan?: UserPlanType;
  onSelectScrapPassage?: (passage: string, title: string, wpm?: number) => void;
  className?: string;
}

export function DocShadowSection({
  plan = "free",
  onSelectScrapPassage,
  className = "",
}: DocShadowSectionProps) {
  const eligible = isScrapEligible(plan);
  const [activeTab, setActiveTab] = useState<ScrapSourceType>("youtube");
  const [inputVal, setInputVal] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorSuggestion, setErrorSuggestion] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [sources, setSources] = useState<ScrapSource[]>([]);
  const [activeSourceId, setActiveSourceId] = useState<string | null>(null);

  const loadData = () => {
    const store = getScrapStore();
    setSources(store.sources);
    setActiveSourceId(store.activeSourceId);
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener("shadowlog:scrap-update", handleUpdate);
    return () => window.removeEventListener("shadowlog:scrap-update", handleUpdate);
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim() || isLoading) return;
    setErrorMessage(null);
    setErrorSuggestion(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/scrap/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: activeTab,
          input: inputVal.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.suggestion) {
          setErrorSuggestion(data.suggestion);
        }
        throw new Error(data.error || "生成に失敗しました");
      }

      const addResult = addScrapSource({
        type: activeTab,
        title: data.title,
        extractedPassage: data.passage,
        japaneseTranslation: data.translation,
        summary: data.summary,
        sourceUrl: data.sourceUrl,
        targetWpm: data.targetWpm,
      });

      if (!addResult.success) {
        throw new Error(addResult.error || "スクラップの保存に失敗しました");
      }

      setInputVal("");
      setSuccessMessage(`✨ 「${data.title}」から実践シャドーイング教材を生成・登録しました！`);
      if (onSelectScrapPassage && data.passage) {
        onSelectScrapPassage(data.passage, data.title, data.targetWpm);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteScrapSource(id);
  };

  const handleSelectSource = (source: ScrapSource) => {
    setActiveScrapSource(source.id);
    if (onSelectScrapPassage) {
      onSelectScrapPassage(source.extractedPassage, source.title, source.targetWpm);
    }
  };

  const isFull = sources.length >= MAX_PRO_SCRAP_SOURCES;

  return (
    <div
      id="section-doc-shadow"
      className={`rounded-2xl border border-indigo-500/25 bg-gradient-to-br from-indigo-500/[0.06] via-purple-500/[0.03] to-card p-4 sm:p-6 shadow-sm space-y-5 ${className}`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-center text-indigo-500 shrink-0 shadow-2xs">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-1.5">
                <span>マイスクラップ (Doc Shadow)</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-2xs">
                  Pro限定
                </span>
              </h3>
            </div>
            <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
              YouTube動画・Web記事・ドキュメントから、自分専用のリアル長文教材を自動抽出
            </p>
          </div>
        </div>

        {/* Source quota badge */}
        <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-muted-foreground self-start sm:self-auto bg-background/60 px-2.5 py-1 rounded-lg border border-border/60">
          <span>スクラップ保存枠:</span>
          <span className={isFull ? "text-amber-500" : "text-indigo-500"}>
            {sources.length} / {MAX_PRO_SCRAP_SOURCES}
          </span>
        </div>
      </div>

      {!eligible ? (
        // Locked State for Free / Base
        <div className="rounded-xl border border-dashed border-indigo-500/30 bg-background/50 p-5 text-center space-y-3">
          <div className="inline-flex p-3 rounded-full bg-indigo-500/10 text-indigo-400 mb-1">
            <Sparkles className="w-6 h-6" />
          </div>
          <h4 className="text-xs sm:text-sm font-bold text-foreground">
            好きなYouTubeや記事から、あなた専用の教材を作れます
          </h4>
          <p className="text-[11px] sm:text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
            「この海外動画のセリフを喋れるようになりたい」「この海外記事の表現で練習したい」をワンクリックでシャドーイング文に自動変換。Proプラン（月額1,000円）で最大5ソースまで登録・特訓できます。
          </p>
          <div className="pt-2">
            <Link
              href="/settings?section=plan"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold rounded-xl hover:opacity-95 transition shadow-sm active:scale-95"
            >
              <span>Proプランでマイスクラップを解放 (¥1,000/月)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      ) : (
        // Active Pro UI
        <div className="space-y-4">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-background/70 border border-border/70 max-w-md">
            <button
              type="button"
              onClick={() => {
                setActiveTab("youtube");
                setErrorMessage(null);
                setErrorSuggestion(null);
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-bold transition ${
                activeTab === "youtube"
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Youtube className="w-3.5 h-3.5 text-rose-400" />
              <span>YouTube</span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-rose-500/20 text-rose-300 hidden xs:inline">
                推奨
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("web");
                setErrorMessage(null);
                setErrorSuggestion(null);
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-bold transition ${
                activeTab === "web"
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-sky-400" />
              <span>Web記事URL</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("text");
                setErrorMessage(null);
                setErrorSuggestion(null);
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-bold transition ${
                activeTab === "text"
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>PDF/テキスト</span>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleGenerate} className="space-y-3">
            {activeTab === "youtube" && (
              <div>
                <label className="text-[11px] font-bold text-foreground block mb-1">
                  YouTubeの共有リンク（URLまたは動画ID）
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    placeholder="例: https://youtu.be/dQw4w9WgXcQ (スマホから共有リンクをペースト)"
                    disabled={isLoading || isFull}
                    className="w-full pl-3 pr-20 py-2.5 text-xs rounded-xl bg-background border border-border focus:border-indigo-500 focus:outline-none transition"
                  />
                  {inputVal && (
                    <button
                      type="button"
                      onClick={() => setInputVal("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                    >
                      クリア
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  💡 英語字幕（自動生成字幕含む）が有効な動画から、AIがシャドーイングに最適な3〜4文の長文パートを自動抽出します。
                </p>
              </div>
            )}

            {activeTab === "web" && (
              <div>
                <label className="text-[11px] font-bold text-foreground block mb-1">
                  Webニュース・ブログ記事のURL
                </label>
                <input
                  type="text"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  placeholder="例: https://techcrunch.com/... や BBCなどの英文記事URL"
                  disabled={isLoading || isFull}
                  className="w-full px-3 py-2.5 text-xs rounded-xl bg-background border border-border focus:border-indigo-500 focus:outline-none transition"
                />
              </div>
            )}

            {activeTab === "text" && (
              <div>
                <label className="text-[11px] font-bold text-foreground block mb-1">
                  PDFからコピーした英文・社内資料・論文抜粋
                </label>
                <textarea
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  placeholder="シャドーイングしたい英文をここに貼り付けてください（長文でもAIが適切なパートを抜粋・整形します）"
                  rows={4}
                  disabled={isLoading || isFull}
                  className="w-full px-3 py-2.5 text-xs rounded-xl bg-background border border-border focus:border-indigo-500 focus:outline-none transition leading-relaxed resize-none"
                />
              </div>
            )}

            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs space-y-2 animate-in fade-in">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="font-medium leading-relaxed">{errorMessage}</span>
                </div>
                {errorSuggestion && (
                  <div className="pt-2 border-t border-destructive/20 text-muted-foreground flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <p className="text-[11px] leading-relaxed text-foreground/80">💡 {errorSuggestion}</p>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab("text");
                        setInputVal("");
                        setErrorMessage(null);
                        setErrorSuggestion(null);
                      }}
                      className="self-start sm:self-auto shrink-0 px-2.5 py-1 text-[11px] font-bold rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition shadow-2xs"
                    >
                      PDF/テキスト入力に切替
                    </button>
                  </div>
                )}
              </div>
            )}

            {successMessage && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-muted-foreground">
                {isFull ? "⚠️ 上限に達しています。新しいソースを登録するには下から削除してください。" : ""}
              </span>
              <button
                type="submit"
                disabled={isLoading || !inputVal.trim() || isFull}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold rounded-xl hover:opacity-95 transition shadow-xs disabled:opacity-50 active:scale-95 cursor-pointer ml-auto"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>解析＆教材生成中...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>このソースから教材を作成</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Registered Scrap List */}
          {sources.length > 0 && (
            <div className="pt-3 border-t border-border/60 space-y-2.5">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                登録済みスクラップ教材一覧 ({sources.length}/{MAX_PRO_SCRAP_SOURCES})
              </span>
              <div className="grid grid-cols-1 gap-2">
                {sources.map((item) => {
                  const isActive = item.id === activeSourceId;
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelectSource(item)}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-start justify-between gap-3 ${
                        isActive
                          ? "bg-indigo-500/15 border-indigo-500/50 shadow-xs"
                          : "bg-background/60 hover:bg-background border-border/70 hover:border-border"
                      }`}
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {item.type === "youtube" ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                              <Youtube className="w-2.5 h-2.5" /> YouTube
                            </span>
                          ) : item.type === "web" ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30">
                              <Globe className="w-2.5 h-2.5" /> Web記事
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                              <FileText className="w-2.5 h-2.5" /> テキスト
                            </span>
                          )}

                          <span className="text-xs font-bold text-foreground truncate max-w-[220px] sm:max-w-[340px]">
                            {item.title}
                          </span>

                          {item.targetWpm && (
                            <span className="text-[10px] font-mono text-muted-foreground">
                              (目標 WPM {item.targetWpm})
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                          {item.extractedPassage}
                        </p>

                        {item.japaneseTranslation && (
                          <p className="text-[10px] text-muted-foreground/80 line-clamp-1 italic">
                            訳: {item.japaneseTranslation}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        <button
                          type="button"
                          onClick={() => handleSelectSource(item)}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition flex items-center gap-1 shadow-2xs"
                        >
                          <Play className="w-3 h-3 fill-white" />
                          <span>練習</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDelete(item.id, e)}
                          className="p-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition"
                          title="削除"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
