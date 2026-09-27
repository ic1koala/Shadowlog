"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import {
  CalendarDays,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  ChevronDown,
  Gauge,
  Award,
  Info,
} from "lucide-react";
import { PracticeSession } from "@/types";
import {
  calculateWpmStats,
  WpmStatsResult,
} from "@/lib/storage/wpm-stats-calculator";

interface ActivityWpmCardProps {
  totalWords: number;
  totalSessions: number;
  averageAccuracy?: number;
  dailyCounts: Record<string, number>;
  sessions: PracticeSession[];
}

const WEEKDAYS_JA = ["日", "月", "火", "水", "木", "金", "土"] as const;

export function ActivityWpmCard({
  totalWords,
  totalSessions,
  averageAccuracy,
  dailyCounts,
  sessions,
}: ActivityWpmCardProps) {
  // ── WPM Stats ──
  const wpmStats: WpmStatsResult = useMemo(
    () => calculateWpmStats(sessions),
    [sessions]
  );

  // ── Accordion State for WPM Details ──
  const [isWpmOpen, setIsWpmOpen] = useState(false);
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  // ── Word Count Smooth Count-up Animation ──
  const [displayWordCount, setDisplayWordCount] = useState(0);
  useEffect(() => {
    const end = totalWords;
    if (end === 0) {
      setDisplayWordCount(0);
      return;
    }
    const duration = 800; // ms
    const frameRate = 1000 / 60;
    const totalFrames = Math.round(duration / frameRate);
    let frame = 0;

    const timer = setInterval(() => {
      frame++;
      const progress = frame / totalFrames;
      const current = Math.round(end * (1 - Math.pow(2, -10 * progress)));
      setDisplayWordCount(current);

      if (frame >= totalFrames) {
        setDisplayWordCount(end);
        clearInterval(timer);
      }
    }, frameRate);

    return () => clearInterval(timer);
  }, [totalWords]);

  // ── 14-Day Activity Heatmap Data ──
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const { days, totalPast2Weeks, activeDays, maxCount } = useMemo(() => {
    const list: Array<{
      dateKey: string;
      date: Date;
      dateLabel: string;
      weekdayLabel: string;
      isWeekend: boolean;
      isSunday: boolean;
      isSaturday: boolean;
      isToday: boolean;
      count: number;
    }> = [];

    const today = new Date();
    const todayYear = today.getFullYear();
    const todayMonth = String(today.getMonth() + 1).padStart(2, "0");
    const todayDay = String(today.getDate()).padStart(2, "0");
    const todayKey = `${todayYear}-${todayMonth}-${todayDay}`;

    let total = 0;
    let active = 0;

    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const year = d.getFullYear();
      const monthNum = d.getMonth() + 1;
      const dayNum = d.getDate();
      const month = String(monthNum).padStart(2, "0");
      const day = String(dayNum).padStart(2, "0");
      const dateKey = `${year}-${month}-${day}`;
      const count = dailyCounts[dateKey] || 0;

      const dayOfWeek = d.getDay();
      const isSunday = dayOfWeek === 0;
      const isSaturday = dayOfWeek === 6;
      const isWeekend = isSunday || isSaturday;
      const isToday = dateKey === todayKey;

      total += count;
      if (count > 0) active++;

      list.push({
        dateKey,
        date: d,
        dateLabel: `${monthNum}/${dayNum}`,
        weekdayLabel: WEEKDAYS_JA[dayOfWeek],
        isWeekend,
        isSunday,
        isSaturday,
        isToday,
        count,
      });
    }

    const calculatedMax = Math.max(25, ...list.map((item) => item.count));

    return {
      days: list,
      totalPast2Weeks: total,
      activeDays: active,
      maxCount: calculatedMax,
    };
  }, [dailyCounts]);

  // Ensure "Today" (the rightmost column) is scrolled into view by default on mobile devices
  useEffect(() => {
    if (!scrollContainerRef.current) return;
    const el = scrollContainerRef.current;
    el.scrollLeft = el.scrollWidth;
    const timer = setTimeout(() => {
      if (el) {
        el.scrollLeft = el.scrollWidth;
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [days]);

  const getBarColor = (count: number) => {
    if (count === 0) return "bg-muted/40 text-muted-foreground/60";
    if (count <= 15)
      return "bg-gradient-to-t from-emerald-600 to-emerald-400 text-white shadow-xs";
    if (count <= 35)
      return "bg-gradient-to-t from-teal-600 to-emerald-400 text-white shadow-sm";
    return "bg-gradient-to-t from-blue-600 to-teal-400 text-white shadow-md";
  };

  // ── 7-Day WPM SVG Chart Coordinates ──
  const chartPoints = useMemo(() => {
    const list = wpmStats.dailyTrend;
    if (list.length === 0) return { pathD: "", areaD: "", points: [] };

    const maxVal = Math.max(160, ...list.map((d) => d.wpm));
    const width = 320;
    const height = 90;
    const paddingX = 20;
    const paddingY = 16;
    const chartW = width - paddingX * 2;
    const chartH = height - paddingY * 2;

    const points = list.map((item, idx) => {
      const x = paddingX + (idx / (list.length - 1)) * chartW;
      const normalizedY = item.wpm / maxVal;
      const y = paddingY + chartH - normalizedY * chartH;
      return { x, y, ...item };
    });

    const activePoints = points.filter((p) => p.wpm > 0);
    if (activePoints.length === 0) {
      return { pathD: "", areaD: "", points };
    }

    const pathD = activePoints.reduce((acc, p, i) => {
      return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, "");

    const firstActive = activePoints[0];
    const lastActive = activePoints[activePoints.length - 1];
    const areaD = `${pathD} L ${lastActive.x} ${height - paddingY} L ${firstActive.x} ${height - paddingY} Z`;

    return { pathD, areaD, points };
  }, [wpmStats.dailyTrend]);

  return (
    <div className="bg-card rounded-2xl p-4 sm:p-6 border border-border shadow-sm space-y-5">
      {/* ── 1. Top Summary KPI Cards (2 Columns: Word Count & WPM) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {/* Total Words Summary */}
        <div className="bg-muted/30 border border-border/80 rounded-xl p-3.5 sm:p-4 flex flex-col justify-between relative overflow-hidden group hover:border-primary/40 transition">
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                <Award className="w-4 h-4" />
                累計発話ワード数
              </span>
              {averageAccuracy !== undefined && (
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  正解率 {averageAccuracy}%
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-foreground">
                {displayWordCount.toLocaleString()}
              </span>
              <span className="text-xs text-muted-foreground font-semibold">
                words
              </span>
            </div>
          </div>
          <div className="pt-2 mt-2 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>総セッション数</span>
            <span className="font-bold font-mono text-foreground">
              {totalSessions} 回
            </span>
          </div>
        </div>

        {/* Recent Average WPM Summary */}
        <div className="bg-muted/30 border border-border/80 rounded-xl p-3.5 sm:p-4 flex flex-col justify-between relative overflow-hidden group hover:border-blue-500/40 transition">
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
                <Gauge className="w-4 h-4" />
                平均話速 (直近3日間)
              </span>
              {wpmStats.hasData && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  {wpmStats.ratingLabel}
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-foreground">
                {wpmStats.hasData ? wpmStats.recent3DaysAverageWpm : "—"}
              </span>
              <span className="text-xs text-muted-foreground font-semibold">
                WPM
              </span>
            </div>
          </div>
          <div className="pt-2 mt-2 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>前回比</span>
            <div>
              {wpmStats.trendDifference !== null ? (
                wpmStats.trendDifference > 0 ? (
                  <span className="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-bold">
                    <TrendingUp className="w-3 h-3" />+{wpmStats.trendDifference} WPM
                  </span>
                ) : wpmStats.trendDifference < 0 ? (
                  <span className="inline-flex items-center gap-0.5 text-rose-500 font-bold">
                    <TrendingDown className="w-3 h-3" />{wpmStats.trendDifference} WPM
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-0.5 text-muted-foreground font-medium">
                    <Minus className="w-3 h-3" />変化なし
                  </span>
                )
              ) : (
                <span className="text-muted-foreground">データ収集中</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. 14-Day Activity Heatmap ── */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-primary" />
            <h3 className="text-xs sm:text-sm font-bold text-foreground">
              直近14日間の学習アクティビティ
            </h3>
          </div>
          <div className="text-[11px] text-muted-foreground">
            2週間の合計: <span className="font-bold text-foreground font-mono">{totalPast2Weeks}</span> 語 ({activeDays}/14日)
          </div>
        </div>

        {/* Bar chart scrollable container */}
        <div
          ref={scrollContainerRef}
          className="overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide"
        >
          <div className="min-w-[480px] sm:min-w-full grid grid-cols-[repeat(14,minmax(0,1fr))] gap-1 sm:gap-2 items-end pt-2">
            {days.map((item) => {
              const heightPercent =
                item.count > 0
                  ? Math.min(100, Math.max(14, Math.round((item.count / maxCount) * 100)))
                  : 6;

              return (
                <div
                  key={item.dateKey}
                  className={`group flex flex-col items-center justify-end rounded-xl p-1 transition-all duration-200 ${
                    item.isToday
                      ? "bg-primary/5 ring-1 ring-primary/30"
                      : "hover:bg-muted/40"
                  }`}
                  title={`${item.dateKey} (${item.weekdayLabel}): ${item.count}語発話`}
                >
                  {/* Spoken Word Count Badge */}
                  <div className="h-4 flex items-center justify-center mb-1">
                    {item.count > 0 ? (
                      <span className="text-[9px] sm:text-[10px] font-bold text-emerald-600 dark:text-emerald-400 font-mono scale-95 group-hover:scale-110 transition-transform">
                        {item.count}
                      </span>
                    ) : (
                      <span className="text-[9px] text-muted-foreground/30 font-mono">
                        -
                      </span>
                    )}
                  </div>

                  {/* Vertical Bar Track */}
                  <div className="w-full h-20 sm:h-24 flex items-end justify-center rounded-lg bg-muted/30 px-0.5 py-1">
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full max-w-[20px] sm:max-w-[28px] rounded-md transition-all duration-500 ${getBarColor(
                        item.count
                      )} flex items-center justify-center`}
                    >
                      {item.count >= 25 && (
                        <Sparkles className="w-2 h-2 text-white/80 hidden sm:block animate-pulse" />
                      )}
                    </div>
                  </div>

                  {/* Date & Weekday Label */}
                  <div className="text-center mt-1.5 space-y-0.2">
                    <div
                      className={`text-[9px] sm:text-[10px] font-bold ${
                        item.isSunday
                          ? "text-rose-500"
                          : item.isSaturday
                          ? "text-blue-500"
                          : "text-foreground"
                      }`}
                    >
                      {item.weekdayLabel}
                    </div>
                    <div className="text-[8px] sm:text-[9px] text-muted-foreground font-mono">
                      {item.dateLabel}
                    </div>
                    {item.isToday && (
                      <span className="inline-block mt-0.5 px-1 py-0.1 bg-primary text-primary-foreground text-[8px] font-bold rounded-xs">
                        今日
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/40">
          <div className="flex items-center gap-2">
            <span>発話量:</span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-xs bg-muted/40 border border-border inline-block" /> 0語
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-xs bg-emerald-500 inline-block" /> 1〜15
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-xs bg-teal-500 inline-block" /> 16〜35
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-xs bg-blue-600 inline-block" /> 36語+
            </span>
          </div>
          <span className="hidden sm:inline text-muted-foreground/70">
            練習した英単語数が自動記録されます
          </span>
        </div>
      </div>

      {/* ── 3. Accordion Toggle for WPM Details ── */}
      <div className="pt-2 border-t border-border/70">
        <button
          type="button"
          onClick={() => setIsWpmOpen((prev) => !prev)}
          className="w-full flex items-center justify-between py-2.5 px-3 rounded-xl bg-muted/40 hover:bg-muted/70 active:scale-[0.99] text-xs sm:text-sm font-semibold text-foreground transition-all cursor-pointer group"
          aria-expanded={isWpmOpen}
        >
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
            <span>WPM（話速）の詳細を見る</span>
            {wpmStats.hasData && (
              <span className="text-[11px] font-normal text-muted-foreground hidden xs:inline">
                (直近7日間の日別スピード)
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="text-[11px]">{isWpmOpen ? "閉じる" : "詳細展開"}</span>
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${
                isWpmOpen ? "rotate-180 text-primary" : ""
              }`}
            />
          </div>
        </button>

        {/* Collapsible Content */}
        {isWpmOpen && (
          <div className="mt-3 p-3.5 sm:p-4 rounded-xl bg-muted/20 border border-border/60 space-y-4 animate-in fade-in duration-200">
            {/* Chart Header */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-bold text-foreground">
                <span>直近7日間のWPM推移</span>
                <span className="text-[10px] text-muted-foreground font-normal">
                  (目標目安: 120〜150 WPM)
                </span>
              </div>
              {hoveredPointIndex !== null && chartPoints.points[hoveredPointIndex] ? (
                <span className="font-bold text-primary animate-in fade-in font-mono">
                  {chartPoints.points[hoveredPointIndex].label}:{" "}
                  {chartPoints.points[hoveredPointIndex].wpm > 0
                    ? `${chartPoints.points[hoveredPointIndex].wpm} WPM (${chartPoints.points[hoveredPointIndex].sessionCount}回)`
                    : "記録なし"}
                </span>
              ) : (
                <span className="text-[10px] text-muted-foreground hidden sm:inline">
                  プロットに触れると日別スコアを表示
                </span>
              )}
            </div>

            {/* SVG Line Chart */}
            <div className="relative w-full h-24 bg-card/60 rounded-xl overflow-hidden px-1 py-1 border border-border/40">
              <svg
                viewBox="0 0 320 90"
                className="w-full h-full overflow-visible"
                preserveAspectRatio="none"
              >
                {/* Target 120 WPM Guide Line */}
                <line
                  x1="20"
                  y1="40"
                  x2="300"
                  y2="40"
                  stroke="currentColor"
                  strokeDasharray="3 3"
                  className="text-border/90"
                  strokeWidth="1"
                />
                <text
                  x="22"
                  y="37"
                  className="text-[8px] fill-muted-foreground/70 select-none font-medium"
                >
                  標準 120 WPM
                </text>

                {/* Gradient Area Fill */}
                {chartPoints.areaD && (
                  <>
                    <defs>
                      <linearGradient
                        id="activityWpmAreaGrad"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#3b82f6"
                          stopOpacity="0.25"
                        />
                        <stop
                          offset="100%"
                          stopColor="#3b82f6"
                          stopOpacity="0.0"
                        />
                      </linearGradient>
                    </defs>
                    <path
                      d={chartPoints.areaD}
                      fill="url(#activityWpmAreaGrad)"
                    />
                  </>
                )}

                {/* Trend Line */}
                {chartPoints.pathD && (
                  <path
                    d={chartPoints.pathD}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Data Points */}
                {chartPoints.points.map((pt, idx) => (
                  <g
                    key={pt.date}
                    onMouseEnter={() => setHoveredPointIndex(idx)}
                    onMouseLeave={() => setHoveredPointIndex(null)}
                    className="cursor-pointer"
                  >
                    {/* Hover hotspot */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="10"
                      fill="transparent"
                    />
                    {/* Point Circle */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={pt.wpm > 0 ? (hoveredPointIndex === idx ? "4.5" : "3") : "1.5"}
                      className={
                        pt.wpm > 0
                          ? "fill-blue-600 dark:fill-blue-400 stroke-card"
                          : "fill-muted-foreground/30 stroke-transparent"
                      }
                      strokeWidth="1.5"
                    />
                  </g>
                ))}
              </svg>
            </div>

            {/* Daily WPM List (7 Days) */}
            <div className="space-y-1.5">
              <div className="grid grid-cols-7 gap-1 text-center">
                {wpmStats.dailyTrend.map((d, idx) => (
                  <div
                    key={d.date}
                    className={`rounded-lg p-1.5 transition text-[10px] ${
                      hoveredPointIndex === idx
                        ? "bg-primary/10 ring-1 ring-primary/40"
                        : "bg-card/50"
                    }`}
                    onMouseEnter={() => setHoveredPointIndex(idx)}
                    onMouseLeave={() => setHoveredPointIndex(null)}
                  >
                    <div className="text-muted-foreground font-mono text-[9px]">
                      {d.label}
                    </div>
                    <div
                      className={`font-mono font-bold mt-0.5 ${
                        d.wpm > 0
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-muted-foreground/40"
                      }`}
                    >
                      {d.wpm > 0 ? d.wpm : "—"}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Helpful Speed Benchmark Footnote */}
            <div className="flex items-start gap-1.5 text-[11px] text-muted-foreground/90 bg-card/60 p-2.5 rounded-lg border border-border/40">
              <Info className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
              <p>
                <strong>WPM（Words Per Minute）</strong>
                は1分あたりの発話単語数です。一般的な日常会話は <strong>120〜150 WPM</strong>、ニュース音声は <strong>150〜180 WPM</strong> 程度が自然なスピードの目安となります。
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
