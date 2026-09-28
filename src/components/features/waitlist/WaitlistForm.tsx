"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, Loader2, Mail, Sparkles, AlertCircle } from "lucide-react";

interface WaitlistFormProps {
  sourceLocation?: string; // e.g. "hero", "footer"
  className?: string;
}

export function WaitlistForm({ sourceLocation = "hero", className = "" }: WaitlistFormProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmed = email.trim();
    if (!trimmed) {
      setErrorMessage("メールアドレスを入力してください。");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setErrorMessage("有効なメールアドレス形式を入力してください。");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: trimmed,
          metadata: {
            source: sourceLocation,
            referrer: typeof document !== "undefined" ? document.referrer : "",
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "登録に失敗しました。時間をおいて再度お試しください。");
      }

      setIsSuccess(true);
      setIsDuplicate(Boolean(data.alreadyRegistered));
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "通信エラーが発生しました。インターネット接続をご確認ください。"
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className={`p-6 sm:p-7 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-left transition-all duration-300 animate-in fade-in zoom-in-95 ${className}`}>
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
              <span>{isDuplicate ? "ご登録確認完了！" : "🎉 事前登録が完了しました！"}</span>
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {isDuplicate
                ? "すでにウェイティングリストへご登録いただいております。2026年11月の正式リリース日に、14日間無料体験クーポンコードと一緒にお知らせいたします！"
                : "ご登録いただいたメールアドレスへ確認メールをお送りしました。2026年11月の正式リリース日に、14日間無料体験クーポンコードと一緒にお届けします。"}
            </p>
            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                <Sparkles className="w-3.5 h-3.5" />
                <span>特典: 14日間無料体験クーポン進呈対象</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
              <Mail className="w-4 h-4" />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="name@example.com"
              disabled={isLoading}
              className="w-full pl-10 pr-4 py-3.5 rounded-2xl bg-card border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition shadow-sm disabled:opacity-50"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm sm:text-base hover:opacity-90 active:scale-[0.98] transition-all shadow-md shrink-0 disabled:opacity-60 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>登録中...</span>
              </>
            ) : (
              <>
                <span>14日間無料で事前登録する</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {errorMessage && (
          <div className="flex items-center gap-1.5 text-xs text-rose-500 font-medium px-1">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <p className="text-[11px] text-muted-foreground text-center sm:text-left leading-normal px-1">
          ※ 2026年11月の正式リリース時に限定クーポンをお届けします。迷惑メールは一切送信いたしません。
        </p>
      </form>
    </div>
  );
}
