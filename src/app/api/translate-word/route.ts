import { NextRequest, NextResponse } from "next/server";
import { getOpenAIClient } from "@/lib/ai/openai";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const word = typeof body.word === "string" ? body.word.trim() : "";
    const sentence = typeof body.sentence === "string" ? body.sentence.trim() : "";

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
