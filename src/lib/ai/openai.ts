import OpenAI from "openai";

let openaiClientInstance: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === "your_openai_api_key_here" || apiKey.trim() === "") {
    throw new Error(
      "OPENAI_API_KEY is not configured. Please set a valid API key in your .env.local file."
    );
  }

  if (!openaiClientInstance) {
    openaiClientInstance = new OpenAI({
      apiKey,
    });
  }

  return openaiClientInstance;
}

/**
 * Fallback predefined sentences for development/testing when OPENAI_API_KEY is not provided.
 */
export const FALLBACK_SENTENCES = [
  {
    id: "fallback-tech-1",
    english: "We need to optimize the database query to decrease response latency.",
    japanese: "応答遅延を短縮するためにデータベースのクエリを最適化する必要があります。",
    industry: "tech" as const,
    level: "intermediate" as const,
  },
  {
    id: "fallback-business-1",
    english: "Our cross-functional team delivered the project ahead of schedule.",
    japanese: "私たちの部門横断チームは予定より早くプロジェクトを完了しました。",
    industry: "business" as const,
    level: "intermediate" as const,
  },
  {
    id: "fallback-tech-2",
    english: "The microservices architecture ensures high availability and fault tolerance.",
    japanese: "マイクロサービスアーキテクチャにより高可用性と耐障害性が保証されます。",
    industry: "tech" as const,
    level: "advanced" as const,
  },
  {
    id: "fallback-daily-1",
    english: "Let's review the agenda before our afternoon conference call.",
    japanese: "午後の電話会議の前に議題を確認しましょう。",
    industry: "daily" as const,
    level: "beginner" as const,
  },
];
