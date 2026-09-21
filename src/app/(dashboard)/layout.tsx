"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mic, BarChart2, Settings, Sparkles, GraduationCap } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "ダッシュボード", icon: BarChart2 },
    { href: "/practice", label: "練習", icon: Mic },
    { href: "/review", label: "復習カルテ", icon: GraduationCap },
    { href: "/settings", label: "設定", icon: Settings },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top Navbar — hidden on mobile, visible on sm+ */}
      <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/95 backdrop-blur-md hidden sm:block">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-sm group-hover:scale-105 transition">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg tracking-tight text-foreground">
              Shadow<span className="text-primary">Log</span>
            </span>
          </Link>

          <nav className="flex items-center gap-1 sm:gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition ${
                    isActive
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Mobile Top Bar — visible only on mobile */}
      <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/95 backdrop-blur-md sm:hidden safe-top">
        <div className="px-4 h-12 flex items-center justify-center">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-bold text-base tracking-tight text-foreground">
              Shadow<span className="text-primary">Log</span>
            </span>
          </Link>
        </div>
      </header>

      {/* Main Content Area — add bottom padding on mobile for bottom nav */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-5 sm:py-8 pb-24 sm:pb-8">
        {children}
      </main>

      {/* Desktop Footer — hidden on mobile */}
      <footer className="border-t border-border/80 py-6 text-center text-xs text-muted-foreground hidden sm:block">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} ShadowLog. All rights reserved.</p>
          <p>AIシャドーイング学習＆発話可視化プラットフォーム</p>
        </div>
      </footer>

      {/* Bottom Tab Navigation — mobile only */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border/80 sm:hidden safe-bottom">
        <div className="flex items-stretch justify-around h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center flex-1 gap-0.5 transition-colors min-h-[44px] ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground active:text-foreground"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : ""}`} />
                <span className={`text-[10px] leading-tight ${isActive ? "font-bold" : "font-medium"}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
