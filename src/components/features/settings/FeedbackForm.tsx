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
} from "lucide-react";
import { collectClientEnvironmentInfo } from "@/lib/feedback/env-collector";

type CategoryType = "bug" | "audio_mic" | "feature_request" | "question" | "other";

interface CategoryOption {
  key: CategoryType;
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
  const [category, setCategory] = useState<CategoryType>("bug");
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [screenshotBase64, setScreenshotBase64] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-fill logged in user email
  useEffect(() => {
    if (typeof window !== "undefined") {
      import("@/lib/storage/sync-service").then(async ({ getAuthenticatedUser }) => {
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
      }).catch(() => {});
    }
  }, []);

  // Handle image file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processImageFile(file);
  };

  const processImageFile = (file: File) => {
    // Validate file size (max 5MB)
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

  // Handle clipboard paste (Cmd+V / Ctrl+V)
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

  return (
    <div className="bg-card rounded-2xl p-5 sm:p-8 border border-border shadow-sm space-y-5">
      <div className="flex items-center gap-2.5 text-foreground font-bold text-base sm:text-lg">
        <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <MessageSquare className="w-4 h-4" />
        </div>
        <span>不具合報告・お問い合わせ・ご意見</span>
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
            貴重なご報告・ご意見をありがとうございます。受付確認メールを送信いたしました。内容を確認のうえ、必要に応じて順次ご連絡いたします。
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setIsSuccess(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-background border border-border hover:bg-muted text-foreground transition"
            >
              続けて別の報告を送る
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
            <div className="flex items-center justify-between">
              <label htmlFor="feedback-content" className="text-xs font-bold text-foreground block">
                ご報告・お問い合わせ内容 <span className="text-destructive">*</span>
              </label>
              <span className="text-[10px] text-muted-foreground">
                ※ 画像のクリップボード貼り付け (Cmd+V) も可能です
              </span>
            </div>
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
    </div>
  );
}
