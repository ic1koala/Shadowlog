"use client";

import { useMemo, useRef, useEffect } from "react";
import { CalendarDays, TrendingUp, Sparkles } from "lucide-react";

interface ActivityHeatmapProps {
  dailyCounts: Record<string, number>;
}

const WEEKDAYS_JA = ["日", "月", "火", "水", "木", "金", "土"] as const;

export function ActivityHeatmap({ dailyCounts }: ActivityHeatmapProps) {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Generate the past 14 days (past 2 weeks) up to today
  const { days, totalPast2Weeks, activeDays, maxCount, dailyAverage } = useMemo(() => {
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
    const avg = total > 0 ? Math.round((total / 14) * 10) / 10 : 0;

    return {
      days: list,
      totalPast2Weeks: total,
      activeDays: active,
      maxCount: calculatedMax,
      dailyAverage: avg,
    };
  }, [dailyCounts]);

  // Ensure "Today" (the rightmost column) is scrolled into view by default on mobile devices
  useEffect(() => {
    if (!scrollContainerRef.current) return;
    const el = scrollContainerRef.current;
    // Scroll immediately and also after a short tick to handle layout render
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
    if (count <= 15) return "bg-gradient-to-t from-emerald-600 to-emerald-400 text-white shadow-xs";
    if (count <= 35) return "bg-gradient-to-t from-teal-600 to-emerald-400 text-white shadow-sm";
    return "bg-gradient-to-t from-blue-600 to-teal-400 text-white shadow-md";
  };

  return (
    <div className="bg-card rounded-2xl p-5 sm:p-8 border border-border shadow-sm space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/60">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-primary" />
            学習アクティビティ
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            過去2週間（14日間）の日別発話単語数
          </p>
        </div>

        {/* 2-Week Summary Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>2週間の合計:</span>
            <span className="font-bold font-mono text-sm">{totalPast2Weeks}</span>
            <span className="text-[11px] font-normal text-muted-foreground">語</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-muted/60 border border-border text-xs font-medium text-muted-foreground">
            <span>学習日数:</span>
            <span className="font-bold text-foreground font-mono">{activeDays}</span>
            <span>/ 14日</span>
            {dailyAverage > 0 && (
              <span className="hidden sm:inline border-l border-border pl-2 text-[11px]">
                平均 {dailyAverage}語/日
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 14-Day Visual Bar Chart */}
      <div
        ref={scrollContainerRef}
        className="overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide"
      >
        <div className="min-w-[520px] sm:min-w-full grid grid-cols-[repeat(14,minmax(0,1fr))] gap-1.5 sm:gap-2.5 items-end pt-3">
          {days.map((item) => {
            const heightPercent =
              item.count > 0
                ? Math.min(100, Math.max(12, Math.round((item.count / maxCount) * 100)))
                : 6;

            return (
              <div
                key={item.dateKey}
                className={`group flex flex-col items-center justify-end rounded-xl p-1 sm:p-1.5 transition-all duration-200 ${
                  item.isToday
                    ? "bg-primary/5 ring-1 ring-primary/30"
                    : "hover:bg-muted/40"
                }`}
                title={`${item.dateKey} (${item.weekdayLabel}): ${item.count}語発話`}
              >
                {/* Spoken Word Count Badge */}
                <div className="h-5 flex items-center justify-center mb-1.5">
                  {item.count > 0 ? (
                    <span className="text-[10px] sm:text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono scale-95 group-hover:scale-110 transition-transform">
                      {item.count}
                    </span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground/40 font-mono">
                      -
                    </span>
                  )}
                </div>

                {/* Vertical Bar Track */}
                <div className="w-full h-24 sm:h-28 flex items-end justify-center rounded-lg bg-muted/25 px-0.5 sm:px-1 py-1">
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full max-w-[24px] sm:max-w-[32px] rounded-md transition-all duration-500 ${getBarColor(
                      item.count
                    )} flex items-center justify-center`}
                  >
                    {item.count >= 25 && (
                      <Sparkles className="w-2.5 h-2.5 text-white/80 hidden sm:block animate-pulse" />
                    )}
                  </div>
                </div>

                {/* Date & Weekday Label */}
                <div className="text-center mt-2 space-y-0.5">
                  <div
                    className={`text-[10px] sm:text-[11px] font-bold ${
                      item.isSunday
                        ? "text-rose-500"
                        : item.isSaturday
                        ? "text-blue-500"
                        : "text-foreground"
                    }`}
                  >
                    {item.weekdayLabel}
                  </div>
                  <div className="text-[9px] sm:text-[10px] text-muted-foreground font-mono">
                    {item.dateLabel}
                  </div>
                  {item.isToday && (
                    <span className="inline-block mt-0.5 px-1 py-0.2 bg-primary text-primary-foreground text-[8px] sm:text-[9px] font-bold rounded-xs">
                      今日
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/60 text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="text-[11px]">目標目安:</span>
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="w-2.5 h-2.5 rounded-xs bg-muted/40 border border-border inline-block" />
            <span>0語</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 inline-block" />
            <span>1〜15語</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="w-2.5 h-2.5 rounded-xs bg-teal-500 inline-block" />
            <span>16〜35語</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="w-2.5 h-2.5 rounded-xs bg-blue-600 inline-block" />
            <span>36語〜</span>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground/80">
          ※ 練習した発話英文の単語数が自動集計されます
        </p>
      </div>
    </div>
  );
}
