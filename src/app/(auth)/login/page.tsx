"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, Mail, Lock, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      setIsSuccess(true);
      setMessage("ログインに成功しました。ダッシュボードへ移動します...");
      // Upgrade guest state to registered user & grant +15 tickets
      if (typeof window !== "undefined") {
        const { upgradeGuestToRegisteredUser } = await import("@/lib/storage/ticket-store");
        upgradeGuestToRegisteredUser(email);
        window.dispatchEvent(new Event("shadowlog:ticket-update"));
      }
      window.location.href = "/";
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "ログインに失敗しました";
      setIsSuccess(false);
      setMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-background">
      <div className="max-w-md w-full space-y-8 bg-card p-8 sm:p-10 rounded-3xl border border-border shadow-sm">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary text-primary-foreground shadow-sm mb-2">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">
            Shadow<span className="text-primary">Log</span> にログイン
          </h2>
          <p className="text-xs text-muted-foreground">
            アカウントにサインインして学習ログを保存（無料会員登録で追加15回チケット ＆ Pro味見2回プレゼント！）
          </p>
        </div>

        {/* Status Message */}
        {message && (
          <div
            className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
              isSuccess
                ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-600"
                : "bg-destructive/10 border border-destructive/20 text-destructive"
            }`}
          >
            {isSuccess ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{message}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">メールアドレス</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-muted-foreground" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">パスワード</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-muted-foreground" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 disabled:opacity-50 transition shadow-sm active:scale-98 flex items-center justify-center gap-2"
          >
            {isSubmitting ? "サインイン中..." : "サインイン"}
            <ArrowRight className="w-4 h-4" />
          </button>

          <p className="text-[11px] text-muted-foreground text-center pt-2 leading-relaxed">
            サインインまたはアカウント作成により、
            <Link href="/terms" className="text-primary underline mx-0.5">利用規約</Link> および
            <Link href="/privacy" className="text-primary underline mx-0.5">プライバシーポリシー</Link>
            に同意したものとみなされます。
          </p>
        </form>

        <div className="pt-4 border-t border-border text-center">
          <Link
            href="/"
            className="text-xs text-muted-foreground hover:text-foreground transition underline underline-offset-4"
          >
            ログインせずに体験する (ゲストモード) →
          </Link>
        </div>
      </div>
    </div>
  );
}
