"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, Mail, Lock, ArrowRight, CheckCircle2, AlertCircle, UserPlus, LogIn } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { migrateGuestDataToSupabase } from "@/lib/storage/sync-service";

export default function LoginPage() {
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Google OAuth Login
  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    setMessage(null);
    try {
      const supabase = createClient();
      const redirectUrl = typeof window !== "undefined"
        ? `${window.location.origin}/auth/callback?next=/?auth=success`
        : "/auth/callback";

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) throw error;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Googleログインの開始に失敗しました";
      setIsSuccess(false);
      setMessage(msg);
      setIsSubmitting(false);
    }
  };

  // Email/Password Submit (Login or Signup)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const supabase = createClient();

      if (authMode === "signup") {
        // Sign Up Flow
        const redirectUrl = typeof window !== "undefined"
          ? `${window.location.origin}/auth/callback?next=/?auth=success`
          : "/auth/callback";

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
          },
        });

        if (error) throw error;

        // Check if session established directly (e.g. email confirmation disabled)
        if (data.session) {
          setIsSuccess(true);
          setMessage("会員登録が完了しました！ゲストデータを引き継いでダッシュボードへ移動します...");
          if (typeof window !== "undefined") {
            const { upgradeGuestToRegisteredUser } = await import("@/lib/storage/ticket-store");
            upgradeGuestToRegisteredUser(email);
            await migrateGuestDataToSupabase();
            window.dispatchEvent(new Event("shadowlog:ticket-update"));
          }
          setTimeout(() => {
            window.location.href = "/";
          }, 800);
        } else {
          setIsSuccess(true);
          setMessage("登録確認メールを送信しました。受信トレイをご確認の上、メール内のリンクをクリックしてください。");
        }
      } else {
        // Sign In Flow
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        setIsSuccess(true);
        setMessage("ログインに成功しました。学習データを同期してダッシュボードへ移動します...");
        // Upgrade guest state to registered user & grant +15 tickets
        if (typeof window !== "undefined") {
          const { upgradeGuestToRegisteredUser } = await import("@/lib/storage/ticket-store");
          upgradeGuestToRegisteredUser(email);
          await migrateGuestDataToSupabase();
          window.dispatchEvent(new Event("shadowlog:ticket-update"));
        }
        setTimeout(() => {
          window.location.href = "/";
        }, 600);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : `${authMode === "signup" ? "新規登録" : "ログイン"}に失敗しました`;
      setIsSuccess(false);
      setMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVipQuickLogin = async () => {
    setIsSubmitting(true);
    setMessage(null);
    try {
      const vipEmail = "shadowlog.app@gmail.com";
      if (typeof window !== "undefined") {
        const { upgradeGuestToRegisteredUser } = await import("@/lib/storage/ticket-store");
        upgradeGuestToRegisteredUser(vipEmail);
        localStorage.setItem("shadowlog_user_email", vipEmail);
        await migrateGuestDataToSupabase();
        window.dispatchEvent(new Event("shadowlog:ticket-update"));
      }
      setIsSuccess(true);
      setMessage("👑 VIPテスターモードでログインしました。ダッシュボードへ移動します...");
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
    } catch {
      setIsSuccess(false);
      setMessage("VIPテスターログインに失敗しました");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-background">
      <div className="max-w-md w-full space-y-6 bg-card p-6 sm:p-10 rounded-3xl border border-border shadow-sm">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary text-primary-foreground shadow-sm mb-2">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">
            Shadow<span className="text-primary">Log</span>
          </h2>
          <p className="text-xs text-muted-foreground">
            アカウント登録でゲスト時の練習ログをすべてクラウド同期！
          </p>
          <div className="inline-block px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-[11px] font-bold text-amber-700 dark:text-amber-300">
            🎁 無料会員登録で +15チケット ＆ Pro味見2回プレゼント
          </div>
        </div>

        {/* Tab Selector: Login vs Sign Up */}
        <div className="grid grid-cols-2 p-1 bg-muted/60 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setAuthMode("login");
              setMessage(null);
            }}
            className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              authMode === "login"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            ログイン
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode("signup");
              setMessage(null);
            }}
            className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              authMode === "signup"
                ? "bg-card text-foreground shadow-xs text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            無料新規登録
          </button>
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
            <span className="leading-relaxed">{message}</span>
          </div>
        )}

        {/* Google One-Click Login */}
        <div>
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isSubmitting}
            className="w-full py-3 px-4 rounded-xl border border-border bg-card hover:bg-muted/60 text-foreground font-bold text-sm transition shadow-2xs active:scale-98 flex items-center justify-center gap-3 cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Googleで{authMode === "signup" ? "無料登録" : "ログイン"}</span>
          </button>
        </div>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-border w-full" />
          <span className="bg-card px-3 text-[11px] text-muted-foreground uppercase tracking-wider shrink-0">
            またはメールアドレスで
          </span>
          <div className="border-t border-border w-full" />
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
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
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={authMode === "signup" ? "6文字以上のパスワード" : "••••••••"}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 disabled:opacity-50 transition shadow-sm active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              "処理中..."
            ) : authMode === "signup" ? (
              <>
                <span>無料アカウントを作成</span>
                <UserPlus className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>サインイン</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <p className="text-[11px] text-muted-foreground text-center pt-2 leading-relaxed">
            アカウント登録・ログインにより、
            <Link href="/terms" className="text-primary underline mx-0.5">利用規約</Link> および
            <Link href="/privacy" className="text-primary underline mx-0.5">プライバシーポリシー</Link>
            に同意したものとみなされます。
          </p>
        </form>

        {/* Quick Tester VIP Sign-in */}
        <div className="pt-2">
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center space-y-2">
            <div className="text-xs font-bold text-amber-700 dark:text-amber-300 flex items-center justify-center gap-1.5">
              <span>👑</span>
              <span>オーナー・テスター専用モード</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              チケット無制限・全機能解放のVIPテスターアカウントで即時ログインできます
            </p>
            <button
              type="button"
              onClick={handleVipQuickLogin}
              disabled={isSubmitting}
              className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>🧪</span>
              <span>VIPテスターとしてクイックログイン</span>
            </button>
          </div>
        </div>

        <div className="pt-2 border-t border-border text-center">
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
