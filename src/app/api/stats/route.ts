import { NextRequest, NextResponse } from "next/server";
import { PracticeSession } from "@/types";
import { PracticeSessionRow, PracticeSessionInsert } from "@/types/database";
import { calculateUserStats } from "@/lib/stats/stats-calculator";
import { createClient } from "@/lib/supabase/server";

// Fallback in-memory store for development/testing when Supabase is unconfigured
const mockSessionsStore: PracticeSession[] = [
  {
    id: "session-init-1",
    sentence: "We should optimize our cloud infrastructure for maximum reliability.",
    transcription: "We should optimize our cloud infrastructure for maximum reliability.",
    wordCount: 9,
    matchedWordCount: 9,
    accuracyScore: 100,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // yesterday
  },
  {
    id: "session-init-2",
    sentence: "The quarterly financial earnings exceeded our initial projections.",
    transcription: "The quarterly financial earnings exceeded our projections.",
    wordCount: 8,
    matchedWordCount: 7,
    accuracyScore: 88,
    createdAt: new Date().toISOString(), // today
  },
];

export async function GET() {
  try {
    let sessions: PracticeSession[] = [];

    const isSupabaseConfigured =
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder-project");

    if (isSupabaseConfigured) {
      try {
        const supabase = await createClient();
        const { data, error } = await supabase
          .from("practice_sessions")
          .select("*")
          .order("created_at", { ascending: false });

        if (!error && data) {
          const rows = data as unknown as PracticeSessionRow[];
          sessions = rows.map((row) => ({
            id: row.id,
            userId: row.user_id || undefined,
            sentence: row.sentence,
            transcription: row.transcription,
            wordCount: row.word_count,
            matchedWordCount: row.matched_word_count,
            accuracyScore: row.accuracy_score,
            createdAt: row.created_at,
          }));
        } else {
          sessions = mockSessionsStore;
        }
      } catch {
        sessions = mockSessionsStore;
      }
    } else {
      sessions = mockSessionsStore;
    }

    const stats = calculateUserStats(sessions);
    return NextResponse.json({ stats, sessions }, { status: 200 });
  } catch (error) {
    console.error("GET /api/stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    let body: {
      sentence?: string;
      transcription?: string;
      wordCount?: number;
      matchedWordCount?: number;
      accuracyScore?: number;
    } = {};

    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const {
      sentence = "",
      transcription = "",
      wordCount = 0,
      matchedWordCount = 0,
      accuracyScore = 0,
    } = body;

    if (!sentence || typeof sentence !== "string") {
      return NextResponse.json(
        { error: "sentence is required and must be a string" },
        { status: 400 }
      );
    }

    const newSession: PracticeSession = {
      id: `session-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      sentence,
      transcription,
      wordCount,
      matchedWordCount,
      accuracyScore,
      createdAt: new Date().toISOString(),
    };

    const isSupabaseConfigured =
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder-project");

    if (isSupabaseConfigured) {
      try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        const insertPayload: PracticeSessionInsert = {
          id: newSession.id,
          user_id: user?.id || null,
          sentence: newSession.sentence,
          transcription: newSession.transcription,
          word_count: newSession.wordCount,
          matched_word_count: newSession.matchedWordCount,
          accuracy_score: newSession.accuracyScore,
          created_at: newSession.createdAt,
        };

        await supabase.from("practice_sessions").insert(insertPayload);
      } catch (dbErr) {
        console.warn("Failed to persist to Supabase, saving to memory:", dbErr);
      }
    }

    mockSessionsStore.unshift(newSession);

    const updatedStats = calculateUserStats(mockSessionsStore);

    return NextResponse.json(
      {
        success: true,
        session: newSession,
        stats: updatedStats,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/stats error:", error);
    return NextResponse.json(
      { error: "Failed to record practice session" },
      { status: 500 }
    );
  }
}
