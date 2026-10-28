import { NextRequest, NextResponse } from "next/server";
import { YoutubeTranscript } from "youtube-transcript";
import { getOpenAIClient } from "@/lib/ai/openai";
import { checkRateLimit } from "@/lib/security/rate-limiter";
import {
  extractYouTubeVideoId,
  fetchYouTubeOEmbed,
  cleanHtmlText,
  isSafeExternalUrl,
  extractTextFromPdfBuffer,
} from "@/lib/scrap/parser";

export const dynamic = "force-dynamic";

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
        {
          status: 429,
          headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
        }
      );
    }

    const contentType = req.headers.get("content-type") || "";
    let type: "youtube" | "web" | "text" | "pdf" = "text";
    let rawInput = "";
    let level = "intermediate";
    let pdfFileName = "";
    let pdfExtractedText = "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      level = (formData.get("level") as string) || "intermediate";
      const textFallback = (formData.get("input") as string) || "";

      if (file && file.size > 0) {
        if (file.size > 10 * 1024 * 1024) {
          return NextResponse.json(
            { error: "PDFファイルのサイズは10MB以下にしてください。" },
            { status: 400 }
          );
        }
        type = "pdf";
        pdfFileName = file.name.replace(/\.pdf$/i, "") || "PDFドキュメント";
        const arrayBuf = await file.arrayBuffer();
        pdfExtractedText = extractTextFromPdfBuffer(Buffer.from(arrayBuf));
        if (textFallback.trim()) {
          pdfExtractedText = `${pdfExtractedText}\n${textFallback.trim()}`.trim();
        }
      } else if (textFallback.trim()) {
        type = "text";
        rawInput = textFallback.trim();
      } else {
        return NextResponse.json(
          { error: "PDFファイルまたはテキストを選択・入力してください。" },
          { status: 400 }
        );
      }
    } else {
      let body: Record<string, unknown>;
      try {
        body = (await req.json()) as Record<string, unknown>;
      } catch {
        return NextResponse.json(
          { error: "リクエストの形式が正しくありません。" },
          { status: 400 }
        );
      }
      type = (body.type as "youtube" | "web" | "text" | "pdf") || "text";
      rawInput = typeof body.input === "string" ? body.input.trim() : "";
      level = (body.level as string) || "intermediate";

      if (type === "pdf" && typeof body.pdfBase64 === "string" && body.pdfBase64) {
        pdfFileName = typeof body.fileName === "string" ? body.fileName.replace(/\.pdf$/i, "") : "PDFドキュメント";
        const base64Clean = body.pdfBase64.replace(/^data:application\/pdf;base64,/, "");
        const buf = Buffer.from(base64Clean, "base64");
        if (buf.byteLength > 10 * 1024 * 1024) {
          return NextResponse.json(
            { error: "PDFファイルのサイズは10MB以下にしてください。" },
            { status: 400 }
          );
        }
        pdfExtractedText = extractTextFromPdfBuffer(buf);
      }
    }

    if (type !== "pdf" && !rawInput) {
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

        for (const item of transcriptItems.slice(0, 120)) {
          const cleanText = item.text.replace(/\[.*?\]/g, "").replace(/\s+/g, " ").trim();
          if (cleanText) {
            validLines.push(cleanText);
            if (validLines.length <= 40) {
              const words = cleanText.split(/\s+/).filter(Boolean).length;
              totalWords += words;
              totalDurationSec += (item.duration || 2000) / 1000;
            }
          }
        }

        if (totalDurationSec > 5 && totalWords > 10) {
          measuredWpm = Math.round((totalWords / totalDurationSec) * 60);
          // Clamp realistic speaking rate
          measuredWpm = Math.min(200, Math.max(120, measuredWpm));
        }

        extractedText = validLines.join(" ").slice(0, 12000);
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
        if (!isSafeExternalUrl(parsedUrl)) {
          return NextResponse.json(
            { error: "有効な外部Web記事のURL（https://...）を入力してください。" },
            { status: 400 }
          );
        }
        const res = await fetch(parsedUrl.toString(), {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            Accept: "text/html,application/xhtml+xml",
          },
          redirect: "follow",
          signal: AbortSignal.timeout(8000),
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const html = (await res.text()).slice(0, 250_000);
        const text = cleanHtmlText(html);
        extractedText = text.slice(0, 12000);
        sourceTitle = parsedUrl.hostname;
      } catch {
        return NextResponse.json(
          {
            error: "Web記事の取得に失敗しました。URLを確認するか、記事本文を直接コピーして「テキスト」タブに貼り付けてください。",
          },
          { status: 422 }
        );
      }
    }
    // 3. PDF File Upload Extraction
    else if (type === "pdf") {
      extractedText = (pdfExtractedText || rawInput).slice(0, 12000);
      sourceTitle = pdfFileName || "PDFドキュメント";
      if (!extractedText || extractedText.length < 20) {
        return NextResponse.json(
          {
            error:
              "このPDFから十分な英語テキストを抽出できませんでした（スキャン画像PDFまたは特殊フォントの可能性があります）。PDF内のテキストをコピーして下のテキスト欄に貼り付けてお試しください。",
          },
          { status: 422 }
        );
      }
    }
    // 4. Plain Text / PDF Copy-Paste
    else {
      extractedText = rawInput.slice(0, 12000);
      sourceTitle = "カスタムテキスト";
    }

    if (!extractedText || extractedText.length < 20) {
      return NextResponse.json(
        { error: "抽出された英文テキストが少なすぎます。より十分な長さの英文をご用意ください。" },
        { status: 400 }
      );
    }

    const promptExcerpt = extractedText.slice(0, 4500);

    // 5. Use OpenAI GPT-4o-mini to extract and polish the initial passage
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
          content: `Target level: ${level}\nSource Type: ${type}\nRaw content:\n"""\n${promptExcerpt}\n"""`,
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
    const passageText = typeof parsedAi.passage === "string" ? parsedAi.passage.trim() : "";
    if (!passageText) {
      throw new Error("Empty passage returned from AI");
    }

    return NextResponse.json({
      success: true,
      title: parsedAi.title || sourceTitle,
      summary: parsedAi.summary || "",
      passage: passageText,
      translation: parsedAi.translation || "",
      rawText: extractedText,
      targetWpm: measuredWpm || (level === "advanced" ? 160 : level === "beginner" ? 120 : 140),
      sourceType: type,
      sourceUrl: type === "text" || type === "pdf" ? undefined : rawInput,
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
