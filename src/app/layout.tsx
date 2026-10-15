import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { PageTracker } from "@/components/analytics/PageTracker";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#090d16" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL("https://shadowlog.vercel.app"),
  title: "ShadowLog (シャドーログ) | 発話可視化英語シャドーイング",
  description: "ベータ版無料配信中・誰でもお試し頂けます！11月から正式リリース開始。AI例文生成 × 音声認識Diff判定で挫折しないシャドーイング習慣化サービス",
  manifest: "/manifest.json",
  openGraph: {
    title: "ShadowLog (シャドーログ) | ベータ版配信中・誰でもお試し頂けます",
    description: "11月から正式リリース開始！AI音声認識Diff判定で発話を可視化するシャドーイング習慣化アプリ。",
    url: "https://shadowlog.vercel.app",
    siteName: "ShadowLog",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ShadowLog ベータ版配信中 | 11月から正式リリース開始！誰でもお試し頂けます。",
      },
    ],
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ShadowLog (シャドーログ) | ベータ版無料配信中",
    description: "誰でもお試し頂けます！11月から正式リリース開始！声に出して身につける新しい英語習慣。",
    images: ["/og-image.png"],
  },
  icons: {
    icon: [
      { url: "/icons/favicon-16x16.png?v=2", sizes: "16x16", type: "image/png" },
      { url: "/icons/favicon-32x32.png?v=2", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png?v=2", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png?v=2", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ShadowLog",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/20">
        {children}
        <PageTracker />
        <Analytics />
      </body>
    </html>
  );
}
