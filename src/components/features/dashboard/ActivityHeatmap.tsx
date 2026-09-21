"use client";

import { useMemo } from "react";
import { CalendarDays } from "lucide-react";

interface ActivityHeatmapProps {
  dailyCounts: Record<string, number>;
}

export function ActivityHeatmap({ dailyCounts }: ActivityHeatmapProps) {
  // Generate past 84 days (12 weeks)
  const days = useMemo(() => {
    const list: Array<{ dateKey: string; date: Date; count: number }> = [];
    const today = new Date();

    for (let i = 83; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const dateKey = `${year}-${month}-${day}`;
      list.push({
        dateKey,
        date: d,
        count: dailyCounts[dateKey] || 0,
      });
    }
    return list;
  }, [dailyCounts]);

  const getColorClass = (count: number) => {
    if (count === 0) return "bg-muted/50 border-border/40";
    if (count <= 10) return "bg-emerald-500/30 border-emerald-500/40";
    if (count <= 25) return "bg-emerald-500/60 border-emerald-500/70";
    if (count <= 50) return "bg-emerald-500/80 border-emerald-500/90";
    return "bg-emerald-500 border-emerald-600";
  };

  return (
    <div className="bg-card rounded-2xl p-6 sm:p-8 border border-border shadow-sm space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-primary" />
            学習アクティビティ
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            過去12週間の日別発話単語数
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>少</span>
          <span className="w-3 h-3 rounded-xs bg-muted/50 border border-border/40 inline-block" />
          <span className="w-3 h-3 rounded-xs bg-emerald-500/30 border border-emerald-500/40 inline-block" />
          <span className="w-3 h-3 rounded-xs bg-emerald-500/60 border border-emerald-500/70 inline-block" />
          <span className="w-3 h-3 rounded-xs bg-emerald-500 border border-emerald-600 inline-block" />
          <span>多</span>
        </div>
      </div>

      <div className="overflow-x-auto pb-2 scrollbar-hide">
        <div className="inline-grid grid-rows-7 grid-flow-col gap-1 sm:gap-1.5 min-w-[450px] sm:min-w-[550px]">
          {days.map((item) => (
            <div
              key={item.dateKey}
              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-xs border transition-transform hover:scale-125 ${getColorClass(
                item.count
              )}`}
              title={`${item.dateKey}: ${item.count} words`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
