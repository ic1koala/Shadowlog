"use client";

import { useState, useEffect, useCallback } from "react";
import { PracticeSession, UserStats } from "@/types";
import { calculateUserStats } from "@/lib/stats/stats-calculator";

export function useStats() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Fetch from API
      let apiSessions: PracticeSession[] = [];
      try {
        const res = await fetch("/api/stats");
        if (res.ok) {
          const data = await res.json();
          apiSessions = data.sessions || [];
        }
      } catch (e) {
        console.warn("Failed to fetch /api/stats, relying on local storage:", e);
      }

      // 2. Read local sessions from localStorage (for guest / offline / immediate persistence)
      let localSessions: PracticeSession[] = [];
      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem("shadowlog_stored_sessions");
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              localSessions = parsed
                .filter((s: { id?: string }) => s && s.id && !s.id.startsWith("session-init-"))
                .map((s: {
                  id: string;
                  sentence?: string;
                  transcription?: string;
                  wordCount?: number;
                  matchedWordCount?: number;
                  accuracyScore?: number;
                  createdAt?: string;
                }) => ({
                  id: s.id,
                  sentence: s.sentence || "",
                  transcription: s.transcription || "",
                  wordCount: s.wordCount || 0,
                  matchedWordCount: s.matchedWordCount || 0,
                  accuracyScore: s.accuracyScore || 0,
                  createdAt: s.createdAt || new Date().toISOString(),
                }));
            }
          }
        } catch {
          // ignore
        }
      }

      // 3. Filter out any dummy session-init from apiSessions as well
      const cleanApiSessions = apiSessions.filter(
        (s) => s && s.id && !s.id.startsWith("session-init-")
      );

      // 4. Merge sessions deduplicated by ID, latest first
      const sessionMap = new Map<string, PracticeSession>();
      for (const s of cleanApiSessions) {
        sessionMap.set(s.id, s);
      }
      for (const s of localSessions) {
        sessionMap.set(s.id, s);
      }

      const mergedSessions = Array.from(sessionMap.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      const calculatedStats = calculateUserStats(mergedSessions);
      setStats(calculatedStats);
      setSessions(mergedSessions);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "データ取得中にエラーが発生しました";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resetStats = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Clear API stats
      try {
        await fetch("/api/stats", { method: "DELETE" });
      } catch (err) {
        console.warn("Failed to reset API stats:", err);
      }

      // 2. Clear localStorage sessions and weak words
      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem("shadowlog_stored_sessions");
          localStorage.removeItem("shadowlog_weak_words");
          window.dispatchEvent(new Event("shadowlog:session-update"));
        } catch {
          // ignore
        }
      }

      setStats({
        totalWords: 0,
        totalSessions: 0,
        currentStreak: 0,
        bestStreak: 0,
        dailyCounts: {},
      });
      setSessions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();

    // Listen for custom event when practice session is saved
    const handleUpdate = () => {
      fetchStats();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("shadowlog:session-update", handleUpdate);
      window.addEventListener("storage", handleUpdate);
      return () => {
        window.removeEventListener("shadowlog:session-update", handleUpdate);
        window.removeEventListener("storage", handleUpdate);
      };
    }
  }, [fetchStats]);

  return {
    stats,
    sessions,
    isLoading,
    error,
    refresh: fetchStats,
    resetStats,
  };
}
