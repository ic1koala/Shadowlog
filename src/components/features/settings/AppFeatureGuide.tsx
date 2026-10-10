"use client";

import { useState } from "react";
import {
  HelpCircle,
  Headphones,
  Mic,
  RotateCcw,
  Sparkles,
  BookOpen,
  TrendingUp,
  Bell,
  Layers,
  ChevronRight,
  ChevronDown,
  X,
  CheckCircle2,
  Lightbulb,
} from "lucide-react";

interface FeatureItem {
  id: string;
  category: "practice" | "review" | "personalize";
  title: string;
  badge: string;
  icon: typeof Headphones;
  summary: string;
  description: string;
  tips: string[];
}

const FEATURES: FeatureItem[] = [
  {
    id: "shadowing",
    category: "practice",
    title: "AIリアルタイム・シャドーイング",
    badge: "基本練習",
    icon: Headphones,
    summary: "ネイティブ音声を聴きながら、影のように1〜2語遅れて復唱する王道のトレーニング。",
    description:
      "再生ボタンを押すと自然な英語音声が流れます。有線またはBluetoothイヤホンを装着し、音声のイントネーションやリズムを真似て発声してください。音声認識AI（Whisper）があなたの声をリアルタイムに文字起こしし、正確性とWPM（話速）を測定します。",
    tips: [
      "有線イヤホンや低遅延イヤホンの使用を推奨します。",
      "初めは聞き取れなくても、リズムと強弱を捉えて口を動かすことが上達の秘訣です。",
    ],
  },
  {
    id: "ondoku",
    category: "practice",
    title: "音読録音（リピーティング）",
    badge: "ステップ練習",
    icon: Mic,
    summary: "音声を聞いたあと、自分のタイミングで落ち着いて発音してチェックできる機能。",
    description:
      "いきなりシャドーイングするのが難しい場合は、「音読録音」ボタンをタップして自分のペースで1文ずつ丁寧に音読録音できます。単語ごとの発音や構文をじっくり確認したいときに最適です。",
    tips: [
      "シャドーイング前の準備運動として活用すると効果的です。",
      "一息で言えるまとまり（チャンク）を意識して発音してみましょう。",
    ],
  },
  {
    id: "karaoke",
    category: "practice",
    title: "カラオケ追従ハイライト",
    badge: "視覚サポート",
    icon: Sparkles,
    summary: "ネイティブの音声再生に合わせて、現在発話中の単語が青色太字でハイライト。",
    description:
      "音声の進行に合わせて画面上の英単語がスムーズに強調表示されます。どの単語がどのタイミングで発音されているか、どこで連結（リンキング）や脱落（リダクション）が起きているかを視覚的に追いかけることができます。",
    tips: [
      "文字の配置がブレない固定レイアウト設計を採用しています。",
      "目を離してもすぐ元の位置に視線を戻せます。",
    ],
  },
  {
    id: "word-flip",
    category: "practice",
    title: "英単語タップでフリップ＆自動記録",
    badge: "語彙力強化",
    icon: BookOpen,
    summary: "フレーズカード内の単語をタップすると日本語の意味にくるっとフリップ。",
    description:
      "文中で意味が分からない単語があれば、カード上の単語をタップするだけで日本語訳を確認できます。さらに、一度調べた単語は自動的に「復習カルテ」内のつまずき単語帳へ『調べた単語』として保存されます。",
    tips: [
      "タップした単語は後から音声再生ボタンで発音を何度も確認できます。",
      "復習カルテで覚えた単語には「克服チェック」をつけて整理できます。",
    ],
  },
  {
    id: "review-carte",
    category: "review",
    title: "総合復習カルテ＆週次弱点分析",
    badge: "弱点克服",
    icon: TrendingUp,
    summary: "発話ミスやつまずき単語の蓄積と、毎週月曜日に更新される総合弱点レポート。",
    description:
      "復習カルテでは、これまでに練習したセッション履歴とAIコーチの個別フィードバックをいつでも見返せます。さらに「総合弱点分析」タブでは、直近の練習データから脱落音・置換音の傾向やリンキングの課題をAIが週次で分析し、具体的な練習プランを提案します。",
    tips: [
      "週に1度、月曜日のレポート更新に合わせて復習を行うと効果的です。",
      "AIコーチのアドバイスにある『フォーカスポイント』を意識して再練習しましょう。",
    ],
  },
  {
    id: "assessment",
    category: "review",
    title: "アダプティブ・レベル判定テスト",
    badge: "実力診断",
    icon: Layers,
    summary: "わずか3〜5問（2〜3分）でA1〜C1の英語レベルを的確に自動判定。",
    description:
      "あなたの解答精度に合わせて出題難易度が自動調整されるアダプティブ方式のテストです。発話の正確性だけでなく、ネイティブ話速への追従度（WPM追従度）を加味した総合スコアから、今のあなたに最適な学習難易度を導き出します。",
    tips: [
      "設定画面からいつでも再受講して成長度を測ることができます。",
      "判定結果をワンタップで日々の学習設定に即時反映できます。",
    ],
  },
  {
    id: "reminders",
    category: "personalize",
    title: "習慣化リマインド通知（複数設定）",
    badge: "継続サポート",
    icon: Bell,
    summary: "ワンタップで選べるプリセットと最大5つの自由時間設定。スマートスキップ対応。",
    description:
      "生活リズムに合わせて、朝・昼・夜など複数の通知時刻を自由に設定できます。その日に1回でもシャドーイングを完了していれば自動で通知をお休みする『スマートスキップ』機能を備えており、無理なくストリーク（連続記録）を継続できます。",
    tips: [
      "iPhoneの場合はホーム画面に追加（PWA）することでプッシュ通知を受信できます。",
      "メール通知は一切送られないため、受信箱を汚しません。",
    ],
  },
  {
    id: "custom-words",
    category: "personalize",
    title: "カスタム生成用マイ単語",
    badge: "オーダーメイド",
    icon: Sparkles,
    summary: "自分が覚えたい英単語を登録すると、その単語を含んだ実践フレーズをAIが生成。",
    description:
      "実務でよく使う業界用語や、資格試験で覚えたい重要単語を登録しておくと、AIがその単語を自然に組み込んだシャドーイング練習文を自動的に作成します。",
    tips: [
      "最大3単語まで同時に登録可能です。",
      "日常会話からIT・ビジネスまで、設定した業種に応じた文脈で文が生成されます。",
    ],
  },
];

export function AppFeatureGuide() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<
    "all" | "practice" | "review" | "personalize"
  >("all");
  const [expandedFeatureId, setExpandedFeatureId] = useState<string | null>("shadowing");

  const filteredFeatures =
    selectedCategory === "all"
      ? FEATURES
      : FEATURES.filter((f) => f.category === selectedCategory);

  return (
    <div className="bg-card rounded-2xl border border-border shadow-xs overflow-hidden">
      {/* Group Header Row */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-left hover:bg-muted/30 transition-colors"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-foreground font-bold text-sm sm:text-base">
                アプリの使い方（機能一覧ガイド）
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold">
                全8機能
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
              シャドーイング・音読録音・単語フリップ・復習カルテなどの活用法
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium shrink-0">
          <span className="hidden sm:inline">{isOpen ? "閉じる" : "一覧を見る"}</span>
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${
              isOpen ? "rotate-180 text-primary" : "text-muted-foreground"
            }`}
          />
        </div>
      </button>

      {/* Expanded Content */}
      {isOpen && (
        <div className="p-4 sm:p-6 border-t border-border/60 bg-muted/20 space-y-4 animate-in fade-in-50 duration-200">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition shrink-0 ${
                selectedCategory === "all"
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              すべて ({FEATURES.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory("practice")}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition shrink-0 ${
                selectedCategory === "practice"
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              🎧 練習・録音 (4)
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory("review")}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition shrink-0 ${
                selectedCategory === "review"
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              📊 復習・診断 (2)
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory("personalize")}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition shrink-0 ${
                selectedCategory === "personalize"
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              ⚙️ 設定・習慣化 (2)
            </button>
          </div>

          {/* Feature List */}
          <div className="space-y-2.5">
            {filteredFeatures.map((feature) => {
              const Icon = feature.icon;
              const isExpanded = expandedFeatureId === feature.id;

              return (
                <div
                  key={feature.id}
                  className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-2xs transition"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedFeatureId((prev) => (prev === feature.id ? null : feature.id))
                    }
                    className="w-full p-3.5 sm:p-4 flex items-start justify-between gap-3 text-left hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-xs sm:text-sm text-foreground">
                            {feature.title}
                          </h4>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground border border-border">
                            {feature.badge}
                          </span>
                        </div>
                        <p className="text-[11px] sm:text-xs text-muted-foreground mt-1 leading-relaxed">
                          {feature.summary}
                        </p>
                      </div>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-muted-foreground shrink-0 mt-1 transition-transform duration-200 ${
                        isExpanded ? "rotate-180 text-primary" : ""
                      }`}
                    />
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 sm:px-5 sm:pb-5 border-t border-border/50 bg-muted/10 space-y-3 text-xs leading-relaxed animate-in fade-in-50 duration-200">
                      <p className="text-foreground/90">{feature.description}</p>

                      <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-1.5">
                        <p className="font-bold text-primary flex items-center gap-1.5 text-[11px]">
                          <Lightbulb className="w-3.5 h-3.5" />
                          上達のための活用ポイント
                        </p>
                        <ul className="space-y-1 text-[11px] text-muted-foreground pl-1">
                          {feature.tips.map((tip, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="text-primary font-bold">・</span>
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
