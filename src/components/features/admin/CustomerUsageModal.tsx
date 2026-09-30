"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import {
  X,
  TrendingUp,
  Calendar,
  Activity,
  Award,
  Crown,
  Copy,
  Check,
  Zap,
} from "lucide-react";
import { CustomerSummary } from "@/app/api/admin/customers/route";

interface CustomerUsageModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: CustomerSummary | null;
}

type PeriodOption = "7" | "14" | "30" | "all";

interface DayData {
  dateStr: string; // "YYYY-MM-DD"
  displayDate: string; // "M/D"
  fullDate: string; // "YYYY年M月D日(木)"
  weekday: string;
  count: number;
  isToday: boolean;
}

const WEEKDAYS_JA = ["日", "月", "火", "水", "木", "金", "土"] as const;

function formatJST(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export function CustomerUsageModal({
  isOpen,
  onClose,
  customer,
}: CustomerUsageModalProps) {
  const [period, setPeriod] = useState<PeriodOption>("14");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const modalRef = useRef<HTMLDivElement | null>(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Lock background scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  // Build continuous time series data according to selected period
  const { chartDays, totalInPeriod, maxCountInPeriod, activeDaysInPeriod, avgInPeriod, peakDay } =
    useMemo(() => {
      if (!customer) {
        return {
          chartDays: [] as DayData[],
          totalInPeriod: 0,
          maxCountInPeriod: 0,
          activeDaysInPeriod: 0,
          avgInPeriod: 0,
          peakDay: null as DayData | null,
        };
      }

      const historyMap = new Map<string, number>();
      (customer.daily_history || []).forEach((item) => {
        historyMap.set(item.date, item.count);
      });

      const today = new Date();
      const todayStr = formatJST(today);

      let startDate: Date;
      let dayCount = 14;

      if (period === "7") {
        dayCount = 7;
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 6);
      } else if (period === "14") {
        dayCount = 14;
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 13);
      } else if (period === "30") {
        dayCount = 30;
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 29);
      } else {
        // "all" period: from earliest recorded practice or registration date
        let earliestDateStr = todayStr;
        if (customer.daily_history && customer.daily_history.length > 0) {
          earliestDateStr = customer.daily_history[0].date;
        }
        if (customer.created_at) {
          const regStr = formatJST(new Date(customer.created_at));
          if (regStr < earliestDateStr) earliestDateStr = regStr;
        }
        const earliest = new Date(earliestDateStr);
        startDate = isNaN(earliest.getTime()) ? new Date(today) : earliest;
        // Total days between startDate and today
        const diffMs = Math.max(0, today.getTime() - startDate.getTime());
        dayCount = Math.min(90, Math.max(7, Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 1));
      }

      const days: DayData[] = [];
      let total = 0;
      let active = 0;
      let maxCount = 0;
      let peak: DayData | null = null;

      for (let i = 0; i < dayCount; i++) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        const dStr = formatJST(d);

        // Do not project into the future
        if (dStr > todayStr) break;

        const count = historyMap.get(dStr) || 0;
        total += count;
        if (count > 0) active++;
        if (count > maxCount) {
          maxCount = count;
        }

        const monthNum = d.getMonth() + 1;
        const dayNum = d.getDate();
        const weekdayStr = WEEKDAYS_JA[d.getDay()];

        const item: DayData = {
          dateStr: dStr,
          displayDate: `${monthNum}/${dayNum}`,
          fullDate: `${d.getFullYear()}年${monthNum}月${dayNum}日 (${weekdayStr})`,
          weekday: weekdayStr,
          count,
          isToday: dStr === todayStr,
        };

        if (count === maxCount && count > 0) {
          peak = item;
        }

        days.push(item);
      }

      const avg = days.length > 0 ? Math.round((total / days.length) * 10) / 10 : 0;

      return {
        chartDays: days,
        totalInPeriod: total,
        maxCountInPeriod: maxCount,
        activeDaysInPeriod: active,
        avgInPeriod: avg,
        peakDay: peak,
      };
    }, [customer, period]);

  if (!isOpen || !customer) return null;

  // SVG Chart Geometry
  const svgWidth = 560;
  const svgHeight = 220;
  const padding = { top: 25, right: 25, bottom: 35, left: 40 };
  const innerWidth = svgWidth - padding.left - padding.right;
  const innerHeight = svgHeight - padding.top - padding.bottom;

  // Max scale on Y-axis (at least 4 for visual headroom)
  const yMax = Math.max(4, Math.ceil(maxCountInPeriod * 1.25));

  // Compute (x, y) coordinates for all days
  const points = chartDays.map((d, index) => {
    const x =
      chartDays.length > 1
        ? padding.left + (index / (chartDays.length - 1)) * innerWidth
        : padding.left + innerWidth / 2;
    const y = padding.top + innerHeight - (d.count / yMax) * innerHeight;
    return { ...d, x, y };
  });

  // Construct SVG path strings
  const linePathD = points.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`;
  }, "");

  const areaPathD =
    points.length > 0
      ? `${linePathD} L ${points[points.length - 1].x},${padding.top + innerHeight} L ${
          points[0].x
        },${padding.top + innerHeight} Z`
      : "";

  // 4 Y-axis horizontal grid levels
  const yTicks = [0, Math.round(yMax / 3), Math.round((yMax * 2) / 3), yMax];

  // Selected or hovered point
  const currentHoveredPoint =
    hoveredIndex !== null && hoveredIndex >= 0 && hoveredIndex < points.length
      ? points[hoveredIndex]
      : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="customer-usage-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="bg-card text-card-foreground border border-border rounded-2xl sm:rounded-3xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-border flex items-start justify-between gap-3 bg-muted/20">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <TrendingUp className="w-4 h-4" />
              </span>
              <h2
                id="customer-usage-modal-title"
                className="text-base sm:text-lg font-bold text-foreground truncate"
              >
                日別利用回数の推移
              </h2>

              {/* Plan badge */}
              {customer.vip_type === "campaign" ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600 border border-amber-500/30">
                  <Crown className="w-3 h-3 text-amber-500" />
                  VIP (10/30迄)
                </span>
              ) : customer.vip_type === "whitelist" ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/15 text-purple-600 border border-purple-500/30">
                  <Crown className="w-3 h-3 text-purple-500" />
                  VIP (テスター)
                </span>
              ) : customer.plan === "pro" ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                  <Crown className="w-3 h-3 text-amber-500" />
                  Proプラン
                </span>
              ) : customer.plan === "base" ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 border border-blue-500/20">
                  Baseプラン
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
                  Free
                </span>
              )}
            </div>

            {/* Email and member info */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-0.5 flex-wrap">
              <span className="font-mono text-foreground font-medium select-all">
                {customer.email}
              </span>
              <button
                type="button"
                onClick={() => handleCopyEmail(customer.email)}
                className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition px-1.5 py-0.5 rounded hover:bg-muted"
                title="メールアドレスをコピー"
              >
                {copiedEmail ? (
                  <Check className="w-3 h-3 text-emerald-500" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
                <span>{copiedEmail ? "コピー完了" : "コピー"}</span>
              </button>
              <span>•</span>
              <span>累計: {customer.practice_count}回</span>
            </div>
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {/* Period selector */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-primary" />
              <span>表示期間</span>
            </div>
            <div className="inline-flex items-center p-1 rounded-xl bg-muted/60 border border-border text-xs font-medium">
              {(
                [
                  { key: "7", label: "過去7日間" },
                  { key: "14", label: "過去14日間" },
                  { key: "30", label: "過去30日間" },
                  { key: "all", label: "全期間" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => {
                    setPeriod(opt.key);
                    setHoveredIndex(null);
                  }}
                  className={`px-3 py-1.5 rounded-lg transition-all text-xs font-bold cursor-pointer ${
                    period === opt.key
                      ? "bg-background text-primary shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 4 Summary Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            <div className="p-3 rounded-2xl bg-muted/30 border border-border space-y-1">
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-blue-500" />
                期間内合計
              </span>
              <p className="text-lg sm:text-xl font-extrabold text-foreground">
                {totalInPeriod}{" "}
                <span className="text-xs font-normal text-muted-foreground">回</span>
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-muted/30 border border-border space-y-1">
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                1日平均
              </span>
              <p className="text-lg sm:text-xl font-extrabold text-foreground">
                {avgInPeriod}{" "}
                <span className="text-xs font-normal text-muted-foreground">回/日</span>
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-muted/30 border border-border space-y-1">
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-purple-500" />
                1日最高記録
              </span>
              <p className="text-lg sm:text-xl font-extrabold text-foreground">
                {maxCountInPeriod}{" "}
                <span className="text-xs font-normal text-muted-foreground">回</span>
              </p>
              {peakDay && maxCountInPeriod > 0 && (
                <span className="text-[10px] text-muted-foreground block truncate">
                  ({peakDay.displayDate})
                </span>
              )}
            </div>

            <div className="p-3 rounded-2xl bg-muted/30 border border-border space-y-1">
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                練習日数
              </span>
              <p className="text-lg sm:text-xl font-extrabold text-foreground">
                {activeDaysInPeriod} / {chartDays.length}{" "}
                <span className="text-xs font-normal text-muted-foreground">日</span>
              </p>
            </div>
          </div>

          {/* Line Chart Container */}
          <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border shadow-xs space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-foreground">発話利用回数の推移</span>
                <span className="text-[11px] text-muted-foreground">（日別カウント）</span>
              </div>
              {currentHoveredPoint ? (
                <div className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-xs animate-in fade-in-50">
                  {currentHoveredPoint.fullDate}: {currentHoveredPoint.count} 回
                </div>
              ) : (
                <span className="text-[11px] text-muted-foreground">
                  点をタップまたはホバーで詳細確認
                </span>
              )}
            </div>

            {/* SVG Line Chart */}
            <div className="relative w-full overflow-hidden select-none">
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="w-full h-auto overflow-visible"
              >
                <defs>
                  {/* Subtle Gradient fill under line */}
                  <linearGradient id="usageLineGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgb(59, 130, 246)" stopOpacity="0.32" />
                    <stop offset="85%" stopColor="rgb(59, 130, 246)" stopOpacity="0.02" />
                    <stop offset="100%" stopColor="rgb(59, 130, 246)" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Y-axis horizontal grid lines & labels */}
                {yTicks.map((val) => {
                  const y = padding.top + innerHeight - (val / yMax) * innerHeight;
                  return (
                    <g key={`y-grid-${val}`}>
                      <line
                        x1={padding.left}
                        y1={y}
                        x2={padding.left + innerWidth}
                        y2={y}
                        stroke="currentColor"
                        strokeDasharray={val === 0 ? undefined : "3 3"}
                        className="text-border/60"
                        strokeWidth="1"
                      />
                      <text
                        x={padding.left - 8}
                        y={y + 3.5}
                        textAnchor="end"
                        className="fill-muted-foreground text-[10px] font-mono"
                      >
                        {val}
                      </text>
                    </g>
                  );
                })}

                {/* Area under the line */}
                {areaPathD && (
                  <path
                    d={areaPathD}
                    fill="url(#usageLineGradient)"
                    className="transition-all duration-300"
                  />
                )}

                {/* Line Path */}
                {linePathD && (
                  <path
                    d={linePathD}
                    fill="none"
                    stroke="rgb(37, 99, 235)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="transition-all duration-300 drop-shadow-2xs"
                  />
                )}

                {/* Vertical guide line on hover */}
                {currentHoveredPoint && (
                  <line
                    x1={currentHoveredPoint.x}
                    y1={padding.top}
                    x2={currentHoveredPoint.x}
                    y2={padding.top + innerHeight}
                    stroke="rgb(59, 130, 246)"
                    strokeWidth="1.5"
                    strokeDasharray="2 2"
                    className="opacity-75"
                  />
                )}

                {/* Interactive Points */}
                {points.map((pt, idx) => {
                  const isHovered = hoveredIndex === idx;
                  const isPeak = pt.count === maxCountInPeriod && pt.count > 0;
                  return (
                    <g
                      key={`pt-${pt.dateStr}`}
                      className="cursor-pointer transition-transform"
                      onMouseEnter={() => setHoveredIndex(idx)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      onClick={() => setHoveredIndex(idx)}
                    >
                      {/* Invisible larger hit target */}
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r="14"
                        fill="transparent"
                        className="pointer-events-auto"
                      />

                      {/* Halo ring when hovered */}
                      {isHovered && (
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r="8"
                          fill="rgb(59, 130, 246)"
                          fillOpacity="0.25"
                          className="animate-ping"
                        />
                      )}

                      {/* Outer border & point circle */}
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isHovered ? 6 : pt.count > 0 ? 4.5 : 2.5}
                        fill={
                          isHovered
                            ? "rgb(29, 78, 216)"
                            : isPeak
                            ? "rgb(147, 51, 234)"
                            : pt.count > 0
                            ? "rgb(37, 99, 235)"
                            : "rgb(156, 163, 175)"
                        }
                        stroke="#ffffff"
                        strokeWidth={pt.count > 0 ? 2 : 1}
                        className="transition-all duration-150"
                      />
                    </g>
                  );
                })}

                {/* X-axis date labels */}
                {points.map((pt, idx) => {
                  // Only display a subset of labels if there are many days to prevent overlap
                  const showLabel =
                    chartDays.length <= 14
                      ? true
                      : chartDays.length <= 30
                      ? idx % 3 === 0 || idx === chartDays.length - 1
                      : idx % 5 === 0 || idx === chartDays.length - 1;

                  if (!showLabel) return null;

                  return (
                    <text
                      key={`label-${pt.dateStr}`}
                      x={pt.x}
                      y={padding.top + innerHeight + 18}
                      textAnchor="middle"
                      className={`text-[10px] font-mono ${
                        pt.isToday
                          ? "fill-primary font-bold"
                          : "fill-muted-foreground"
                      }`}
                    >
                      {pt.isToday ? "本日" : pt.displayDate}
                    </text>
                  );
                })}
              </svg>
            </div>

            {/* Zero State if customer has 0 practices */}
            {totalInPeriod === 0 && (
              <div className="py-4 text-center space-y-1">
                <p className="text-xs text-muted-foreground">
                  この期間内の練習記録はまだありません。
                </p>
                {customer.last_practiced_at && (
                  <p className="text-[11px] text-muted-foreground/80">
                    最終練習日: {customer.last_practiced_at.slice(0, 10)}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Daily Breakdown List (Reverse Chronological) */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-foreground flex items-center justify-between">
              <span>日別内訳一覧（最新順）</span>
              <span className="text-[10px] text-muted-foreground font-normal">
                {chartDays.length}日間
              </span>
            </h3>

            <div className="max-h-48 overflow-y-auto rounded-xl border border-border divide-y divide-border/60 bg-muted/20">
              {chartDays
                .slice()
                .reverse()
                .map((day) => {
                  const percentOfMax =
                    maxCountInPeriod > 0
                      ? Math.min(100, Math.round((day.count / maxCountInPeriod) * 100))
                      : 0;

                  return (
                    <div
                      key={day.dateStr}
                      className="px-3.5 py-2 flex items-center justify-between text-xs hover:bg-muted/40 transition"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-mono text-xs ${
                            day.isToday ? "font-bold text-primary" : "text-foreground"
                          }`}
                        >
                          {day.dateStr} ({day.weekday})
                        </span>
                        {day.isToday && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-primary/10 text-primary">
                            本日
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Mini progress indicator */}
                        <div className="w-16 sm:w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              day.count > 0 ? "bg-blue-600" : "bg-transparent"
                            }`}
                            style={{ width: `${percentOfMax}%` }}
                          />
                        </div>

                        <span
                          className={`font-mono text-xs w-12 text-right ${
                            day.count > 0
                              ? "font-bold text-foreground"
                              : "text-muted-foreground/60"
                          }`}
                        >
                          {day.count} 回
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-border flex items-center justify-between bg-muted/20">
          <span className="text-[11px] text-muted-foreground">
            ※Whisper発話判定を完了した練習セッション数を集計しています
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition shadow-xs cursor-pointer"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
