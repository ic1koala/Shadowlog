import { getStoredSessions, getWeakWords, getPlanType } from "@/lib/storage/user-learning-store";
import { getPersonaProfile, UserPersonaProfile } from "@/lib/storage/persona-store";
import { getChunkSlashIndices } from "@/lib/diff/chunk-splitter";
import { STARTER_SENTENCES } from "@/lib/practice/starter-sentences";
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
  sourceType: "weak_session" | "weak_word" | "starter" | "persona";
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

interface StoredPersonaDrillItem {
  sentence: string;
  japanese: string;
  weakFocus: string;
  createdAt: string;
}

const SILENT_DRILL_USAGE_KEY = "shadowlog_silent_drill_daily_usage";
const SILENT_DRILL_CLEARED_KEY = "shadowlog_silent_drill_cleared_sentences";
const SILENT_DRILL_PERSONA_STOCK_KEY = "shadowlog_silent_drill_persona_stock";
const UNLOCK_REQUIRED_SESSIONS = 3;
export const FREE_USER_DAILY_LIMIT = 10;

/**
 * 文字列正規化（クリア済み判定用）
 */
function normalizeSentenceKey(sentence: string): string {
  return sentence.trim().replace(/\s+/g, " ").toLowerCase();
}

/**
 * クリア済み（正解済み）の英文セットを取得
 */
export function getClearedSilentDrillSentences(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(SILENT_DRILL_CLEARED_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(
      parsed
        .filter((s): s is string => typeof s === "string")
        .map(normalizeSentenceKey)
    );
  } catch {
    return new Set();
  }
}

/**
 * クリアした問題の英文を記録（以後再表示しない）
 */
export function markSilentDrillSentenceCleared(sentence: string): void {
  if (typeof window === "undefined" || !sentence?.trim()) return;
  try {
    const current = getClearedSilentDrillSentences();
    current.add(normalizeSentenceKey(sentence));
    // 最大1000件まで保持
    const list = Array.from(current).slice(-1000);
    localStorage.setItem(SILENT_DRILL_CLEARED_KEY, JSON.stringify(list));
  } catch {
    // ignore storage errors
  }
}

/**
 * ペルソナ生成ストックの取得
 */
function getPersonaDrillStock(): StoredPersonaDrillItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SILENT_DRILL_PERSONA_STOCK_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is StoredPersonaDrillItem =>
        typeof item === "object" &&
        item !== null &&
        typeof item.sentence === "string" &&
        typeof item.japanese === "string"
    );
  } catch {
    return [];
  }
}

/**
 * ペルソナ生成ストックへの保存
 */
export function savePersonaDrillStock(items: StoredPersonaDrillItem[]): void {
  if (typeof window === "undefined") return;
  try {
    const existing = getPersonaDrillStock();
    const seen = new Set(existing.map((e) => normalizeSentenceKey(e.sentence)));
    const merged = [...existing];
    for (const item of items) {
      const key = normalizeSentenceKey(item.sentence);
      if (key && !seen.has(key)) {
        seen.add(key);
        merged.push(item);
      }
    }
    localStorage.setItem(
      SILENT_DRILL_PERSONA_STOCK_KEY,
      JSON.stringify(merged.slice(-100))
    );
  } catch {
    // ignore
  }
}

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
 * Silent Drill 1問クリア時のカウントとクリア済み文を記録
 */
export function recordSilentDrillCompletion(clearedSentence?: string): SilentDrillQuota {
  if (typeof window === "undefined") {
    return getSilentDrillDailyQuota();
  }

  if (clearedSentence) {
    markSilentDrillSentenceCleared(clearedSentence);
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
 * チャンク配列からシャッフル済み選択肢を構築（必ず正解順と異なる並びにする）
 */
function buildShuffledChunks(chunks: string[], prefix: string): SilentDrillChunk[] {
  const indexedChunks: SilentDrillChunk[] = chunks.map((text, idx) => ({
    id: `${prefix}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
    text,
    correctIndex: idx,
  }));

  let shuffled = shuffleArray(indexedChunks);
  if (shuffled.every((c, i) => c.correctIndex === i) && shuffled.length > 1) {
    shuffled = [shuffled[1], shuffled[0], ...shuffled.slice(2)];
  }
  return shuffled;
}

/**
 * ペルソナ設定に基づき動的にバリエーション豊かな英文候補を生成（オフライン/ストック枯渇時対応）
 */
function synthesizePersonaDrillCandidates(
  persona: UserPersonaProfile | null,
  clearedSet: Set<string>,
  usedSet: Set<string>
): StoredPersonaDrillItem[] {
  const roleLabel = persona?.jobRole?.trim() || "ビジネスプロフェッショナル";
  const fieldLabel = persona?.industryField?.trim() || "グローバル事業";
  const scenarioLabel = persona?.targetScenario?.trim() || "プロジェクト推進";
  const focusLabel = `ペルソナ特化: ${roleLabel} × ${fieldLabel}（${scenarioLabel}）`;

  const templates: { sentence: string; japanese: string }[] = [
    {
      sentence: "Before we finalize the quarterly roadmap, let us align with all stakeholders to confirm our delivery schedule.",
      japanese: `【${roleLabel}】四半期ロードマップを確定する前に、全関係者と連携して納品スケジュールを確認しましょう。`,
    },
    {
      sentence: "In order to improve operational efficiency across the team, we decided to automate our weekly reporting process.",
      japanese: `【${fieldLabel}】チーム全体の業務効率を高めるため、私たちは週次レポート作成プロセスの自動化を決定しました。`,
    },
    {
      sentence: "Although the initial requirements changed yesterday, our team adjusted the implementation plan to meet the client deadline.",
      japanese: `【${scenarioLabel}】昨日当初の要件が変更されたものの、私たちのチームはクライアントの納期に間に合うよう実装計画を調整しました。`,
    },
    {
      sentence: "Once the quality assurance review is completed, we will share the updated proposal with our international partners.",
      japanese: `【${roleLabel}】品質保証レビューが完了次第、最新の提案書を海外パートナーへ共有いたします。`,
    },
    {
      sentence: "To address the feedback from our key customers, we should prioritize system reliability during the next sprint.",
      japanese: `【${fieldLabel}】主要顧客からのフィードバックに対応するため、次回のスプリントではシステムの信頼性を最優先すべきです。`,
    },
    {
      sentence: "If any unexpected technical issues arise during deployment, please notify the project lead immediately via chat.",
      japanese: `【${scenarioLabel}】デプロイ中に予期せぬ技術的課題が発生した場合は、直ちにチャットでプロジェクトリーダーへ連絡してください。`,
    },
    {
      sentence: "By analyzing the latest user engagement metrics, we identified three major opportunities to reduce customer churn.",
      japanese: `【${roleLabel}】最新のユーザーエンゲージメント指標を分析した結果、解約率を下げる3つの大きな機会を特定しました。`,
    },
    {
      sentence: "While our current budget remains tight this quarter, investing in cloud security will protect our long-term growth.",
      japanese: `【${fieldLabel}】今四半期の予算は依然として厳しいものの、クラウドセキュリティへの投資は長期的な成長を守ることになります。`,
    },
    {
      sentence: "After reviewing the contract terms with our legal counsel, we proposed a flexible pricing structure for the client.",
      japanese: `【${scenarioLabel}】法務担当と契約条件を精査した後、私たちはクライアント向けに柔軟な価格体系を提案しました。`,
    },
    {
      sentence: "Since cross-functional collaboration is essential for this launch, let us hold a brief sync meeting every morning.",
      japanese: `【${roleLabel}】今回のローンチには部門横断の連携が不可欠なため、毎朝短い進捗確認ミーティングを実施しましょう。`,
    },
    {
      sentence: "Even though the market conditions are shifting rapidly, our core strategy continues to deliver steady revenue growth.",
      japanese: `【${fieldLabel}】市場環境が急速に変化しているにもかかわらず、当社の中核戦略は着実な収益成長をもたらし続けています。`,
    },
    {
      sentence: "Please review the attached specification document carefully so that we can resolve all open questions before Friday.",
      japanese: `【${scenarioLabel}】金曜日までにすべての未解決事項を解消できるよう、添付の仕様書を事前にご確認ください。`,
    },
  ];

  const randomized = shuffleArray(templates);
  const results: StoredPersonaDrillItem[] = [];

  for (const tpl of randomized) {
    const key = normalizeSentenceKey(tpl.sentence);
    if (clearedSet.has(key) || usedSet.has(key)) continue;
    results.push({
      sentence: tpl.sentence,
      japanese: tpl.japanese,
      weakFocus: focusLabel,
      createdAt: new Date().toISOString(),
    });
  }

  return results;
}

/**
 * ストックがなくなった際にペルソナ設定の内容で新しいSilent Drill問題を非同期生成（OpenAI API + フォールバック）
 */
export async function generatePersonaSilentDrillQuestions(
  count: number = 5
): Promise<SilentDrillQuestion[]> {
  const persona = getPersonaProfile();
  const clearedSet = getClearedSilentDrillSentences();
  const weakWords = getWeakWords()?.words.map((w) => w.word).slice(0, 5) || [];
  const defaultIndustry =
    typeof window !== "undefined"
      ? localStorage.getItem("shadowlog_default_industry") || "business"
      : "business";
  const defaultLevel =
    typeof window !== "undefined"
      ? localStorage.getItem("shadowlog_default_level") || "intermediate"
      : "intermediate";

  const effectivePersona: UserPersonaProfile =
    persona &&
    (persona.jobRole?.trim() ||
      persona.industryField?.trim() ||
      persona.targetScenario?.trim() ||
      persona.interestedTopics?.trim())
      ? { ...persona, enabled: true }
      : {
          enabled: true,
          jobRole: "ビジネスパーソン",
          industryField: defaultIndustry,
          targetScenario: "実務ミーティング・進捗報告",
          customTone: "polite",
        };

  const roleLabel = effectivePersona.jobRole || "ビジネス";
  const fieldLabel = effectivePersona.industryField || defaultIndustry;
  const focusLabel = `✨ ペルソナ特化生成: ${roleLabel} × ${fieldLabel}`;

  const newItems: StoredPersonaDrillItem[] = [];
  const usedKeys = new Set<string>();

  // API経由で最大2問リアルタイム生成を試行（skipAudio: true で高速生成）
  if (typeof window !== "undefined" && typeof fetch === "function") {
    const apiCalls = Math.min(count, 2);
    for (let i = 0; i < apiCalls; i++) {
      try {
        const res = await fetch("/api/generate-sentence", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            industry: defaultIndustry,
            level: defaultLevel,
            mode: "sentence",
            weakWords,
            persona: effectivePersona,
            skipAudio: true,
          }),
        });
        if (res.ok) {
          const data = (await res.json()) as { english?: string; japanese?: string };
          if (data.english && data.japanese) {
            const key = normalizeSentenceKey(data.english);
            if (!clearedSet.has(key) && !usedKeys.has(key)) {
              usedKeys.add(key);
              newItems.push({
                sentence: data.english.trim(),
                japanese: data.japanese.trim(),
                weakFocus: focusLabel,
                createdAt: new Date().toISOString(),
              });
            }
          }
        }
      } catch {
        // API失敗時は下のペルソナ合成テンプレートで補充
      }
    }
  }

  // 残りの枠をペルソナ合成候補からランダム補充
  if (newItems.length < count) {
    const synthesized = synthesizePersonaDrillCandidates(
      effectivePersona,
      clearedSet,
      usedKeys
    );
    for (const item of synthesized) {
      if (newItems.length >= count) break;
      usedKeys.add(normalizeSentenceKey(item.sentence));
      newItems.push(item);
    }
  }

  if (newItems.length > 0) {
    savePersonaDrillStock(newItems);
  }

  return newItems.map((item, idx) => {
    const chunks = splitSentenceInto3To4Chunks(item.sentence);
    return {
      id: `persona-q-${Date.now()}-${idx}`,
      originalSentence: item.sentence,
      japanese: item.japanese,
      sourceType: "persona" as const,
      chunks,
      shuffledChunks: buildShuffledChunks(chunks, `persona-chunk-${idx}`),
      weakFocus: item.weakFocus,
    };
  });
}

/**
 * 今解くべき Silent Drill の問題セットをランダム生成
 * - クリア済み（正解済み）の文は一切再表示しない
 * - 毎回順番と内容がランダムになるようシャッフル
 * - 既存ストックがなくなった場合はペルソナ設定の内容から自動生成して出題
 */
export function generateSilentDrillQuestions(limit: number = 10): SilentDrillQuestion[] {
  const questions: SilentDrillQuestion[] = [];
  const clearedSet = getClearedSilentDrillSentences();
  const usedSentences = new Set<string>();

  const sessions: StoredSession[] =
    typeof window !== "undefined" ? getStoredSessions()?.sessions || [] : [];
  const weakWords: WeakWord[] =
    typeof window !== "undefined" ? getWeakWords()?.words || [] : [];
  const weakWordSet = new Set(weakWords.map((w) => w.word.toLowerCase()));

  // 1. 過去のセッションから未クリアの弱点文をランダム抽出
  const candidateSessions = shuffleArray(
    sessions.filter(
      (s) =>
        !clearedSet.has(normalizeSentenceKey(s.sentence)) &&
        (s.accuracyScore < 92 || s.sentence.split(/\s+/).length >= 7)
    )
  ).sort((a, b) => {
    const aHasWeak = a.sentence
      .toLowerCase()
      .split(/\W+/)
      .some((w) => weakWordSet.has(w));
    const bHasWeak = b.sentence
      .toLowerCase()
      .split(/\W+/)
      .some((w) => weakWordSet.has(w));
    if (aHasWeak !== bHasWeak) return aHasWeak ? -1 : 1;
    return 0; // ランダム順序を維持
  });

  for (const session of candidateSessions) {
    if (questions.length >= limit) break;
    const normKey = normalizeSentenceKey(session.sentence);
    if (!normKey || usedSentences.has(normKey)) continue;

    const chunks = splitSentenceInto3To4Chunks(session.sentence);
    if (chunks.length < 2) continue;

    questions.push({
      id: `session-q-${session.id}-${Math.random().toString(36).substring(2, 6)}`,
      originalSentence: session.sentence,
      japanese: session.japanese || "あなたの過去のシャドーイング練習文",
      sourceType: "weak_session",
      chunks,
      shuffledChunks: buildShuffledChunks(chunks, "chunk"),
      weakFocus: `前回のシャドーイング正確度: ${Math.round(session.accuracyScore)}%`,
    });
    usedSentences.add(normKey);
  }

  // 2. 保存済みのペルソナ生成ストック（未クリア分）をランダム抽出
  const personaStock = shuffleArray(getPersonaDrillStock());
  for (const item of personaStock) {
    if (questions.length >= limit) break;
    const normKey = normalizeSentenceKey(item.sentence);
    if (!normKey || clearedSet.has(normKey) || usedSentences.has(normKey)) continue;

    const chunks = splitSentenceInto3To4Chunks(item.sentence);
    if (chunks.length < 2) continue;

    questions.push({
      id: `persona-stock-${Math.random().toString(36).substring(2, 8)}`,
      originalSentence: item.sentence,
      japanese: item.japanese,
      sourceType: "persona",
      chunks,
      shuffledChunks: buildShuffledChunks(chunks, "persona-stock"),
      weakFocus: item.weakFocus,
    });
    usedSentences.add(normKey);
  }

  // 3. スターターバンク（STARTER_DRILL_BANK + STARTER_SENTENCES 全44問）から未クリア分をランダム抽出
  const combinedStarters = shuffleArray([
    ...STARTER_DRILL_BANK.map((s) => ({
      sentence: s.sentence,
      japanese: s.japanese,
      chunks: s.chunks,
      weakFocus: s.weakFocus,
    })),
    ...STARTER_SENTENCES.map((s) => ({
      sentence: s.english,
      japanese: s.japanese,
      chunks: splitSentenceInto3To4Chunks(s.english),
      weakFocus: `実践チャンク特訓（${s.industry.toUpperCase()} / ${s.level}）`,
    })),
  ]);

  for (const starter of combinedStarters) {
    if (questions.length >= limit) break;
    const normKey = normalizeSentenceKey(starter.sentence);
    if (!normKey || clearedSet.has(normKey) || usedSentences.has(normKey)) continue;
    if (starter.chunks.length < 2) continue;

    questions.push({
      id: `starter-q-${Math.random().toString(36).substring(2, 8)}`,
      originalSentence: starter.sentence,
      japanese: starter.japanese,
      sourceType: "starter",
      chunks: starter.chunks,
      shuffledChunks: buildShuffledChunks(starter.chunks, "starter-chunk"),
      weakFocus: starter.weakFocus,
    });
    usedSentences.add(normKey);
  }

  // 4. すべての既存ストックをクリアし終えた場合、ペルソナ設定の内容から即座に新規生成して補充
  if (questions.length < limit) {
    const persona = typeof window !== "undefined" ? getPersonaProfile() : null;
    const fallbackPersonaItems = synthesizePersonaDrillCandidates(
      persona,
      clearedSet,
      usedSentences
    );

    for (const item of fallbackPersonaItems) {
      if (questions.length >= limit) break;
      const normKey = normalizeSentenceKey(item.sentence);
      if (!normKey || usedSentences.has(normKey)) continue;

      const chunks = splitSentenceInto3To4Chunks(item.sentence);
      if (chunks.length < 2) continue;

      questions.push({
        id: `persona-gen-${Math.random().toString(36).substring(2, 8)}`,
        originalSentence: item.sentence,
        japanese: item.japanese,
        sourceType: "persona",
        chunks,
        shuffledChunks: buildShuffledChunks(chunks, "persona-gen"),
        weakFocus: item.weakFocus,
      });
      usedSentences.add(normKey);
    }
  }

  // 出題順序自体も毎回シャッフルして返す
  return shuffleArray(questions);
}
