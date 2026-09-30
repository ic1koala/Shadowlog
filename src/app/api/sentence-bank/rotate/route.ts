import { NextRequest, NextResponse } from "next/server";
import { DifficultyLevel, Industry, PracticeMode, normalizeIndustry } from "@/types";
import { rotateMostUsedSentences } from "@/lib/ai/sentence-bank";

export async function POST(req: NextRequest) {
  try {
    let body: { industry?: string; level?: string; mode?: string } = {};
    try {
      body = await req.json();
    } catch {
      // Empty body is valid (rotates all slots)
    }

    const industry: Industry | undefined = body.industry
      ? normalizeIndustry(body.industry)
      : undefined;
    const level =
      body.level === "beginner" ||
      body.level === "intermediate" ||
      body.level === "advanced"
        ? (body.level as DifficultyLevel)
        : undefined;
    const mode: PracticeMode | undefined =
      body.mode === "passage" || body.mode === "sentence"
        ? (body.mode as PracticeMode)
        : undefined;

    const slots = await rotateMostUsedSentences({ industry, level, mode });
    const totalRemoved = slots.reduce((sum, s) => sum + s.removedCount, 0);

    return NextResponse.json(
      {
        ok: true,
        rotatedAt: new Date().toISOString(),
        totalRemoved,
        slots,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in sentence-bank/rotate route:", error);
    return NextResponse.json(
      { error: "Failed to rotate sentence bank" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const slots = await rotateMostUsedSentences();
    const totalRemoved = slots.reduce((sum, s) => sum + s.removedCount, 0);

    return NextResponse.json(
      {
        ok: true,
        rotatedAt: new Date().toISOString(),
        totalRemoved,
        slots,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in sentence-bank/rotate GET route:", error);
    return NextResponse.json(
      { error: "Failed to rotate sentence bank" },
      { status: 500 }
    );
  }
}
