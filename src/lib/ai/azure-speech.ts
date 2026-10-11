import {
  AzureAssessmentResult,
  AzureAssessmentWord,
  AzureEnvironmentMention,
} from "@/types";

export interface EvaluatePronunciationOptions {
  audioBuffer: Buffer;
  mimeType?: string;
  referenceText: string;
  averageVolume?: number;
}

/**
 * Detects appropriate Azure Speech REST Content-Type by inspecting magic bytes or MIME type.
 */
function resolveAzureContentType(buffer: Buffer, mimeType?: string): string {
  // 1. Inspect magic bytes for definitive format detection
  if (buffer.length >= 4) {
    // RIFF....WAVE
    if (
      buffer[0] === 0x52 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x46
    ) {
      return "audio/wav; codecs=audio/pcm";
    }
    // OggS
    if (
      buffer[0] === 0x4f &&
      buffer[1] === 0x67 &&
      buffer[2] === 0x67 &&
      buffer[3] === 0x53
    ) {
      return "audio/ogg; codecs=opus";
    }
    // EBML / WebM: 0x1A 0x45 0xDF 0xA3
    if (
      buffer[0] === 0x1a &&
      buffer[1] === 0x45 &&
      buffer[2] === 0xdf &&
      buffer[3] === 0xa3
    ) {
      return "audio/webm; codecs=opus";
    }
  }

  // 2. MIME type string fallback
  const mime = (mimeType || "").toLowerCase();
  if (mime.includes("wav")) return "audio/wav; codecs=audio/pcm";
  if (mime.includes("ogg") || mime.includes("opus")) return "audio/ogg; codecs=opus";
  if (mime.includes("webm")) return "audio/webm; codecs=opus";
  if (mime.includes("mp4") || mime.includes("m4a") || mime.includes("aac")) {
    return "audio/webm; codecs=opus";
  }

  return "audio/webm; codecs=opus";
}

/**
 * Generates a realistic mock Azure assessment result for tests and offline/preview environments.
 */
export function generateMockAzureAssessment(
  referenceText: string,
  options?: {
    recognitionStatus?: string;
    snr?: number;
    averageVolume?: number;
    forceLowAccuracy?: boolean;
    mockReason?: string;
  }
): AzureAssessmentResult {
  const words = referenceText
    .replace(/[^\w\s'-]/g, "")
    .split(/\s+/)
    .filter(Boolean);

  const status = options?.recognitionStatus || "Success";

  let environmentMention: AzureEnvironmentMention | undefined;
  if (status === "InitialSilenceTimeout") {
    environmentMention = {
      type: "warning",
      message:
        "音声が検出されませんでした。マイクの許可設定をご確認の上、もう一度お話しください。",
    };
  } else if (status === "BabbleTimeout") {
    environmentMention = {
      type: "warning",
      message:
        "周囲の話し声が多く検出されました。正確な判定のため、静かな環境で録音してください。",
    };
  } else if (options?.snr !== undefined && options.snr < 15.0) {
    environmentMention = {
      type: "warning",
      message:
        "周辺の雑音・ノイズが多いようです。静かな部屋に移動するか、イヤホンマイクをご使用ください。",
    };
  } else if (
    options?.averageVolume !== undefined &&
    options.averageVolume < 0.05
  ) {
    environmentMention = {
      type: "info",
      message:
        "マイクの声が少し遠いようです。マイクに口元を近づけるか、もう少し大きめの声でお話しください。",
    };
  }

  const assessmentWords: AzureAssessmentWord[] = words.map((w, idx) => {
    if (options?.forceLowAccuracy && idx === 1) {
      return {
        word: w,
        accuracyScore: 42,
        errorType: "Mispronunciation",
      };
    }
    return {
      word: w,
      accuracyScore: 92,
      errorType: "None",
    };
  });

  const overallScore = options?.forceLowAccuracy ? 68 : 88;
  const accuracyScore = options?.forceLowAccuracy ? 65 : 90;

  return {
    overallScore,
    accuracyScore,
    fluencyScore: 85,
    completenessScore: 95,
    prosodyScore: 82,
    words: assessmentWords,
    environmentMention,
    snr: options?.snr ?? 32.5,
    recognitionStatus: status,
    displayText: referenceText,
    isMock: true,
    mockReason: options?.mockReason,
  };
}

/**
 * Calls Azure AI Speech Pronunciation Assessment REST API.
 */
export async function evaluatePronunciationWithAzure(
  options: EvaluatePronunciationOptions
): Promise<AzureAssessmentResult> {
  const key = process.env.AZURE_SPEECH_KEY;
  const region = process.env.AZURE_SPEECH_REGION || "japaneast";

  // Use mock in test environment or if key is missing
  if (!key) {
    return generateMockAzureAssessment(options.referenceText, {
      averageVolume: options.averageVolume,
      mockReason:
        "サーバー（Vercel）の環境変数に AZURE_SPEECH_KEY が設定されていないため、テスト用の固定モック値（88%）が表示されています。Vercelのプロジェクト設定（Environment Variables）に AZURE_SPEECH_KEY と AZURE_SPEECH_REGION を設定してください。",
    });
  }

  if (process.env.NODE_ENV === "test") {
    return generateMockAzureAssessment(options.referenceText, {
      averageVolume: options.averageVolume,
      mockReason: "自動テスト実行中のためモック判定を使用しています。",
    });
  }

  const assessmentParams = {
    ReferenceText: options.referenceText,
    GradingSystem: "HundredMark",
    Granularity: "Phoneme",
    Dimension: "Comprehensive",
    EnableProsodyAssessment: "True",
    EnableMiscue: "True",
  };

  const base64Params = Buffer.from(
    JSON.stringify(assessmentParams)
  ).toString("base64");

  const contentType = resolveAzureContentType(
    options.audioBuffer,
    options.mimeType
  );

  const endpoint = `https://${region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US`;

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Ocp-Apim-Subscription-Key": key,
        "Pronunciation-Assessment": base64Params,
        "Content-Type": contentType,
      },
      body: new Uint8Array(options.audioBuffer),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.warn(`Azure Speech API returned ${res.status}:`, errText);
      // Return fallback assessment result on API error
      return generateMockAzureAssessment(options.referenceText, {
        recognitionStatus: "Success",
        averageVolume: options.averageVolume,
        mockReason: `Azure AI Speech APIエラー (HTTP ${res.status}): ${errText.slice(0, 150)}`,
      });
    }

    const data = await res.json();
    const status = data.RecognitionStatus || "Success";
    const snr = typeof data.SNR === "number" ? data.SNR : undefined;

    // Evaluate environment mentions based on status, SNR, and volume
    let environmentMention: AzureEnvironmentMention | undefined;

    if (status === "InitialSilenceTimeout") {
      environmentMention = {
        type: "warning",
        message:
          "音声が検出されませんでした。マイクの許可設定をご確認の上、もう一度お話しください。",
      };
    } else if (status === "BabbleTimeout") {
      environmentMention = {
        type: "warning",
        message:
          "周囲の話し声が多く検出されました。正確な判定のため、静かな環境で録音してください。",
      };
    } else if (status === "NoMatch") {
      environmentMention = {
        type: "warning",
        message:
          "発音を認識できませんでした。静かな場所で少し大きめの声でお話しください。",
      };
    } else if (snr !== undefined && snr < 15.0) {
      environmentMention = {
        type: "warning",
        message:
          "周辺の雑音・ノイズが多いようです。静かな部屋に移動するか、イヤホンマイクをご使用ください。",
      };
    } else if (
      options.averageVolume !== undefined &&
      options.averageVolume < 0.05
    ) {
      environmentMention = {
        type: "info",
        message:
          "マイクの声が少し遠いようです。マイクに口元を近づけるか、もう少し大きめの声でお話しください。",
      };
    }

    if (Array.isArray(data.NBest) && data.NBest.length > 0) {
      const best = data.NBest[0];

      const words: AzureAssessmentWord[] = Array.isArray(best.Words)
        ? best.Words.map(
            (w: {
              Word?: string;
              AccuracyScore?: number;
              ErrorType?: string;
              Phonemes?: Array<{ Phoneme?: string; AccuracyScore?: number }>;
            }) => {
              const errorType: AzureAssessmentWord["errorType"] =
                w.ErrorType === "Mispronunciation"
                  ? "Mispronunciation"
                  : w.ErrorType === "Omission"
                  ? "Omission"
                  : w.ErrorType === "Insertion"
                  ? "Insertion"
                  : "None";

              return {
                word: w.Word || "",
                accuracyScore: Math.round(w.AccuracyScore ?? 0),
                errorType,
                phonemes: Array.isArray(w.Phonemes)
                  ? w.Phonemes.map((p) => ({
                      phoneme: p.Phoneme || "",
                      accuracyScore: Math.round(p.AccuracyScore ?? 0),
                    }))
                  : undefined,
              };
            }
          )
        : [];

      return {
        overallScore: Math.round(best.PronScore ?? 0),
        accuracyScore: Math.round(best.AccuracyScore ?? 0),
        fluencyScore: Math.round(best.FluencyScore ?? 0),
        completenessScore: Math.round(best.CompletenessScore ?? 0),
        prosodyScore: Math.round(best.ProsodyScore ?? 0),
        words,
        environmentMention,
        snr,
        recognitionStatus: status,
        displayText: data.DisplayText || options.referenceText,
        isMock: false,
      };
    }

    // If NBest is empty (e.g. silence or no match)
    return {
      overallScore: 0,
      accuracyScore: 0,
      fluencyScore: 0,
      completenessScore: 0,
      prosodyScore: 0,
      words: [],
      environmentMention,
      snr,
      recognitionStatus: status,
      displayText: "",
      isMock: false,
    };
  } catch (err) {
    console.warn("Azure Speech Pronunciation Assessment error:", err);
    return generateMockAzureAssessment(options.referenceText, {
      averageVolume: options.averageVolume,
      mockReason: `Azure Speech例外エラー: ${err instanceof Error ? err.message : String(err)}`,
    });
  }
}
