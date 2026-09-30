"use client";

import { useMemo, useState } from "react";
import {
  Gauge,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
} from "lucide-react";
import { PracticeSession } from "@/types";
import {
  calculateWpmStats,
  WpmStatsResult,
} from "@/lib/storage/wpm-stats-calculator";

interface WpmTrendCardProps {
  sessions: PracticeSession[];
}

export function WpmTrendCard({ sessions }: WpmTrendCardProps) {
  const stats: WpmStatsResult = useMemo(
    () => calculateWpmStats(sessions),
    [sessions]
  );
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // SVG折れ線グラフの座標計算
  const chartPoints = useMemo(() => {
    const list = stats.dailyTrend;
    if (list.length === 0) return { pathD: "", areaD: "", points: [], target120Y: 30.5 };

    // 最大WPMを決定（最低でも160を基準スケールにする）
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

    // 0の日は除外して線をつなぐか、全体をプロット
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
  }, [stats.dailyTrend]);

  return (
    <div className="bg-card rounded-2xl p-5 sm:p-6 border border-border/80 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Gauge className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <span>話速トレンド (WPM)</span>
              <span className="text-[10px] text-muted-foreground font-normal">
                / Words Per Minute
              </span>
            </h3>
            <p className="text-[11px] text-muted-foreground">
              直近3日間の平均発話スピード
            </p>
          </div>
        </div>

        {/* 評価バッジ */}
        {stats.hasData && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <Sparkles className="w-3 h-3" />
            {stats.ratingLabel}
          </span>
        )}
      </div>

      {/* Main Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 items-end pt-1">
        {/* Recent 3-day average */}
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl sm:text-4xl font-extrabold font-mono tracking-tight text-foreground">
              {stats.hasData ? stats.recent3DaysAverageWpm : "—"}
            </span>
            <span className="text-xs text-muted-foreground font-semibold">
              WPM
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            直近3日間の平均話速
          </p>
        </div>

        {/* Trend Difference vs Previous */}
        <div>
          <div className="flex items-center gap-1">
            {stats.trendDifference !== null ? (
              stats.trendDifference > 0 ? (
                <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                  <TrendingUp className="w-4 h-4" />
                  <span>+{stats.trendDifference} WPM</span>
                </div>
              ) : stats.trendDifference < 0 ? (
                <div className="flex items-center gap-1 text-rose-500 font-bold text-sm">
                  <TrendingDown className="w-4 h-4" />
                  <span>{stats.trendDifference} WPM</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-muted-foreground font-bold text-sm">
                  <Minus className="w-4 h-4" />
                  <span>変化なし</span>
                </div>
              )
            ) : (
              <span className="text-xs text-muted-foreground font-medium">
                データ収集中
              </span>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            前回（4〜6日前）比
          </p>
        </div>

        {/* Speed reference benchmark */}
        <div className="hidden sm:block text-right">
          <p className="text-[11px] text-muted-foreground">
            日常会話の自然な目安:
          </p>
          <p className="text-xs font-bold text-foreground">
            120 〜 150 WPM
          </p>
        </div>
      </div>

      {/* ── 7-Day Trend Line Chart ── */}
      <div className="pt-2 border-t border-border/60 space-y-2">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>直近7日間の推移</span>
          {hoveredIndex !== null && chartPoints.points[hoveredIndex] ? (
            <span className="font-bold text-primary animate-in fade-in">
              {chartPoints.points[hoveredIndex].label}:{" "}
              {chartPoints.points[hoveredIndex].wpm > 0
                ? `${chartPoints.points[hoveredIndex].wpm} WPM (${chartPoints.points[hoveredIndex].sessionCount}回)`
                : "記録なし"}
            </span>
          ) : (
            <span className="text-[10px]">
              点に触れると日別スコアを表示
            </span>
          )}
        </div>

        {/* SVG Container */}
        <div className="relative w-full h-24 bg-muted/20 rounded-xl overflow-hidden px-1 py-1">
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
              className="text-border/80"
              strokeWidth="1"
            />
            <text
              x="22"
              y={chartPoints.target120Y - 4}
              className="text-[8px] fill-muted-foreground/60 select-none"
            >
              標準 120 WPM
            </text>

            {/* Gradient Area Fill */}
            {chartPoints.areaD && (
              <path
                d={chartPoints.areaD}
                className="fill-blue-500/10 transition-all duration-300"
              />
            )}

            {/* Trend Line */}
            {chartPoints.pathD && (
              <path
                d={chartPoints.pathD}
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-primary transition-all duration-300"
              />
            )}

            {/* Plot Circles */}
            {chartPoints.points.map((p, idx) => {
              const isHovered = hoveredIndex === idx;
              const hasVal = p.wpm > 0;
              return (
                <g key={p.date}>
                  {/* Invisible hit target for touch/hover */}
                  <rect
                    x={p.x - 16}
                    y={0}
                    width={32}
                    height={90}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onTouchStart={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />
                  {hasVal ? (
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={isHovered ? 5 : 3.5}
                      className={`transition-all duration-150 ${
                        isHovered
                          ? "fill-primary stroke-white stroke-2"
                          : "fill-background stroke-primary stroke-2"
                      }`}
                    />
                  ) : (
                    <circle
                      cx={p.x}
                      cy={74}
                      r={1.5}
                      className="fill-muted-foreground/30"
                    />
                  )}
                </g>
              );
            })}
          </svg>

          {/* Date Axis Labels */}
          <div className="flex items-center justify-between px-3 pt-0.5 text-[9px] text-muted-foreground">
            {chartPoints.points.map((p, i) => (
              <span
                key={p.date}
                className={`transition ${
                  hoveredIndex === i ? "text-primary font-bold" : ""
                }`}
              >
                {p.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
