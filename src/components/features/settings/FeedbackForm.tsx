"use client";

import { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  Bug,
  Mic,
  Lightbulb,
  HelpCircle,
  FileText,
  Upload,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Clock,
  Trash2,
  Paperclip,
  Mail,
  Hash,
} from "lucide-react";
import { collectClientEnvironmentInfo } from "@/lib/feedback/env-collector";
import {
  FeedbackCategoryType,
  FeedbackHistoryItem,
  getFeedbackHistory,
  addFeedbackHistoryItem,
  deleteFeedbackHistoryItem,
  clearFeedbackHistory,
} from "@/lib/feedback/feedback-history-store";

interface CategoryOption {
  key: FeedbackCategoryType;
  label: string;
  icon: typeof Bug;
  desc: string;
}

const CATEGORIES: CategoryOption[] = [
  { key: "bug", label: "不具合・エラー", icon: Bug, desc: "画面崩れやボタンが反応しない等" },
  { key: "audio_mic", label: "音声・マイク", icon: Mic, desc: "AirPods等の認識不良・録音停止等" },
  { key: "feature_request", label: "改善要望", icon: Lightbulb, desc: "新機能や使いやすさの提案" },
  { key: "question", label: "使い方・質問", icon: HelpCircle, desc: "機能の操作やプランについて" },
  { key: "other", label: "その他", icon: FileText, desc: "上記以外の自由なメッセージ" },
];

export function FeedbackForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState<FeedbackCategoryType>("bug");
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [screenshotBase64, setScreenshotBase64] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 送信履歴ステート
  const [history, setHistory] = useState<FeedbackHistoryItem[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);

  // 履歴の初期ロードとイベント同期
  useEffect(() => {
    const loadHistory = () => {
      setHistory(getFeedbackHistory());
    };
    loadHistory();

    const handleUpdate = () => {
      loadHistory();
    };
    window.addEventListener("shadowlog:feedback-history-update", handleUpdate);
    return () => {
      window.removeEventListener("shadowlog:feedback-history-update", handleUpdate);
    };
  }, []);

  // ログインユーザーのメール自動補完
  useEffect(() => {
    if (typeof window !== "undefined") {
      import("@/lib/storage/sync-service")
        .then(async ({ getAuthenticatedUser }) => {
          const user = await getAuthenticatedUser();
          if (user) {
            if (user.email) setEmail(user.email);
            if (user.id) setUserId(user.id);
          } else {
            // Check ticket store guest email
            try {
              const { getCurrentUserEmail } = await import("@/lib/storage/ticket-store");
              const guestEmail = getCurrentUserEmail();
              if (guestEmail) setEmail(guestEmail);
            } catch {}
          }
        })
        .catch(() => {});
    }
  }, []);

  // Handle image file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processImageFile(file);
  };

  const processImageFile = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      alert("画像サイズは5MB以下にしてください。");
      return;
    }
    if (!file.type.startsWith("image/")) {
      alert("画像ファイル（PNG, JPEG, WebP等）を選択してください。");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setScreenshotBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle clipboard paste
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith("image/")) {
        const file = items[i].getAsFile();
        if (file) {
          processImageFile(file);
          break;
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim()) {
      setErrorMessage("返信先のメールアドレスを入力してください。");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMessage("有効なメールアドレス形式で入力してください。");
      return;
    }
    if (!content.trim()) {
      setErrorMessage("ご報告・お問い合わせ内容を入力してください。");
      return;
    }

    setIsSubmitting(true);
    try {
      const environmentInfo = await collectClientEnvironmentInfo();

      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          email: email.trim(),
          content: content.trim(),
          screenshotBase64,
          environmentInfo,
          userId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "送信に失敗しました。");
      }

      // カテゴリ表示名を取得
      const matchedCategory = CATEGORIES.find((c) => c.key === category);
      const catLabel = matchedCategory ? matchedCategory.label : category;

      // 送信履歴を端末（LocalStorage）に保存
      const updatedHistory = addFeedbackHistoryItem({
        category,
        categoryLabel: catLabel,
        email: email.trim(),
        content: content.trim(),
        hasScreenshot: !!screenshotBase64,
        ticketId: data.ticketId,
      });
      setHistory(updatedHistory);
      if (updatedHistory.length > 0) {
        setExpandedId(updatedHistory[0].id); // 最新の履歴を自動展開
      }

      setIsSuccess(true);
      setContent("");
      setScreenshotBase64(null);
    } catch (err: unknown) {
      console.error(err);
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "送信中にエラーが発生しました。ネットワーク環境をご確認の上、再度お試しください。"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("このお問い合わせ履歴を削除しますか？")) {
      const updated = deleteFeedbackHistoryItem(id);
      setHistory(updated);
      if (expandedId === id) setExpandedId(null);
    }
  };

  const handleClearAllHistory = () => {
    if (window.confirm("送信履歴をすべて削除しますか？")) {
      clearFeedbackHistory();
      setHistory([]);
      setExpandedId(null);
    }
  };

  const toggleExpandHistory = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  // ── 送信履歴アコーディオンカード（共通コンポーネント） ──
  const renderHistorySection = () => {
    if (history.length === 0) return null;

    return (
      <div className="mt-4 pt-4 border-t border-border/80 space-y-3">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setIsHistoryOpen((prev) => !prev)}
            className="flex items-center gap-2 text-xs font-bold text-foreground hover:text-primary transition"
          >
            <Clock className="w-3.5 h-3.5 text-primary" />
            <span>送信したお問い合わせ履歴 ({history.length}件)</span>
            {isHistoryOpen ? (
              <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            )}
          </button>

          {isHistoryOpen && history.length > 0 && (
            <button
              type="button"
              onClick={handleClearAllHistory}
              className="text-[11px] text-muted-foreground hover:text-destructive transition flex items-center gap-1"
              title="すべての履歴を消去"
            >
              <Trash2 className="w-3 h-3" />
              <span>全消去</span>
            </button>
          )}
        </div>

        {isHistoryOpen && (
          <div className="space-y-2.5">
            {history.map((item) => {
              const isExpanded = expandedId === item.id;
              const dateStr = new Date(item.createdAt).toLocaleString("ja-JP", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-border bg-card/80 shadow-2xs overflow-hidden transition"
                >
                  {/* アコーディオン見出しヘッダー */}
                  <div
                    onClick={() => toggleExpandHistory(item.id)}
                    className="p-3 sm:p-3.5 cursor-pointer flex items-center justify-between gap-3 hover:bg-muted/40 transition select-none"
                  >
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-bold bg-primary/10 text-primary shrink-0">
                        {item.categoryLabel}
                      </span>
                      {item.hasScreenshot && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">
                          <Paperclip className="w-2.5 h-2.5" />
                          画像あり
                        </span>
                      )}
                      <span className="text-xs text-foreground font-medium truncate max-w-[200px] sm:max-w-md">
                        {item.content.replace(/\n/g, " ")}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] sm:text-xs text-muted-foreground">
                        {dateStr}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteHistoryItem(item.id, e)}
                        className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition"
                        title="この履歴を削除"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {/* 展開時：詳細内容 */}
                  {isExpanded && (
                    <div className="px-3.5 pb-3.5 pt-1 border-t border-border/50 bg-muted/20 text-xs space-y-2.5 animate-in fade-in duration-150">
                      <div className="flex items-center gap-4 text-muted-foreground text-[11px] flex-wrap pt-1">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-primary/70" />
                          返信先: <strong className="text-foreground font-medium">{item.email}</strong>
                        </span>
                        {item.ticketId && (
                          <span className="flex items-center gap-1 font-mono">
                            <Hash className="w-3 h-3 text-primary/70" />
                            番号: {item.ticketId.slice(0, 8)}
                          </span>
                        )}
                      </div>

                      <div className="bg-background rounded-lg p-3 border border-border/80 text-foreground leading-relaxed whitespace-pre-wrap word-break-break-word">
                        {item.content}
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-muted-foreground">
                          ※ この内容は端末内に安全に記録されています
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteHistoryItem(item.id, e)}
                          className="inline-flex items-center gap-1 text-[11px] text-destructive hover:underline font-medium"
                        >
                          <Trash2 className="w-3 h-3" />
                          この履歴を削除
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // ── 折りたたみ時（Collapsed state） ──
  if (!isOpen) {
    return (
      <div className="pt-2 space-y-3">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="w-full inline-flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-2xl border border-border bg-card hover:bg-muted text-foreground font-semibold text-sm transition shadow-sm active:scale-[0.98] min-h-[48px]"
        >
          <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <MessageSquare className="w-3.5 h-3.5" />
          </div>
          <span>不具合報告・お問い合わせ</span>
          <ChevronDown className="w-4 h-4 text-muted-foreground ml-auto" />
        </button>

        {/* 折りたたみ時でも送信履歴があればコンパクトに表示 */}
        {history.length > 0 && renderHistorySection()}
      </div>
    );
  }

  // ── 展開時（Expanded state） ──
  return (
    <div className="bg-card rounded-2xl p-5 sm:p-8 border border-border shadow-sm space-y-5 animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5 text-foreground font-bold text-base sm:text-lg">
          <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <MessageSquare className="w-4 h-4" />
          </div>
          <span>不具合報告・お問い合わせ・ご意見</span>
        </div>
        <button
          type="button"
          onClick={() => {
            setIsOpen(false);
            setIsSuccess(false);
            setErrorMessage(null);
          }}
          className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition"
          title="閉じる"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
        操作中の不具合や音声認識トラブル、機能の改善リクエストなど、どんな些細なことでもお気軽にお送りください。開発チームが直接確認し、迅速に対応いたします。
      </p>

      {isSuccess ? (
        <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-3 animate-in fade-in">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-foreground">送信が完了いたしました</h3>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            貴重なご報告・ご意見をありがとうございます。管理者へ正常に送信されました。
            送信いただいた内容は下記の「送信履歴」にていつでもご確認いただけます。
            内容を確認のうえ、ご登録のメールアドレスへ順次手動にてご連絡いたします。
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setIsSuccess(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-background border border-border hover:bg-muted text-foreground transition"
            >
              続けて別の報告を送る
            </button>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setIsSuccess(false);
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground transition"
            >
              閉じる
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          {/* Category Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground block">
              種別を選択 <span className="text-destructive">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {CATEGORIES.map((item) => {
                const Icon = item.icon;
                const isSelected = category === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setCategory(item.key)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-medium transition ${
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary shadow-xs font-bold"
                        : "bg-background border-border text-foreground hover:bg-muted hover:border-border/80"
                    }`}
                  >
                    <Icon className="w-4 h-4 mb-1.5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Email Address */}
          <div className="space-y-1.5">
            <label htmlFor="feedback-email" className="text-xs font-bold text-foreground block">
              ご連絡先メールアドレス <span className="text-destructive">*</span>
            </label>
            <input
              id="feedback-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full p-3 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
              required
            />
            <p className="text-[11px] text-muted-foreground">
              ※ ご返信や対応完了のご連絡に使用いたします
            </p>
          </div>

          {/* Content Textarea */}
          <div className="space-y-1.5">
            <label htmlFor="feedback-content" className="text-xs font-bold text-foreground block">
              ご報告・お問い合わせ内容 <span className="text-destructive">*</span>
            </label>
            <textarea
              id="feedback-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onPaste={handlePaste}
              rows={4}
              placeholder="発生した現象、操作した画面やタイミングをご記入ください（例: AirPods接続時に録音が途中で止まる、短文モードで文字がずれる、など）"
              className="w-full p-3.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition leading-relaxed resize-y min-h-[100px]"
              required
            />
          </div>

          {/* Screenshot Upload & Preview */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground block">
              スクリーンショット添付（任意）
            </label>

            {screenshotBase64 ? (
              <div className="relative inline-block border border-border rounded-xl p-2 bg-muted/30">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={screenshotBase64}
                  alt="添付画像プレビュー"
                  className="max-h-48 max-w-full rounded-lg object-contain"
                />
                <button
                  type="button"
                  onClick={() => setScreenshotBase64(null)}
                  className="absolute -top-2 -right-2 p-1.5 rounded-full bg-destructive text-white hover:opacity-90 shadow-sm transition"
                  title="画像を削除"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                  id="screenshot-file-input"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-dashed border-border bg-background hover:bg-muted text-xs font-medium text-muted-foreground hover:text-foreground transition"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>画像をアップロード (PNG / JPG / WebP, 最大5MB)</span>
                </button>
              </div>
            )}
            <p className="text-[10px] text-muted-foreground">
              ※ エラー画面や表示崩れのスクショを添付いただくと、原因特定がスムーズになります
            </p>
          </div>

          {/* Environment Auto-collection Note */}
          <div className="p-3 rounded-xl bg-muted/40 border border-border/60 text-[11px] text-muted-foreground flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary/60 shrink-0" />
            <span>
              調査を迅速に行うため、お使いの端末・ブラウザ環境情報、接続マイク情報が自動で付加されます。
            </span>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-1 flex items-center justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition shadow-sm active:scale-95 disabled:opacity-50 disabled:pointer-events-none text-sm min-h-[44px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>送信中...</span>
                </>
              ) : (
                <>
                  <MessageSquare className="w-4 h-4" />
                  <span>不具合・意見を送信する</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* 送信履歴アコーディオンセクション */}
      {renderHistorySection()}
    </div>
  );
}
