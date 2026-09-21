import { NextRequest, NextResponse } from "next/server";
import { DifficultyLevel, Industry, SentenceResponse, PracticeMode } from "@/types";
import { getOpenAIClient, FALLBACK_SENTENCES } from "@/lib/ai/openai";
import {
  getSentenceGenerationPrompt,
  getPassageGenerationPrompt,
  getFallbackPassage,
} from "@/lib/ai/prompts";
import { countWords } from "@/lib/diff/diff-calculator";

const VALID_INDUSTRIES: Industry[] = [
  "tech",
  "business",
  "finance",
  "medical",
  "marketing",
  "daily",
];

const VALID_LEVELS: DifficultyLevel[] = ["beginner", "intermediate", "advanced"];

export async function POST(req: NextRequest) {
  try {
    let body: { industry?: string; level?: string; topic?: string; mode?: string } = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const industry: Industry = VALID_INDUSTRIES.includes(body.industry as Industry)
      ? (body.industry as Industry)
      : "tech";

    const level: DifficultyLevel = VALID_LEVELS.includes(body.level as DifficultyLevel)
      ? (body.level as DifficultyLevel)
      : "intermediate";

    const mode: PracticeMode = body.mode === "passage" ? "passage" : "sentence";
    const topic = typeof body.topic === "string" ? body.topic.trim() : undefined;

    // Check if OpenAI API key is configured
    try {
      const openai = getOpenAIClient();
      const { systemPrompt, userPrompt } =
        mode === "passage"
          ? getPassageGenerationPrompt(industry, level, topic)
          : getSentenceGenerationPrompt(industry, level, topic);

      // 1. Generate sentence text with GPT-4o-mini
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      const responseText = completion.choices[0]?.message?.content;
      if (!responseText) {
        throw new Error("Empty response from OpenAI chat completion");
      }

      const parsed = JSON.parse(responseText) as { english?: string; japanese?: string };
      const english = (parsed.english || "").trim();
      const japanese = (parsed.japanese || "").trim();

      if (!english) {
        throw new Error("OpenAI returned an empty English sentence");
      }

      // 2. Generate model audio using TTS-1
      let audioBase64: string | undefined;
      try {
        const mp3 = await openai.audio.speech.create({
          model: "tts-1",
          voice: "alloy",
          input: english,
          speed: level === "beginner" ? 0.9 : 1.0,
        });
        const buffer = Buffer.from(await mp3.arrayBuffer());
        audioBase64 = buffer.toString("base64");
      } catch (ttsError) {
        console.warn("TTS generation failed or skipped:", ttsError);
      }

      const responsePayload: SentenceResponse = {
        id: `sent-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        english,
        japanese,
        audioBase64,
        wordCount: countWords(english),
        industry,
        level,
        mode,
      };

      return NextResponse.json(responsePayload, { status: 200 });
    } catch (openaiErr) {
      console.warn("OpenAI API call failed, falling back to mock sentence:", openaiErr);

      // Graceful fallback for offline / development / missing key
      let fallbackText = "";
      let fallbackJa = "";

      if (mode === "passage") {
        const passage = getFallbackPassage(industry, level);
        fallbackText = passage.english;
        fallbackJa = passage.japanese;
      } else {
        const fallback =
          FALLBACK_SENTENCES.find(
            (s) => s.industry === industry && s.level === level
          ) ||
          FALLBACK_SENTENCES.find((s) => s.industry === industry) ||
          FALLBACK_SENTENCES[0]!;
        fallbackText = fallback.english;
        fallbackJa = fallback.japanese;
      }

      const responsePayload: SentenceResponse = {
        id: `fallback-${Date.now()}`,
        english: fallbackText,
        japanese: fallbackJa,
        wordCount: countWords(fallbackText),
        industry,
        level,
        mode,
      };

      return NextResponse.json(responsePayload, { status: 200 });
    }
  } catch (error) {
    console.error("Unexpected error in generate-sentence route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
