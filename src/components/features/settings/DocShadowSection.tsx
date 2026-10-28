"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Youtube,
  Globe,
  FileText,
  Upload,
  Sparkles,
  Trash2,
  CheckCircle2,
  Play,
  Loader2,
  AlertCircle,
  Layers,
  ArrowRight,
  X,
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
  setGenerationSource,
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
  const [selectedPdfFile, setSelectedPdfFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setErrorMessage("PDFファイル（.pdf）のみ選択できます。");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage("PDFファイルのサイズは10MB以下にしてください。");
      return;
    }
    setErrorMessage(null);
    setErrorSuggestion(null);
    setSelectedPdfFile(file);
  };

  const handleClearFile = () => {
    setSelectedPdfFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const canSubmit =
    !isLoading &&
    sources.length < MAX_PRO_SCRAP_SOURCES &&
    (activeTab === "text"
      ? Boolean(selectedPdfFile || inputVal.trim())
      : Boolean(inputVal.trim()));

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setErrorMessage(null);
    setErrorSuggestion(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      let res: Response;
      let effectiveType: ScrapSourceType = activeTab;

      if (activeTab === "text" && selectedPdfFile) {
        effectiveType = "pdf";
        const formData = new FormData();
        formData.append("file", selectedPdfFile);
        res = await fetch("/api/scrap/parse", {
          method: "POST",
          body: formData,
        });
      } else {
        res = await fetch("/api/scrap/parse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: activeTab,
            input: inputVal.trim(),
          }),
        });
      }

      const data = await res.json();
      if (!res.ok) {
        if (data.suggestion) {
          setErrorSuggestion(data.suggestion);
        }
        throw new Error(data.error || "生成に失敗しました");
      }

      const addResult = addScrapSource({
        type: effectiveType,
        title: data.title,
        fileName: selectedPdfFile?.name,
        rawText: data.rawText || data.passage,
        extractedPassage: data.passage,
        japaneseTranslation: data.translation,
        summary: data.summary,
        sourceUrl: data.sourceUrl,
        targetWpm: data.targetWpm,
      });

      if (!addResult.success) {
        throw new Error(addResult.error || "スクラップの保存に失敗しました");
      }

      // Pin generation source to "scrap" so subsequent practice generates from this source
      setGenerationSource("scrap");

      setInputVal("");
      handleClearFile();
      setSuccessMessage(
        `✨ 「${data.title}」をマイスクラップに保存しました！次回以降もこの資料から毎回新しいフレーズを自動生成できます。`
      );
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

  const handleSelectSource = (source: ScrapSource, jumpToPractice = false) => {
    setActiveScrapSource(source.id);
    setGenerationSource("scrap");
    if (jumpToPractice && onSelectScrapPassage) {
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
              PDFファイル・YouTube・Web記事を保存し、次回以降もその内容から毎回新しいフレーズをAI生成
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
            好きなPDF資料・YouTube・記事から、あなた専用の教材を何度でも生成
          </h4>
          <p className="text-[11px] sm:text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
            PDFファイルや英語記事・動画を保存しておくと、アプリを開くたびにその資料の様々な箇所・切り口から新しいフレーズをAI生成。Proプラン（月額1,000円）で最大5ソースまで保存できます。
          </p>
          <div className="pt-2">
            <Link
              href="/settings?section=plans"
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
                activeTab === "text" || activeTab === "pdf"
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
                  💡 英語字幕データを全文保存し、練習するたびに動画内の異なる箇所から新しいフレーズを生成します。
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

            {(activeTab === "text" || activeTab === "pdf") && (
              <div className="space-y-3">
                {/* PDF File Upload Box */}
                <div>
                  <label className="text-[11px] font-bold text-foreground block mb-1">
                    ① PDFファイルをアップロード（社内資料・論文・教材PDF）
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleFileChange}
                    disabled={isLoading || isFull}
                    className="hidden"
                    id="scrap-pdf-file-input"
                  />
                  {selectedPdfFile ? (
                    <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span className="font-bold text-foreground truncate">
                          {selectedPdfFile.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          ({Math.round(selectedPdfFile.size / 1024)} KB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleClearFile}
                        className="p-1 rounded-lg hover:bg-background/60 text-muted-foreground hover:text-foreground"
                        title="ファイル選択を解除"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <label
                      htmlFor="scrap-pdf-file-input"
                      className={`flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-indigo-500/40 bg-background/60 hover:bg-indigo-500/5 transition text-xs font-bold text-indigo-600 dark:text-indigo-400 ${
                        isLoading || isFull ? "opacity-50 pointer-events-none" : "cursor-pointer"
                      }`}
                    >
                      <Upload className="w-4 h-4" />
                      <span>PDFファイルを選択して読み込む (.pdf / 最大10MB)</span>
                    </label>
                  )}
                </div>

                {/* Or direct text paste */}
                {!selectedPdfFile && (
                  <div>
                    <label className="text-[11px] font-bold text-foreground block mb-1">
                      ② または英文テキストを直接ペースト
                    </label>
                    <textarea
                      value={inputVal}
                      onChange={(e) => setInputVal(e.target.value)}
                      placeholder="PDFからコピーした英文や社内資料・スピーチ原稿をここに貼り付けてください（全文を保存し、毎回異なるパートからAIがフレーズを作成します）"
                      rows={4}
                      disabled={isLoading || isFull}
                      className="w-full px-3 py-2.5 text-xs rounded-xl bg-background border border-border focus:border-indigo-500 focus:outline-none transition leading-relaxed resize-none"
                    />
                  </div>
                )}
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
                disabled={!canSubmit}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold rounded-xl hover:opacity-95 transition shadow-xs disabled:opacity-50 active:scale-95 cursor-pointer ml-auto"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>解析＆保存中...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>このソースを保存して生成元に設定</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Registered Scrap List */}
          {sources.length > 0 && (
            <div className="pt-3 border-t border-border/60 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                  保存済みスクラップソース ({sources.length}/{MAX_PRO_SCRAP_SOURCES})
                </span>
                <span className="text-[10px] text-indigo-500 font-semibold">
                  タップして使用するソースを選択
                </span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {sources.map((item) => {
                  const isActive = item.id === activeSourceId;
                  const charCount = (item.rawText || item.extractedPassage || "").length;
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelectSource(item, false)}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-start justify-between gap-3 ${
                        isActive
                          ? "bg-indigo-500/15 border-indigo-500/50 ring-1 ring-indigo-500/30 shadow-xs"
                          : "bg-background/60 hover:bg-background border-border/70 hover:border-border"
                      }`}
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {isActive && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-600 text-white">
                              選択中
                            </span>
                          )}
                          {item.type === "youtube" ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                              <Youtube className="w-2.5 h-2.5" /> YouTube
                            </span>
                          ) : item.type === "web" ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30">
                              <Globe className="w-2.5 h-2.5" /> Web記事
                            </span>
                          ) : item.type === "pdf" ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                              <FileText className="w-2.5 h-2.5" /> PDF
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                              <FileText className="w-2.5 h-2.5" /> テキスト
                            </span>
                          )}

                          <span className="text-xs font-bold text-foreground truncate max-w-[200px] sm:max-w-[320px]">
                            {item.title}
                          </span>

                          <span className="text-[10px] font-mono text-muted-foreground">
                            ({charCount.toLocaleString()}文字保存済)
                          </span>
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
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectSource(item, true);
                          }}
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
