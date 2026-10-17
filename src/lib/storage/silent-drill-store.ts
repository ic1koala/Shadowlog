import { getStoredSessions, getWeakWords, getPlanType } from "@/lib/storage/user-learning-store";
import { getChunkSlashIndices } from "@/lib/diff/chunk-splitter";
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
// 高品質スターターバンク（TOEIC頻出・ビジネス実用 5チャンク英文）
// -------------------------------------------------------------
const STARTER_DRILL_BANK = [
  {
    sentence: "Although the revenue increased sharply, we decided not to expand the team until the next fiscal quarter.",
    japanese: "収益は急増したものの、私たちは次の四半期までチームを拡大しないことを決定しました。",
    chunks: [
      "Although the revenue",
      "increased sharply,",
      "we decided",
      "not to expand the team",
      "until the next fiscal quarter.",
    ],
    weakFocus: "譲歩の接続詞（Although）から始まる条件と主節の語順",
  },
  {
    sentence: "When I arrived at the Tokyo headquarters, my supervisor told me that the meeting was postponed.",
    japanese: "東京本社に到着したとき、上司から会議が延期されたと告げられました。",
    chunks: [
      "When I arrived",
      "at the Tokyo headquarters,",
      "my supervisor",
      "told me that",
      "the meeting was postponed.",
    ],
    weakFocus: "時を表す従属節と報告動詞（told me that）の接続",
  },
  {
    sentence: "To improve customer retention, our marketing team has launched an innovative loyalty program this morning.",
    japanese: "顧客維持率を改善するため、マーケティングチームは今朝、革新的なポイント制度を開始しました。",
    chunks: [
      "To improve customer retention,",
      "our marketing team",
      "has launched",
      "an innovative loyalty program",
      "this morning.",
    ],
    weakFocus: "目的の不定詞句（To improve...）と現在完了形の動詞句",
  },
  {
    sentence: "If you have any questions about the contract, please contact our legal department before signing the document.",
    japanese: "契約に関してご質問がある場合は、書類に署名する前に法務部までご連絡ください。",
    chunks: [
      "If you have any questions",
      "about the contract,",
      "please contact",
      "our legal department",
      "before signing the document.",
    ],
    weakFocus: "条件節（If...）と丁寧な依頼命令文（please contact...）",
  },
  {
    sentence: "Because the server experienced an unexpected outage, our engineering team worked overnight to restore all user services.",
    japanese: "サーバーに予期せぬ障害が発生したため、エンジニアチームは全ユーザーサービスの復旧に向けて徹夜で対応しました。",
    chunks: [
      "Because the server experienced",
      "an unexpected outage,",
      "our engineering team",
      "worked overnight",
      "to restore all user services.",
    ],
    weakFocus: "原因・理由節（Because...）と結果の主節・目的不定詞",
  },
  {
    sentence: "In order to meet the tight deadline, everyone in the department agreed to prioritize the client presentation.",
    japanese: "厳しい締め切りに間に合わせるため、部署の全員がクライアント向けプレゼンテーションを優先することに同意しました。",
    chunks: [
      "In order to meet",
      "the tight deadline,",
      "everyone in the department",
      "agreed to prioritize",
      "the client presentation.",
    ],
    weakFocus: "目的句（In order to...）と動詞＋to不定詞（agreed to...）",
  },
  {
    sentence: "Despite facing severe supply chain disruptions, the manufacturing plant succeeded in delivering all shipments on schedule.",
    japanese: "深刻なサプライチェーンの混乱に直面したにもかかわらず、製造工場はすべての出荷を予定通りに完了することに成功しました。",
    chunks: [
      "Despite facing",
      "severe supply chain disruptions,",
      "the manufacturing plant",
      "succeeded in delivering",
      "all shipments on schedule.",
    ],
    weakFocus: "前置詞句（Despite + 動名詞）とイディオム（succeed in -ing）",
  },
  {
    sentence: "As soon as the board members approved the annual budget, we immediately finalized the new product roadmap.",
    japanese: "取締役会が年間予算を承認するとすぐに、私たちは直ちに新製品のロードマップを最終確定させました。",
    chunks: [
      "As soon as",
      "the board members approved",
      "the annual budget,",
      "we immediately finalized",
      "the new product roadmap.",
    ],
    weakFocus: "時を表す接続詞句（As soon as...）と副詞＋過去動詞",
  },
];

const DETERMINERS_AND_MODIFIERS = new Set([
  "the",
  "a",
  "an",
  "my",
  "your",
  "his",
  "her",
  "our",
  "their",
  "its",
  "this",
  "that",
  "these",
  "those",
  "every",
  "each",
  "no",
  "any",
  "some",
  "all",
  "both",
  "very",
  "quite",
  "rather",
  "too",
  "more",
  "most",
]);

const PREPOSITIONS_AND_CONNECTORS = new Set([
  "in",
  "on",
  "at",
  "for",
  "with",
  "from",
  "by",
  "about",
  "through",
  "during",
  "without",
  "between",
  "among",
  "against",
  "toward",
  "towards",
  "into",
  "upon",
  "within",
  "across",
  "beyond",
  "under",
  "over",
  "before",
  "after",
  "until",
  "since",
  "despite",
  "to",
  "of",
  "as",
  "that",
  "which",
  "who",
  "when",
  "while",
  "because",
  "although",
  "though",
  "if",
  "unless",
  "whether",
  "and",
  "but",
  "or",
  "so",
]);

const AUXILIARIES_AND_ADVERBS = new Set([
  "has",
  "have",
  "had",
  "will",
  "would",
  "can",
  "could",
  "should",
  "must",
  "may",
  "might",
  "is",
  "are",
  "was",
  "were",
  "do",
  "does",
  "did",
  "immediately",
  "successfully",
  "recently",
  "already",
  "quickly",
  "carefully",
  "sharply",
  "overnight",
  "always",
  "usually",
  "often",
]);

function cleanToken(word: string): string {
  return word.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, "").toLowerCase();
}

function getTargetChunkCount(wordCount: number): number {
  if (wordCount <= 4) return 2;
  if (wordCount <= 7) return 3;
  if (wordCount <= 11) return 4;
  if (wordCount <= 22) return 5;
  return 6;
}

/**
 * 長いチャンクを意味の切れ目（前置詞・不定詞・助動詞/動詞境界など）で2分割する最適インデックスを探す
 */
function findBestInternalSplitIndex(chunkWords: string[]): number {
  const len = chunkWords.length;
  if (len <= 2) return 1;

  let bestSplitAfter = Math.floor(len / 2) - 1;
  let bestScore = -Infinity;

  for (let i = 0; i < len - 1; i++) {
    const leftLen = i + 1;
    const rightLen = len - leftLen;
    const currClean = cleanToken(chunkWords[i]);
    const nextClean = cleanToken(chunkWords[i + 1]);
    const afterNextClean = i + 2 < len ? cleanToken(chunkWords[i + 2]) : "";

    // 中央に近いほど基本スコアを高くする
    let score = -Math.abs(leftLen - len / 2) * 4;

    // 4語以上のチャンクで1語だけの断片になる分割は避ける
    if (len >= 4 && (leftLen === 1 || rightLen === 1)) {
      score -= 22;
    }

    // 冠詞・所有格・前置詞・to不定詞の直後で名詞や動詞と引き離す分割は強くペナルティ
    if (
      DETERMINERS_AND_MODIFIERS.has(currClean) ||
      PREPOSITIONS_AND_CONNECTORS.has(currClean)
    ) {
      score -= 60;
    }

    // 複合接続詞（as soon as, in order to, even though, so that）の途中は切らない
    if (
      (currClean === "as" && nextClean === "soon") ||
      (currClean === "soon" && nextClean === "as") ||
      (currClean === "in" && nextClean === "order") ||
      (currClean === "order" && nextClean === "to") ||
      (currClean === "even" && (nextClean === "though" || nextClean === "if")) ||
      (currClean === "so" && nextClean === "that")
    ) {
      score -= 60;
    }

    // 否定不定詞 (not to + verb) の直前 (例: decided / not to expand)
    if (nextClean === "not" && afterNextClean === "to") {
      score += 28;
    }

    // 前置詞・接続詞・不定詞 to の直前 (例: agreed / to prioritize, questions / about the contract)
    if (PREPOSITIONS_AND_CONNECTORS.has(nextClean) && nextClean !== "of") {
      score += 24;
    }

    // 主語句と助動詞・副詞・述語動詞の境界 (例: our marketing team / has launched)
    if (AUXILIARIES_AND_ADVERBS.has(nextClean) && leftLen >= 2) {
      score += 20;
    }

    // 動詞 + 目的語（冠詞・所有格）の境界 (例: finalize / the quarterly budget, contact / our legal department)
    if (
      DETERMINERS_AND_MODIFIERS.has(nextClean) &&
      !DETERMINERS_AND_MODIFIERS.has(currClean) &&
      !PREPOSITIONS_AND_CONNECTORS.has(currClean)
    ) {
      score += 14;
    }

    if (score > bestScore) {
      bestScore = score;
      bestSplitAfter = i;
    }
  }

  return bestSplitAfter + 1;
}

/**
 * 英文を文長に応じて約5個（短文は3〜4個、標準〜2文構成は5〜6個）の自然な意味チャンクに分解
 * - 句読点（カンマ・ピリオド等）やスラッシュ区切り規則（getChunkSlashIndices）を最優先で尊重し、
 *   2文が1チャンクに結合されるのを防ぐ
 * - チャンク数が少ない場合は長いチャンクを意味の境界でさらに細分化する
 */
export function splitSentenceInto3To4Chunks(sentence: string): string[] {
  const clean = sentence.trim();
  if (!clean) return [];

  const words = clean.split(/\s+/);
  if (words.length <= 3) {
    if (words.length <= 1) return [clean];
    const mid = Math.ceil(words.length / 2);
    return [words.slice(0, mid).join(" "), words.slice(mid).join(" ")];
  }

  const targetCount = getTargetChunkCount(words.length);
  const maxCount = Math.max(targetCount, 6);

  // 1. まず文法・句読点ベースのスラッシュ位置で初期チャンクへ分割
  const slashIndices = getChunkSlashIndices(words);
  const wordChunks: string[][] = [];
  let startIdx = 0;

  for (let i = 0; i < words.length; i++) {
    if (slashIndices.has(i) && i < words.length - 1) {
      wordChunks.push(words.slice(startIdx, i + 1));
      startIdx = i + 1;
    }
  }
  if (startIdx < words.length) {
    wordChunks.push(words.slice(startIdx));
  }

  // 2. チャンク数が目標（約5個）より少ない場合、最も長いチャンクを文法境界で細分化
  while (wordChunks.length < targetCount) {
    let longestIdx = -1;
    let maxLen = 0;

    for (let i = 0; i < wordChunks.length; i++) {
      if (wordChunks[i].length > maxLen) {
        maxLen = wordChunks[i].length;
        longestIdx = i;
      }
    }

    // 分割対象の最大チャンクが2語以下ならこれ以上無理に割らない
    if (longestIdx === -1 || maxLen < 3) {
      break;
    }

    const targetChunk = wordChunks[longestIdx];
    const splitPos = findBestInternalSplitIndex(targetChunk);
    const leftPart = targetChunk.slice(0, splitPos);
    const rightPart = targetChunk.slice(splitPos);

    wordChunks.splice(longestIdx, 1, leftPart, rightPart);
  }

  // 3. 逆にチャンクが多すぎる（7個以上）場合は、文末（.?!）を跨がない短い隣接チャンク同士を結合
  while (wordChunks.length > maxCount) {
    let bestMergeIdx = 0;
    let bestMergeScore = Infinity;

    for (let i = 0; i < wordChunks.length - 1; i++) {
      const leftLastWord = wordChunks[i][wordChunks[i].length - 1] || "";
      const crossesSentenceEnd = /[.?!]["'”’)]*$/.test(leftLastWord);
      const crossesComma = /[,;:—]["'”’)]*$/.test(leftLastWord);
      const combinedLen = wordChunks[i].length + wordChunks[i + 1].length;

      // 文末ピリオド跨ぎは極力回避し、カンマ跨ぎも優先度を下げる
      const penalty = crossesSentenceEnd ? 1000 : crossesComma ? 20 : 0;
      const mergeScore = combinedLen + penalty;

      if (mergeScore < bestMergeScore) {
        bestMergeScore = mergeScore;
        bestMergeIdx = i;
      }
    }

    const merged = [...wordChunks[bestMergeIdx], ...wordChunks[bestMergeIdx + 1]];
    wordChunks.splice(bestMergeIdx, 2, merged);
  }

  return wordChunks.map((chunk) => chunk.join(" "));
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
  const weakWordSet = new Set(weakWords.map((w) => w.word.toLowerCase()));

  const usedSentences = new Set<string>();

  // 1. 過去のセッションから弱点文をピックアップ（弱点単語を含む文やスコアが低い文を優先）
  const weakSessions = sessions
    .filter((s) => s.accuracyScore < 90 || s.sentence.split(" ").length >= 8)
    .sort((a, b) => {
      const aHasWeak = a.sentence
        .toLowerCase()
        .split(/\W+/)
        .some((w) => weakWordSet.has(w));
      const bHasWeak = b.sentence
        .toLowerCase()
        .split(/\W+/)
        .some((w) => weakWordSet.has(w));
      if (aHasWeak !== bHasWeak) return aHasWeak ? -1 : 1;
      return a.accuracyScore - b.accuracyScore;
    });

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
