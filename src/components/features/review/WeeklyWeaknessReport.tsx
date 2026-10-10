"use client";

import { useMemo } from "react";
import { WeakWord, StoredSession } from "@/types";
import {
  TrendingUp,
  Calendar,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  Sparkles,
  BookOpen,
  Mic,
  Award,
} from "lucide-react";

interface WeeklyWeaknessReportProps {
  sessions: StoredSession[];
  weakWords: WeakWord[];
  totalSessionCount: number;
  clearedCount: number;
}

// Function words (weak forms) that frequently get swallowed/reduced in natural English speech
const WEAK_FORM_WORDS = new Set([
  "to", "a", "an", "the", "of", "for", "in", "on", "at", "and", "but",
  "or", "as", "is", "are", "was", "were", "it", "that", "this", "can", "have"
]);

export function WeeklyWeaknessReport({
  sessions,
  weakWords,
  totalSessionCount,
  clearedCount,
}: WeeklyWeaknessReportProps) {
  // Compute current week label (e.g. 2026年10月 第2週) and date range
  const { weekLabel, weekPeriodText } = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    // Calculate week of month
    const firstDay = new Date(year, now.getMonth(), 1);
    const dayOfMonth = now.getDate();
    const weekNumber = Math.ceil((dayOfMonth + firstDay.getDay()) / 7);

    // Monday of current week
    const currentDay = now.getDay();
    const diffToMonday = (currentDay === 0 ? -6 : 1) - currentDay;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const formatShort = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`;
    return {
      weekLabel: `${year}年${month}月 第${weekNumber}週`,
      weekPeriodText: `${formatShort(monday)} (月) 〜 ${formatShort(sunday)} (日)`,
    };
  }, []);

  // Aggregate statistics
  const stats = useMemo(() => {
    const totalSessions = sessions.length;
    const clearRate = totalSessions > 0 ? Math.round((clearedCount / totalSessions) * 100) : 0;

    const avgAccuracy =
      totalSessions > 0
        ? Math.round(sessions.reduce((acc, s) => acc + s.accuracyScore, 0) / totalSessions)
        : 0;

    const sessionsWithWpm = sessions.filter((s) => s.wpm && s.wpm > 0);
    const avgWpm =
      sessionsWithWpm.length > 0
        ? Math.round(
            sessionsWithWpm.reduce((acc, s) => acc + (s.wpm || 0), 0) / sessionsWithWpm.length
          )
        : null;

    const missingWords = weakWords.filter((w) => w.type === "missing");
    const mismatchWords = weakWords.filter((w) => w.type === "mismatch");
    const lookedUpWords = weakWords.filter((w) => w.type === "looked_up");
    const masteredWords = weakWords.filter((w) => w.mastered);

    // Check how many missing words are weak grammatical forms (linking/reduction casualties)
    const weakFormMissingCount = missingWords.filter((w) =>
      WEAK_FORM_WORDS.has(w.word.toLowerCase())
    ).length;

    const contentMissingCount = missingWords.length - weakFormMissingCount;

    return {
      totalSessions,
      clearRate,
      avgAccuracy,
      avgWpm,
      missingCount: missingWords.length,
      mismatchCount: mismatchWords.length,
      lookedUpCount: lookedUpWords.length,
      masteredCount: masteredWords.length,
      weakFormMissingCount,
      contentMissingCount,
    };
  }, [sessions, weakWords, clearedCount]);

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* ── 1. Report Header Banner (Weekly Update) ── */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 text-white rounded-2xl p-5 sm:p-7 shadow-md space-y-3 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
          <TrendingUp className="w-32 h-32" />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold backdrop-blur-xs">
            <Calendar className="w-3.5 h-3.5 text-amber-300" />
            <span>総合弱点分析レポート（毎週月曜更新）</span>
          </div>
          <span className="text-xs text-blue-100 font-mono">
            対象期間: {weekPeriodText}
          </span>
        </div>

        <div className="space-y-1 relative z-10">
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            {weekLabel} 発話総合診断レポート
          </h2>
          <p className="text-xs sm:text-sm text-blue-100 leading-relaxed max-w-2xl">
            直近のシャドーイング・音読録音データおよび単語帳の蓄積をもとに、あなたの発話傾向・音の脱落・リズムの弱点を総合分析しています。
          </p>
        </div>
      </div>

      {/* ── 2. KPI Score Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Clear Rate */}
        <div className="bg-card p-4 rounded-2xl border border-border shadow-xs space-y-1">
          <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
            <Award className="w-3.5 h-3.5 text-emerald-500" />
            総合クリア率
          </span>
          <p className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
            {stats.clearRate}%
          </p>
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mt-1.5">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${stats.clearRate}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground pt-0.5">80%以上達成セッション</p>
        </div>

        {/* Avg Accuracy */}
        <div className="bg-card p-4 rounded-2xl border border-border shadow-xs space-y-1">
          <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
            平均正確性
          </span>
          <p className="text-2xl sm:text-3xl font-extrabold font-mono text-primary">
            {stats.avgAccuracy}%
          </p>
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mt-1.5">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${stats.avgAccuracy}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground pt-0.5">Whisper認識一致度</p>
        </div>

        {/* Avg WPM */}
        <div className="bg-card p-4 rounded-2xl border border-border shadow-xs space-y-1">
          <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
            <Mic className="w-3.5 h-3.5 text-indigo-500" />
            平均話速 (WPM)
          </span>
          <p className="text-2xl sm:text-3xl font-extrabold font-mono text-indigo-600 dark:text-indigo-400">
            {stats.avgWpm !== null ? stats.avgWpm : "測定中"}
          </p>
          <p className="text-[10px] text-muted-foreground pt-1.5">
            {stats.avgWpm !== null && stats.avgWpm >= 130
              ? "上級ペース（非常に滑らか）"
              : stats.avgWpm !== null && stats.avgWpm >= 100
              ? "標準ビジネスペース"
              : "基礎リズム定着ペース"}
          </p>
        </div>

        {/* Looked Up & Mastered */}
        <div className="bg-card p-4 rounded-2xl border border-border shadow-xs space-y-1">
          <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5 text-amber-500" />
            調べた単語 / 克服
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-amber-600 dark:text-amber-400">
              {stats.lookedUpCount}
            </span>
            <span className="text-xs text-muted-foreground font-mono">
              / 克服 {stats.masteredCount}語
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground pt-1.5">
            タップで確認した語彙数
          </p>
        </div>
      </div>

      {/* ── 3. Speech & Linking Tendency Analysis ── */}
      <div className="bg-card rounded-2xl p-5 sm:p-6 border border-border shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-sm sm:text-base text-foreground">
            音声認識・リンキング（音の繋がり）の総合分析
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-1">
          {/* Weak-form Reduction Analysis */}
          <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                弱形・前置詞の脱落傾向
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                脱落 {stats.weakFormMissingCount} 語
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {stats.weakFormMissingCount > 0
                ? "「to, of, a, the, in, that」などの短い前置詞・冠詞がモデル音声のスピードに押されて抜け落ちやすい傾向があります。息継ぎ（チャンク）を意識し、前後の単語と滑らかに繋げて発音しましょう。"
                : "短い機能語や前置詞の脱落が少なく、音の連続性が非常に綺麗にキープされています。"}
            </p>
          </div>

          {/* Consonant & Ending Sound Analysis */}
          <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5 text-blue-500" />
                語尾・破裂音の認識ズレ
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20">
                ズレ {stats.mismatchCount} 語
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {stats.mismatchCount > 0
                ? "過去形（-ed）や複数形（-s）、語尾の破裂音（t, d, k）の発音が弱くなると別の単語として認識されやすくなります。語尾を意識的に弾いて発声することで認識精度が大幅に向上します。"
                : "発音のズレが非常に少なく、クリアな子音・母音の再現ができています。"}
            </p>
          </div>
        </div>
      </div>

      {/* ── 4. Weekly Coaching Action Plan ── */}
      <div className="bg-card rounded-2xl p-5 sm:p-6 border-2 border-primary/20 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center">
            <Lightbulb className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-foreground">
              今週のAIコーチ重点アドバイス（週間アクションプラン）
            </h3>
            <p className="text-[11px] text-muted-foreground">
              次の1週間でスコアを伸ばすための具体的トレーニング指針
            </p>
          </div>
        </div>

        <div className="space-y-2.5 text-xs sm:text-sm text-foreground pt-1">
          <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
              1
            </span>
            <div className="space-y-0.5 leading-relaxed">
              <strong className="text-foreground font-bold">
                まずは「音読録音」で文構造とチャンク（/）を丁寧に捉える
              </strong>
              <p className="text-muted-foreground text-xs">
                最初からシャドーイングに入らず、まずは「音読録音」でお手本音声を止めて、意味の区切り（スラッシュ / ）ごとにゆっくり発声し息継ぎを安定させましょう。
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
              2
            </span>
            <div className="space-y-0.5 leading-relaxed">
              <strong className="text-foreground font-bold">
                調べた単語は単語帳のスピーカーで発音を2回聴いてから口に出す
              </strong>
              <p className="text-muted-foreground text-xs">
                「つまずき単語帳」に記録された「調べた単語」は、復習カルテのスピーカーアイコンをタップしてネイティブ発音を耳で確認してから文練習に挑むと定着率が倍増します。
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
              3
            </span>
            <div className="space-y-0.5 leading-relaxed">
              <strong className="text-foreground font-bold">
                仕上げに「シャドーイング録音」でモデル音声に追従する
              </strong>
              <p className="text-muted-foreground text-xs">
                フレーズの青字太文字ハイライト（カラオケ表示）を見ながら、イヤホン装着でお手本と同時に発話し、テンポ（WPM）と音の抑揚を身体に染み込ませましょう。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
