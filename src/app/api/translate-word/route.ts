import { NextRequest, NextResponse } from "next/server";
import { getOpenAIClient } from "@/lib/ai/openai";
import { checkRateLimit } from "@/lib/security/rate-limiter";

export async function POST(req: NextRequest) {
  try {
    const rateLimit = checkRateLimit(req, {
      namespace: "translate-word",
      maxRequests: 60,
      windowMs: 60_000,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many translation requests. Please try again shortly." },
        {
          status: 429,
          headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
        }
      );
    }

    const body = await req.json();
    const word = typeof body.word === "string" ? body.word.trim().slice(0, 60) : "";
    const sentence = typeof body.sentence === "string" ? body.sentence.trim().slice(0, 500) : "";

    if (!word) {
      return NextResponse.json({ error: "Word is required" }, { status: 400 });
    }

    try {
      const openai = getOpenAIClient();
      const prompt = sentence
        ? `Sentence: "${sentence}"\nTarget Word: "${word}"\nTranslate the target word in this context into a concise Japanese meaning (1-5 Japanese characters/words):`
        : `Word: "${word}"\nTranslate this English word into a concise Japanese meaning (1-5 Japanese characters/words):`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are an English-to-Japanese dictionary engine for an English shadowing app. Return ONLY the concise Japanese translation of the given word (e.g., '循環', '最適化', '照会'). Do not include explanation, pronunciation, punctuation, or quotes.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 20,
        temperature: 0.2,
      });

      const translation = completion.choices[0]?.message?.content?.trim();
      if (translation) {
        return NextResponse.json({ translation });
      }
    } catch (openaiErr) {
      console.warn("OpenAI translate-word fallback:", openaiErr);
    }

    return NextResponse.json({ translation: word });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Translation error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
