import { NextRequest, NextResponse } from "next/server";
import { getOpenAIClient } from "@/lib/ai/openai";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawText = searchParams.get("text");

    if (!rawText || !rawText.trim()) {
      return NextResponse.json({ error: "text parameter is required" }, { status: 400 });
    }

    // Sanitize: clean up punctuation and limit length
    const cleanText = rawText.replace(/^[^\w]+|[^\w]+$/g, "").trim().slice(0, 100);
    if (!cleanText) {
      return NextResponse.json({ error: "Invalid text parameter" }, { status: 400 });
    }

    const openai = getOpenAIClient();
    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: "alloy",
      input: cleanText,
      speed: 0.95,
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=604800, immutable",
      },
    });
  } catch (error: unknown) {
    console.warn("TTS API error:", error);
    return NextResponse.json(
      { error: "TTS generation failed" },
      { status: 500 }
    );
  }
}
