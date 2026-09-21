"use client";

import { useState, useEffect, useCallback } from "react";
import { PracticeSession, UserStats } from "@/types";

export function useStats() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stats");
      if (!res.ok) {
        throw new Error(`統計データの取得に失敗しました (status: ${res.status})`);
      }
      const data = await res.json();
      setStats(data.stats);
      setSessions(data.sessions || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "データ取得中にエラーが発生しました";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    sessions,
    isLoading,
    error,
    refresh: fetchStats,
  };
}
