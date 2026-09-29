import { NextRequest, NextResponse } from "next/server";
import { PracticeSession } from "@/types";
import { PracticeSessionRow, PracticeSessionInsert } from "@/types/database";
import { calculateUserStats } from "@/lib/stats/stats-calculator";
import { createClient } from "@/lib/supabase/server";

// Fallback in-memory store for development/testing when Supabase is unconfigured (starts empty)
const mockSessionsStore: PracticeSession[] = [];

export async function GET() {
  try {
    let sessions: PracticeSession[] = [];

    const isSupabaseConfigured =
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder-project");

    if (isSupabaseConfigured) {
      try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        let query = supabase
          .from("practice_sessions")
          .select("*")
          .order("created_at", { ascending: false });

        if (user?.id) {
          query = query.eq("user_id", user.id);
        }

        const { data, error } = await query;

        if (!error && data) {
          const rows = data as unknown as PracticeSessionRow[];
          sessions = rows.map((row) => {
            const sentenceText = row.text_en || row.sentence || "";
            const transcriptionText = row.transcribed_text || row.transcription || "";
            const words = sentenceText.split(/\s+/).filter(Boolean);
            const accuracy = Number(row.accuracy_score) || 0;
            const wordCount = row.word_count ?? words.length;
            const matchedWordCount = row.matched_word_count ?? Math.round((wordCount * accuracy) / 100);

            return {
              id: row.sentence_id || row.id,
              userId: row.user_id || undefined,
              sentence: sentenceText,
              transcription: transcriptionText,
              wordCount,
              matchedWordCount,
              accuracyScore: accuracy,
              wpm: row.wpm !== null && row.wpm !== undefined ? Number(row.wpm) : undefined,
              createdAt: row.created_at,
            };
          });
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
      id?: string;
      sentence?: string;
      text_en?: string;
      japanese?: string;
      text_jp?: string;
      transcription?: string;
      transcribed_text?: string;
      wordCount?: number;
      matchedWordCount?: number;
      accuracyScore?: number;
      accuracy_score?: number;
      wpm?: number;
      diff?: unknown;
      diffResult?: unknown;
      diff_result?: unknown;
      coachFeedback?: unknown;
      coach_feedback?: unknown;
    } = {};

    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const sentence = body.sentence || body.text_en || "";
    const transcription = body.transcription || body.transcribed_text || "";
    const japanese = body.japanese || body.text_jp || null;
    const accuracyScore = Number(body.accuracyScore ?? body.accuracy_score ?? 0);
    const wordCount = Number(body.wordCount ?? sentence.split(/\s+/).filter(Boolean).length);
    const matchedWordCount = Number(body.matchedWordCount ?? Math.round((wordCount * accuracyScore) / 100));
    const wpm = typeof body.wpm === "number" ? body.wpm : undefined;
    const diff = (body.diff || body.diffResult || body.diff_result || null) as import("@/types/database").Json;
    const coachFeedback = (body.coachFeedback || body.coach_feedback || null) as import("@/types/database").Json;

    if (!sentence || typeof sentence !== "string") {
      return NextResponse.json(
        { error: "sentence is required and must be a string" },
        { status: 400 }
      );
    }

    const newSession: PracticeSession = {
      id: body.id || `session-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      sentence,
      transcription,
      wordCount,
      matchedWordCount,
      accuracyScore,
      wpm,
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
          user_id: user?.id || null,
          sentence_id: newSession.id,
          text_en: newSession.sentence,
          text_jp: japanese,
          transcribed_text: newSession.transcription || null,
          accuracy_score: newSession.accuracyScore,
          wpm: typeof newSession.wpm === "number" ? newSession.wpm : 0,
          diff_result: diff,
          coach_feedback: coachFeedback,
          created_at: newSession.createdAt,
        };

        const { error: insertError } = await supabase.from("practice_sessions").insert(insertPayload);
        if (insertError) {
          console.warn("Failed to persist to Supabase practice_sessions:", insertError);
        }
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

export async function DELETE() {
  try {
    mockSessionsStore.length = 0;
    const isSupabaseConfigured =
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder-project");

    if (isSupabaseConfigured) {
      try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("practice_sessions").delete().eq("user_id", user.id);
        }
      } catch (err) {
        console.warn("Failed to delete from Supabase:", err);
      }
    }

    return NextResponse.json({ success: true, message: "Stats reset successfully" }, { status: 200 });
  } catch (error) {
    console.error("DELETE /api/stats error:", error);
    return NextResponse.json({ error: "Failed to reset stats" }, { status: 500 });
  }
}

