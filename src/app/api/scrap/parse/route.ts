import { NextRequest, NextResponse } from "next/server";
import { YoutubeTranscript } from "youtube-transcript";
import { getOpenAIClient } from "@/lib/ai/openai";
import { checkRateLimit } from "@/lib/security/rate-limiter";

export const dynamic = "force-dynamic";

/**
 * Extracts YouTube Video ID from various URL formats
 * (e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ, https://youtu.be/dQw4w9WgXcQ, etc.)
 */
export function extractYouTubeVideoId(url: string): string | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();

  // Direct 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.slice(1).split(/[?#]/)[0] || null;
    }
    if (parsed.hostname.includes("youtube.com")) {
      const v = parsed.searchParams.get("v");
      if (v) return v;
      // Handle /embed/ID or /v/ID or /shorts/ID
      const parts = parsed.pathname.split("/").filter(Boolean);
      const idx = parts.findIndex((p) => ["embed", "v", "shorts"].includes(p));
      if (idx !== -1 && parts[idx + 1]) {
        return parts[idx + 1].split(/[?#]/)[0];
      }
    }
  } catch {
    // Regex fallback
    const match = trimmed.match(
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
    );
    if (match && match[1]) return match[1];
  }
  return null;
}

/**
 * Fetches video metadata via official YouTube oEmbed API (safe, never blocked)
 */
export async function fetchYouTubeOEmbed(videoId: string): Promise<{ title?: string; author?: string }> {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
      {
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(4000),
      }
    );
    if (!res.ok) return {};
    const data = await res.json();
    return {
      title: typeof data.title === "string" ? data.title : undefined,
      author: typeof data.author_name === "string" ? data.author_name : undefined,
    };
  } catch {
    return {};
  }
}

/**
 * Strips HTML tags and excessive whitespace from plain HTML
 */
export function cleanHtmlText(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

export async function POST(req: NextRequest) {
  try {
    const rateLimit = checkRateLimit(req, {
      namespace: "parse-scrap",
      maxRequests: 15,
      windowMs: 60_000,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "リクエスト上限に達しました。少し時間をおいて再試行してください。" },
        { status: 429 }
      );
    }

    const body = await req.json();
    const type = body.type as "youtube" | "web" | "text";
    const rawInput = typeof body.input === "string" ? body.input.trim() : "";
    const level = (body.level as string) || "intermediate";

    if (!rawInput) {
      return NextResponse.json(
        { error: "入力内容（URLまたはテキスト）が空です。" },
        { status: 400 }
      );
    }

    let extractedText = "";
    let sourceTitle = "";
    let measuredWpm: number | undefined = undefined;

    // 1. YouTube Subtitle Extraction
    if (type === "youtube") {
      const videoId = extractYouTubeVideoId(rawInput);
      if (!videoId) {
        return NextResponse.json(
          { error: "有効なYouTubeのURLまたは動画IDが見つかりませんでした。URLを確認してください。" },
          { status: 400 }
        );
      }

      // Fetch official video title & author via oEmbed
      const oEmbed = await fetchYouTubeOEmbed(videoId);
      sourceTitle = oEmbed.title || `YouTube (${videoId})`;

      try {
        let transcriptItems;
        // Attempt 1: Fetch with specific English language preference
        try {
          transcriptItems = await YoutubeTranscript.fetchTranscript(videoId, { lang: "en" });
        } catch {
          // Attempt 2: Fallback to default fetch
          transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);
        }

        if (!transcriptItems || transcriptItems.length === 0) {
          throw new Error("字幕データが見つかりませんでした");
        }

        // Calculate actual native spoken WPM across first 60 seconds of transcript
        let totalWords = 0;
        let totalDurationSec = 0;
        const validLines: string[] = [];

        for (const item of transcriptItems.slice(0, 40)) {
          const cleanText = item.text.replace(/\[.*?\]/g, "").replace(/\s+/g, " ").trim();
          if (cleanText) {
            validLines.push(cleanText);
            const words = cleanText.split(/\s+/).filter(Boolean).length;
            totalWords += words;
            totalDurationSec += (item.duration || 2000) / 1000;
          }
        }

        if (totalDurationSec > 5 && totalWords > 10) {
          measuredWpm = Math.round((totalWords / totalDurationSec) * 60);
          // Clamp realistic speaking rate
          measuredWpm = Math.min(200, Math.max(120, measuredWpm));
        }

        extractedText = validLines.slice(0, 35).join(" ");
      } catch (err: unknown) {
        const rawMsg = err instanceof Error ? err.message : String(err);
        const isIpBlocked =
          rawMsg.includes("Transcript is disabled") ||
          rawMsg.includes("No transcripts are available") ||
          rawMsg.includes("429") ||
          rawMsg.includes("TooManyRequest");

        const errorMessage = isIpBlocked
          ? `「${sourceTitle}」の字幕取得に失敗しました。YouTube側のクラウドアクセス制限（ボット保護・429）によりサーバーからの直接取得がブロックされた可能性があります。`
          : "このYouTube動画から英語字幕を取得できませんでした。英語字幕（自動生成含む）が有効な動画URLをお試しください。";

        return NextResponse.json(
          {
            error: errorMessage,
            title: sourceTitle,
            videoId,
            details: rawMsg,
            suggestion:
              "YouTubeの「文字起こしを表示」や動画の概要欄からテキストをコピーし、「PDF/テキスト」タブに貼り付けると、すぐにシャドーイング教材として生成できます。",
          },
          { status: 422 }
        );
      }
    }
    // 2. Web Article URL Scraping
    else if (type === "web") {
      try {
        const parsedUrl = new URL(rawInput.startsWith("http") ? rawInput : `https://${rawInput}`);
        const res = await fetch(parsedUrl.toString(), {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            Accept: "text/html,application/xhtml+xml",
          },
          signal: AbortSignal.timeout(8000),
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const html = await res.text();
        const text = cleanHtmlText(html);
        extractedText = text.slice(0, 4000);
        sourceTitle = parsedUrl.hostname;
      } catch (err: unknown) {
        return NextResponse.json(
          {
            error: "Web記事の取得に失敗しました。URLを確認するか、記事本文を直接コピーして「テキスト」タブに貼り付けてください。",
          },
          { status: 422 }
        );
      }
    }
    // 3. Plain Text / PDF Copy-Paste
    else {
      extractedText = rawInput.slice(0, 4000);
      sourceTitle = "カスタムテキスト";
    }

    if (!extractedText || extractedText.length < 20) {
      return NextResponse.json(
        { error: "抽出された英文テキストが少なすぎます。より十分な長さの英文をご用意ください。" },
        { status: 400 }
      );
    }

    // 4. Use OpenAI GPT-4o-mini to extract and polish the passage
    const openai = getOpenAIClient();
    const systemPrompt = `You are an elite spoken English shadowing coach for ShadowLog.
The user provides a raw transcript or article excerpt from YouTube, Web news, or PDF.
Your task:
1. Select or craft the single best coherent, natural 3 to 4 sentence spoken passage (approximately 45-75 words) suitable for high-impact shadowing practice.
2. The passage must sound like natural, modern spoken English with clear rhythmic breath groups (chunks).
3. Do not include sound effects, stage directions, speaker labels, or markdown formatting in the passage.
4. Provide a clear, natural Japanese translation.
5. Create a concise 1-line Japanese summary of the topic.

Return STRICT JSON matching this schema:
{
  "title": "A concise English topic title (3-6 words)",
  "summary": "1-sentence Japanese summary",
  "passage": "Full English passage text of 3-4 sentences (45-75 words)",
  "translation": "Natural Japanese translation"
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Target level: ${level}\nSource Type: ${type}\nRaw content:\n"""\n${extractedText}\n"""`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.6,
      max_tokens: 600,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from AI");
    }

    const parsedAi = JSON.parse(content);

    return NextResponse.json({
      success: true,
      title: parsedAi.title || sourceTitle,
      summary: parsedAi.summary || "",
      passage: parsedAi.passage || "",
      translation: parsedAi.translation || "",
      targetWpm: measuredWpm || (level === "advanced" ? 160 : level === "beginner" ? 120 : 140),
      sourceType: type,
      sourceUrl: type === "text" ? undefined : rawInput,
    });
  } catch (error: unknown) {
    console.error("[Parse Scrap API Error]:", error);
    return NextResponse.json(
      {
        error: "教材の生成中にエラーが発生しました。内容をご確認の上、再度お試しください。",
      },
      { status: 500 }
    );
  }
}
