import { NextRequest, NextResponse } from "next/server";
import {
  DifficultyLevel,
  Industry,
  SentenceResponse,
  PracticeMode,
  normalizeIndustry,
} from "@/types";
import { getOpenAIClient, FALLBACK_SENTENCES } from "@/lib/ai/openai";
import {
  getSentenceGenerationPrompt,
  getPassageGenerationPrompt,
  getFallbackPassage,
} from "@/lib/ai/prompts";
import { countWords } from "@/lib/diff/diff-calculator";
import {
  isSlotFull,
  pickFromSentenceBank,
  saveToSentenceBank,
} from "@/lib/ai/sentence-bank";
import { checkRateLimit } from "@/lib/security/rate-limiter";

const VALID_LEVELS: DifficultyLevel[] = ["beginner", "intermediate", "advanced"];

export async function POST(req: NextRequest) {
  try {
    const rateLimit = checkRateLimit(req, {
      namespace: "generate-sentence",
      maxRequests: 30,
      windowMs: 60_000,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "リクエスト回数の上限に達しました。少し時間をおいて再試行してください。" },
        {
          status: 429,
          headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
        }
      );
    }

    let body: {
      industry?: string;
      level?: string;
      topic?: string;
      mode?: string;
      weakWords?: string[];
      excludeIds?: string[];
      preferBank?: boolean;
    } = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const industry: Industry = normalizeIndustry(body.industry);

    const level: DifficultyLevel = VALID_LEVELS.includes(body.level as DifficultyLevel)
      ? (body.level as DifficultyLevel)
      : "intermediate";

    const mode: PracticeMode = body.mode === "passage" ? "passage" : "sentence";
    const topic = typeof body.topic === "string" ? body.topic.trim().slice(0, 100) : undefined;
    const weakWords: string[] = Array.isArray(body.weakWords)
      ? body.weakWords.filter((w): w is string => typeof w === "string").slice(0, 5)
      : [];
    const excludeIds: string[] = Array.isArray(body.excludeIds)
      ? body.excludeIds.filter((id): id is string => typeof id === "string")
      : [];
    const preferBank = Boolean(body.preferBank);

    // 1. If the sentence bank slot has reached 300 (or preferBank is requested), serve from the bank
    const slotFull = await isSlotFull(industry, level, mode);
    if (slotFull || preferBank) {
      const banked = await pickFromSentenceBank({
        industry,
        level,
        mode,
        excludeIds,
        weakWords,
      });
      if (banked) {
        return NextResponse.json(banked, { status: 200 });
      }
    }

    // 2. Otherwise generate a new sentence via OpenAI and store it in the sentence bank
    try {
      const openai = getOpenAIClient();
      const { systemPrompt, userPrompt } =
        mode === "passage"
          ? getPassageGenerationPrompt(industry, level, topic)
          : getSentenceGenerationPrompt(industry, level, topic, weakWords);

      // Generate sentence text with GPT-4o-mini
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.85,
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

      // Generate model audio using TTS-1
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

      // Save newly generated sentence to the bank (up to 300 per slot)
      const savedRecord = await saveToSentenceBank(responsePayload);
      if (savedRecord) {
        responsePayload.id = savedRecord.id;
      }

      return NextResponse.json(responsePayload, { status: 200 });
    } catch (openaiErr) {
      console.warn("OpenAI API call failed, checking sentence bank or fallback:", openaiErr);

      // Try sentence bank before static fallback
      const banked = await pickFromSentenceBank({
        industry,
        level,
        mode,
        excludeIds,
        weakWords,
      });
      if (banked) {
        return NextResponse.json(banked, { status: 200 });
      }

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
