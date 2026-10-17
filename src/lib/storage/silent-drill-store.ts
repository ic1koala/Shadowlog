import { getStoredSessions, getWeakWords, getPlanType } from "@/lib/storage/user-learning-store";
import { UserPlanType, StoredSession, WeakWord } from "@/types";

export interface SilentDrillChunk {
  id: string;
  text: string;
  correctIndex: number;
}

export interface SilentDrillQuestion {
  id: string;
  originalSentence: string;
  japanese: string;
  sourceType: "weak_session" | "weak_word" | "starter";
  chunks: string[];
  shuffledChunks: SilentDrillChunk[];
  weakFocus?: string;
  difficulty?: "standard" | "challenge";
}

export interface SilentDrillUnlockProgress {
  currentCount: number;
  targetCount: number;
  isUnlocked: boolean;
  remainingCount: number;
}

export interface SilentDrillQuota {
  todayCompletedCount: number;
  maxDailyCount: number;
  remainingCount: number;
  isUnlimited: boolean;
  canPlay: boolean;
}

const SILENT_DRILL_USAGE_KEY = "shadowlog_silent_drill_daily_usage";
const UNLOCK_REQUIRED_SESSIONS = 3;
export const FREE_USER_DAILY_LIMIT = 10;

/**
 * 累計シャドーイングセッション数に基づきアンロック状況を判定
 */
export function getSilentDrillUnlockProgress(): SilentDrillUnlockProgress {
  if (typeof window === "undefined") {
    return {
      currentCount: 0,
      targetCount: UNLOCK_REQUIRED_SESSIONS,
      isUnlocked: false,
      remainingCount: UNLOCK_REQUIRED_SESSIONS,
    };
  }

  const sessionData = getStoredSessions();
  const currentCount = sessionData?.totalCount || 0;
  const isUnlocked = currentCount >= UNLOCK_REQUIRED_SESSIONS;
  const remainingCount = Math.max(0, UNLOCK_REQUIRED_SESSIONS - currentCount);

  return {
    currentCount,
    targetCount: UNLOCK_REQUIRED_SESSIONS,
    isUnlocked,
    remainingCount,
  };
}

/**
 * 今日の日付キー (YYYY-MM-DD)
 */
function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * 今日のSilent Drill実行状況を取得
 */
export function getSilentDrillDailyQuota(plan?: UserPlanType): SilentDrillQuota {
  const currentPlan = plan || getPlanType();
  const isUnlimited = currentPlan === "base" || currentPlan === "pro";

  if (typeof window === "undefined") {
    return {
      todayCompletedCount: 0,
      maxDailyCount: isUnlimited ? Infinity : FREE_USER_DAILY_LIMIT,
      remainingCount: isUnlimited ? Infinity : FREE_USER_DAILY_LIMIT,
      isUnlimited,
      canPlay: true,
    };
  }

  try {
    const raw = localStorage.getItem(SILENT_DRILL_USAGE_KEY);
    const today = getTodayDateString();
    let count = 0;

    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.date === today) {
        count = Number(parsed.count) || 0;
      }
    }

    const remaining = isUnlimited
      ? Infinity
      : Math.max(0, FREE_USER_DAILY_LIMIT - count);

    return {
      todayCompletedCount: count,
      maxDailyCount: isUnlimited ? Infinity : FREE_USER_DAILY_LIMIT,
      remainingCount: remaining,
      isUnlimited,
      canPlay: isUnlimited || count < FREE_USER_DAILY_LIMIT,
    };
  } catch {
    return {
      todayCompletedCount: 0,
      maxDailyCount: isUnlimited ? Infinity : FREE_USER_DAILY_LIMIT,
      remainingCount: isUnlimited ? Infinity : FREE_USER_DAILY_LIMIT,
      isUnlimited,
      canPlay: true,
    };
  }
}

/**
 * Silent Drill 1問クリア時のカウントを記録
 */
export function recordSilentDrillCompletion(): SilentDrillQuota {
  if (typeof window === "undefined") {
    return getSilentDrillDailyQuota();
  }

  try {
    const today = getTodayDateString();
    const raw = localStorage.getItem(SILENT_DRILL_USAGE_KEY);
    let count = 0;

    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.date === today) {
        count = Number(parsed.count) || 0;
      }
    }

    count += 1;
    localStorage.setItem(
      SILENT_DRILL_USAGE_KEY,
      JSON.stringify({ date: today, count })
    );

    return getSilentDrillDailyQuota();
  } catch {
    return getSilentDrillDailyQuota();
  }
}

// -------------------------------------------------------------
// 高品質スターターバンク（TOEIC頻出・ビジネス実用3〜4チャンク英文）
// -------------------------------------------------------------
const STARTER_DRILL_BANK = [
  {
    sentence: "Although the revenue increased sharply, we decided not to expand the team until the next fiscal quarter.",
    japanese: "収益は急増したものの、私たちは次の四半期までチームを拡大しないことを決定しました。",
    chunks: [
      "Although the revenue increased sharply,",
      "we decided not to expand the team",
      "until the next fiscal quarter.",
    ],
    weakFocus: "譲歩の接続詞（Although）から始まる条件と主節の語順",
  },
  {
    sentence: "When I arrived at the Tokyo headquarters, my supervisor told me that the meeting was postponed.",
    japanese: "東京本社に到着したとき、上司から会議が延期されたと告げられました。",
    chunks: [
      "When I arrived at the Tokyo headquarters,",
      "my supervisor told me that",
      "the meeting was postponed.",
    ],
    weakFocus: "時を表す従属節と報告動詞（told me that）の接続",
  },
  {
    sentence: "To improve customer retention, our marketing team has launched an innovative loyalty program this morning.",
    japanese: "顧客維持率を改善するため、マーケティングチームは今朝、革新的なポイント制度を開始しました。",
    chunks: [
      "To improve customer retention,",
      "our marketing team has launched",
      "an innovative loyalty program this morning.",
    ],
    weakFocus: "目的の不定詞句（To improve...）と現在完了形の動詞句",
  },
  {
    sentence: "If you have any questions about the contract, please contact our legal department before signing the document.",
    japanese: "契約に関してご質問がある場合は、書類に署名する前に法務部までご連絡ください。",
    chunks: [
      "If you have any questions about the contract,",
      "please contact our legal department",
      "before signing the document.",
    ],
    weakFocus: "条件節（If...）と丁寧な依頼命令文（please contact...）",
  },
  {
    sentence: "Because the server experienced an unexpected outage, our engineering team worked overnight to restore all user services.",
    japanese: "サーバーに予期せぬ障害が発生したため、エンジニアチームは全ユーザーサービスの復旧に向けて徹夜で対応しました。",
    chunks: [
      "Because the server experienced an unexpected outage,",
      "our engineering team worked overnight",
      "to restore all user services.",
    ],
    weakFocus: "原因・理由節（Because...）と結果の主節・目的不定詞",
  },
  {
    sentence: "In order to meet the tight deadline, everyone in the department agreed to prioritize the client presentation.",
    japanese: "厳しい締め切りに間に合わせるため、部署の全員がクライアント向けプレゼンテーションを優先することに同意しました。",
    chunks: [
      "In order to meet the tight deadline,",
      "everyone in the department agreed",
      "to prioritize the client presentation.",
    ],
    weakFocus: "目的句（In order to...）と動詞＋to不定詞（agreed to...）",
  },
  {
    sentence: "Despite facing severe supply chain disruptions, the manufacturing plant succeeded in delivering all shipments on schedule.",
    japanese: "深刻なサプライチェーンの混乱に直面したにもかかわらず、製造工場はすべての出荷を予定通りに完了することに成功しました。",
    chunks: [
      "Despite facing severe supply chain disruptions,",
      "the manufacturing plant succeeded in",
      "delivering all shipments on schedule.",
    ],
    weakFocus: "前置詞句（Despite + 動名詞）とイディオム（succeed in -ing）",
  },
  {
    sentence: "As soon as the board members approved the annual budget, we immediately finalized the new product roadmap.",
    japanese: "取締役会が年間予算を承認するとすぐに、私たちは直ちに新製品のロードマップを最終確定させました。",
    chunks: [
      "As soon as the board members approved the annual budget,",
      "we immediately finalized",
      "the new product roadmap.",
    ],
    weakFocus: "時を表す接続詞句（As soon as...）と副詞＋過去動詞",
  },
];

/**
 * 英文を3〜4個の自然なチャンクにルールベースで分解（セッションデータ用フォールバック）
 */
export function splitSentenceInto3To4Chunks(sentence: string): string[] {
  const clean = sentence.trim();

  // カンマがある場合、カンマでまず分割
  if (clean.includes(",")) {
    const parts = clean.split(/(?<=,)\s+/);
    if (parts.length >= 2 && parts.length <= 4) {
      return parts;
    }
  }

  // 単語数に基づく自然な均等チャンク分け（15〜25語の標準的な英文を3〜4分割）
  const words = clean.split(/\s+/);
  if (words.length <= 6) {
    // 短すぎる文は2〜3分割
    const mid = Math.ceil(words.length / 2);
    return [words.slice(0, mid).join(" "), words.slice(mid).join(" ")];
  }

  const chunkCount = words.length >= 14 ? 3 : 3;
  const size = Math.ceil(words.length / chunkCount);
  const result: string[] = [];

  for (let i = 0; i < words.length; i += size) {
    result.push(words.slice(i, i + size).join(" "));
  }

  return result.slice(0, 4);
}

/**
 * 配列をシャッフル（Fisher-Yates）
 */
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * 今解くべき Silent Drill の問題セットを生成
 * - 過去の自分のセッション（特に正答率80%未満またはミストークのある文）を優先
 * - 弱点単語が含まれる文を優先
 * - 足りない分は高品質スターターバンクから補充
 */
export function generateSilentDrillQuestions(limit: number = 10): SilentDrillQuestion[] {
  const questions: SilentDrillQuestion[] = [];
  const sessions: StoredSession[] =
    typeof window !== "undefined" ? getStoredSessions()?.sessions || [] : [];
  const weakWords: WeakWord[] =
    typeof window !== "undefined" ? getWeakWords()?.words || [] : [];

  const usedSentences = new Set<string>();

  // 1. 過去のセッションから弱点文をピックアップ
  const weakSessions = sessions
    .filter((s) => s.accuracyScore < 90 || s.sentence.split(" ").length >= 10)
    .sort((a, b) => a.accuracyScore - b.accuracyScore); // スコアが低い順

  for (const session of weakSessions) {
    if (questions.length >= limit) break;
    if (usedSentences.has(session.sentence)) continue;

    const chunks = splitSentenceInto3To4Chunks(session.sentence);
    if (chunks.length < 2) continue;

    const indexedChunks: SilentDrillChunk[] = chunks.map((text, idx) => ({
      id: `chunk-${idx}-${Math.random().toString(36).substring(2, 7)}`,
      text,
      correctIndex: idx,
    }));

    // 必ず正解の順番と異なるようにシャッフル
    let shuffled = shuffleArray(indexedChunks);
    if (shuffled.every((c, i) => c.correctIndex === i) && shuffled.length > 1) {
      shuffled = [shuffled[1], shuffled[0], ...shuffled.slice(2)];
    }

    questions.push({
      id: `session-q-${session.id}`,
      originalSentence: session.sentence,
      japanese: session.japanese || "あなたの過去のシャドーイング練習文",
      sourceType: "weak_session",
      chunks,
      shuffledChunks: shuffled,
      weakFocus: `前回のシャドーイング正確度: ${Math.round(session.accuracyScore)}%`,
    });
    usedSentences.add(session.sentence);
  }

  // 2. スターターバンクから補充
  for (const starter of STARTER_DRILL_BANK) {
    if (questions.length >= limit) break;
    if (usedSentences.has(starter.sentence)) continue;

    const indexedChunks: SilentDrillChunk[] = starter.chunks.map((text, idx) => ({
      id: `starter-chunk-${idx}-${Math.random().toString(36).substring(2, 7)}`,
      text,
      correctIndex: idx,
    }));

    let shuffled = shuffleArray(indexedChunks);
    if (shuffled.every((c, i) => c.correctIndex === i) && shuffled.length > 1) {
      shuffled = [shuffled[1], shuffled[0], ...shuffled.slice(2)];
    }

    questions.push({
      id: `starter-q-${questions.length + 1}`,
      originalSentence: starter.sentence,
      japanese: starter.japanese,
      sourceType: "starter",
      chunks: starter.chunks,
      shuffledChunks: shuffled,
      weakFocus: starter.weakFocus,
    });
    usedSentences.add(starter.sentence);
  }

  return questions;
}
