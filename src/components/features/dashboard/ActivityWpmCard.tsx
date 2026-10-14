"use client";

import { useMemo, useState, useEffect } from "react";
import {
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
  dailyCounts?: Record<string, number>;
  sessions: PracticeSession[];
}

export function ActivityWpmCard({
  totalWords,
  totalSessions,
  averageAccuracy,
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



  // ── 7-Day WPM SVG Chart Coordinates ──
  const chartPoints = useMemo(() => {
    const list = wpmStats.dailyTrend;
    if (list.length === 0) return { pathD: "", areaD: "", points: [], target120Y: 30.5 };

    const maxVal = Math.max(160, ...list.map((d) => d.wpm));
    const width = 320;
    const height = 90;
    const paddingX = 20;
    const paddingY = 16;
    const chartW = width - paddingX * 2;
    const chartH = height - paddingY * 2;

    // Mathematically exact Y position for 120 WPM reference line
    const target120Y = Math.round((paddingY + chartH - (120 / maxVal) * chartH) * 10) / 10;

    const points = list.map((item, idx) => {
      const x = paddingX + (idx / (list.length - 1)) * chartW;
      const normalizedY = item.wpm / maxVal;
      const y = paddingY + chartH - normalizedY * chartH;
      return { x, y, ...item };
    });

    const activePoints = points.filter((p) => p.wpm > 0);
    if (activePoints.length === 0) {
      return { pathD: "", areaD: "", points, target120Y };
    }

    const pathD = activePoints.reduce((acc, p, i) => {
      return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, "");

    const firstActive = activePoints[0];
    const lastActive = activePoints[activePoints.length - 1];
    const areaD = `${pathD} L ${lastActive.x} ${height - paddingY} L ${firstActive.x} ${height - paddingY} Z`;

    return { pathD, areaD, points, target120Y };
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

      {/* ── 2. Accordion Toggle for WPM Details ── */}
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
                  y1={chartPoints.target120Y}
                  x2="300"
                  y2={chartPoints.target120Y}
                  stroke="currentColor"
                  strokeDasharray="3 3"
                  className="text-border/90"
                  strokeWidth="1"
                />
                <text
                  x="22"
                  y={chartPoints.target120Y - 4}
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
