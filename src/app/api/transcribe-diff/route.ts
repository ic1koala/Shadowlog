import { NextRequest, NextResponse } from "next/server";
import { getOpenAIClient } from "@/lib/ai/openai";
import { calculateDiff } from "@/lib/diff/diff-calculator";
import {
  getCoachReviewPrompt,
  getPassageCoachReviewPrompt,
  generateFallbackCoachFeedback,
} from "@/lib/ai/prompts";
import { calculateWPM } from "@/lib/diff/wpm-calculator";
import { CoachFeedback, TranscribeDiffResponse, PracticeMode, WPMInfo } from "@/types";
import { checkRateLimit } from "@/lib/security/rate-limiter";
import { evaluatePronunciationWithAzure } from "@/lib/ai/azure-speech";

const MAX_AUDIO_BYTES = 10 * 1024 * 1024; // 10MB max audio upload size
const MAX_TEXT_LENGTH = 2000;

/**
 * Maps audio MIME types to file extensions supported by OpenAI Whisper API.
 * iOS Safari records as audio/mp4, Chrome as audio/webm.
 */
function getExtensionFromMime(mimeType: string): string {
  const mime = mimeType.toLowerCase().split(";")[0]?.trim() || "";
  const map: Record<string, string> = {
    "audio/webm": "webm",
    "audio/mp4": "mp4",
    "audio/m4a": "m4a",
    "audio/aac": "aac",
    "audio/mpeg": "mp3",
    "audio/ogg": "ogg",
    "audio/wav": "wav",
    "audio/x-wav": "wav",
    "audio/flac": "flac",
  };
  return map[mime] || "webm";
}

export async function POST(req: NextRequest) {
  try {
    const rateLimit = checkRateLimit(req, {
      namespace: "transcribe-diff",
      maxRequests: 20,
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

    let originalText = "";
    let audioFile: File | null = null;
    let audioBase64: string | null = null;
    let durationSeconds: number | undefined;
    let mode: PracticeMode = "sentence";
    let engine: "whisper" | "azure" = "whisper";
    let averageVolume: number | undefined;

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      originalText = (formData.get("originalText") as string) || "";
      const durStr = formData.get("durationSeconds") as string;
      if (durStr) durationSeconds = parseFloat(durStr);
      if (formData.get("mode") === "passage") mode = "passage";
      if (formData.get("engine") === "azure") engine = "azure";
      const volStr = formData.get("averageVolume") as string;
      if (volStr) averageVolume = parseFloat(volStr);

      const file = formData.get("audio");
      if (file && typeof file === "object" && "arrayBuffer" in file) {
        audioFile = file as File;
      }
    } else if (contentType.includes("application/json")) {
      const json = await req.json();
      originalText = json.originalText || "";
      audioBase64 = json.audioBase64 || null;
      if (typeof json.durationSeconds === "number") durationSeconds = json.durationSeconds;
      if (json.mode === "passage") mode = "passage";
      if (json.engine === "azure") engine = "azure";
      if (typeof json.averageVolume === "number") averageVolume = json.averageVolume;
    } else {
      return NextResponse.json(
        { error: "Unsupported Content-Type. Use multipart/form-data or application/json" },
        { status: 400 }
      );
    }

    if (!originalText || originalText.trim() === "") {
      return NextResponse.json(
        { error: "originalText is required" },
        { status: 400 }
      );
    }

    originalText = originalText.trim().slice(0, MAX_TEXT_LENGTH);

    // Header mock support for deterministic testing (restricted to test environment)
    const mockTranscription =
      process.env.NODE_ENV === "test" ? req.headers.get("x-mock-transcription") : null;
    if (mockTranscription !== null) {
      const diff = calculateDiff(originalText, mockTranscription);
      const coachFeedback = generateFallbackCoachFeedback(diff);
      const response: TranscribeDiffResponse = {
        transcription: mockTranscription,
        diff,
        coachFeedback,
      };
      return NextResponse.json(response, { status: 200 });
    }

    // Validate audio existence
    if (!audioFile && !audioBase64) {
      return NextResponse.json(
        { error: "Audio data is missing or empty. Please record your speech." },
        { status: 400 }
      );
    }

    // Extract audio buffer & size check
    let audioBuffer: Buffer;
    if (audioFile) {
      if (audioFile.size > MAX_AUDIO_BYTES) {
        return NextResponse.json(
          { error: "音声ファイルのサイズが大きすぎます（上限10MB）。" },
          { status: 413 }
        );
      }
      if (audioFile.size === 0) {
        return NextResponse.json(
          { error: "Audio file is empty. Please speak into the microphone." },
          { status: 400 }
        );
      }
      audioBuffer = Buffer.from(await audioFile.arrayBuffer());
    } else if (audioBase64) {
      audioBuffer = Buffer.from(audioBase64, "base64");
      if (audioBuffer.byteLength > MAX_AUDIO_BYTES) {
        return NextResponse.json(
          { error: "音声ファイルのサイズが大きすぎます（上限10MB）。" },
          { status: 413 }
        );
      }
      if (audioBuffer.byteLength === 0) {
        return NextResponse.json(
          { error: "Audio file is empty. Please speak into the microphone." },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "No audio payload" },
        { status: 400 }
      );
    }

    // ── Engine Branch: Azure AI Speech Pronunciation Assessment (Admin PoC) ──
    if (engine === "azure") {
      try {
        const azureAssessment = await evaluatePronunciationWithAzure({
          audioBuffer,
          mimeType: audioFile?.type,
          referenceText: originalText,
          averageVolume,
        });

        const transcriptionText =
          azureAssessment.displayText ||
          azureAssessment.words.map((w) => w.word).join(" ") ||
          originalText;

        const diff = calculateDiff(originalText, transcriptionText);
        if (azureAssessment.overallScore > 0) {
          diff.accuracyScore = azureAssessment.overallScore;
        }

        let wpmInfo: WPMInfo | undefined;
        if (typeof durationSeconds === "number" && durationSeconds > 0) {
          wpmInfo = calculateWPM(diff.spokenWordCount, durationSeconds);
        }

        const coachFeedback = generateFallbackCoachFeedback(diff, wpmInfo);

        const response: TranscribeDiffResponse = {
          transcription: transcriptionText,
          diff,
          coachFeedback,
          wpmInfo,
          azureAssessment,
        };

        return NextResponse.json(response, { status: 200 });
      } catch (azureErr) {
        console.warn("Azure pronunciation assessment failed, falling back to Whisper:", azureErr);
        // Fall back to standard Whisper pipeline below
      }
    }

    // ── Standard Whisper Engine (100% stable for all normal users) ──
    let transcriptionText = "";

    try {
      const openai = getOpenAIClient();

      const ext = audioFile ? getExtensionFromMime(audioFile.type) : "webm";
      const fileName = `recording.${ext}`;
      const fileToTranscribe = new File([new Uint8Array(audioBuffer)], fileName, {
        type: audioFile?.type || "audio/webm",
      });

      if (fileToTranscribe.size === 0) {
        return NextResponse.json(
          { error: "Audio file is empty. Please speak into the microphone." },
          { status: 400 }
        );
      }

      const transcription = await openai.audio.transcriptions.create({
        file: fileToTranscribe,
        model: "whisper-1",
        language: "en",
        temperature: 0.0,
        prompt:
          "Natural spoken English shadowing practice with common contractions like I'm, you're, we'll, don't, can't, and clear standard punctuation.",
      });

      transcriptionText = transcription.text.trim();
    } catch (openaiError) {
      console.warn("Whisper transcription failed:", openaiError);
      return NextResponse.json(
        { error: "音声の文字起こしに失敗しました。マイクの設定を確認してもう一度録音をお試しください。" },
        { status: 502 }
      );
    }

    // Calculate diff between original and spoken text
    const diff = calculateDiff(originalText, transcriptionText);

    // Calculate WPM if duration is available (especially in passage mode)
    let wpmInfo: WPMInfo | undefined;
    if (typeof durationSeconds === "number" && durationSeconds > 0) {
      wpmInfo = calculateWPM(diff.spokenWordCount, durationSeconds);
    }

    // Generate AI Coach Review
    let coachFeedback: CoachFeedback;
    try {
      const openai = getOpenAIClient();
      const { systemPrompt, userPrompt } =
        mode === "passage"
          ? getPassageCoachReviewPrompt(originalText, transcriptionText, diff, wpmInfo)
          : getCoachReviewPrompt(originalText, transcriptionText, diff);

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error("Empty response from OpenAI for coach review");
      }

      const parsed = JSON.parse(content) as Partial<CoachFeedback>;
      coachFeedback = {
        overallComment: parsed.overallComment || "ナイスチャレンジです！継続して練習していきましょう。",
        pronunciationAdvice:
          parsed.pronunciationAdvice ||
          "模範音声をよく聴いて、単語の繋がりと抑揚を意識して発音してみましょう。",
        retryFocusPoint: parsed.retryFocusPoint || "音の繋がり（リンキング）を意識してもう一度リトライしてみましょう！",
        pacingAdvice: parsed.pacingAdvice,
      };
    } catch (coachErr) {
      console.warn("AI Coach review generation failed or skipped, using fallback rule:", coachErr);
      coachFeedback = generateFallbackCoachFeedback(diff, wpmInfo);
    }

    const response: TranscribeDiffResponse = {
      transcription: transcriptionText,
      diff,
      coachFeedback,
      wpmInfo,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Error in transcribe-diff route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
