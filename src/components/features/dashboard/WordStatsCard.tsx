"use client";

import { useEffect, useState } from "react";
import { Award, BookOpen, Target } from "lucide-react";

interface WordStatsCardProps {
  totalWords: number;
  totalSessions: number;
  averageAccuracy?: number;
}

export function WordStatsCard({
  totalWords,
  totalSessions,
  averageAccuracy,
}: WordStatsCardProps) {
  const [displayCount, setDisplayCount] = useState(0);

  // Smooth count-up animation
  useEffect(() => {
    const end = totalWords;
    if (end === 0) {
      setDisplayCount(0);
      return;
    }

    const duration = 900; // ms
    const frameRate = 1000 / 60;
    const totalFrames = Math.round(duration / frameRate);
    let frame = 0;

    const timer = setInterval(() => {
      frame++;
      const progress = frame / totalFrames;
      // easeOutExpo
      const current = Math.round(end * (1 - Math.pow(2, -10 * progress)));
      setDisplayCount(current);

      if (frame >= totalFrames) {
        setDisplayCount(end);
        clearInterval(timer);
      }
    }, frameRate);

    return () => clearInterval(timer);
  }, [totalWords]);

  return (
    <div className="bg-card rounded-2xl p-6 sm:p-8 border border-border shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-primary/40 transition">
      <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition">
        <BookOpen className="w-32 h-32 text-primary" />
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-primary font-medium text-xs uppercase tracking-wider">
          <Award className="w-4 h-4" />
          累計発話ワード数
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground font-mono">
            {displayCount.toLocaleString()}
          </span>
          <span className="text-sm font-medium text-muted-foreground">words</span>
        </div>
        <p className="text-xs text-muted-foreground">
          正確に発話・シャドーイングできた累計単語数です。
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-6 mt-6 border-t border-border/80">
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" />
            総セッション数
          </span>
          <p className="text-lg font-bold text-foreground">
            {totalSessions} <span className="text-xs font-normal text-muted-foreground">回</span>
          </p>
        </div>

        {averageAccuracy !== undefined && (
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Target className="w-3.5 h-3.5" />
              平均正解率
            </span>
            <p className="text-lg font-bold text-foreground">
              {averageAccuracy}%
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
