export type FeedbackCategoryType =
  | "bug"
  | "audio_mic"
  | "feature_request"
  | "question"
  | "other";

export interface FeedbackHistoryItem {
  id: string;
  ticketId?: string;
  category: FeedbackCategoryType;
  categoryLabel: string;
  email: string;
  content: string;
  hasScreenshot: boolean;
  createdAt: string;
}

const STORAGE_KEY = "shadowlog_feedback_history";
const MAX_HISTORY_COUNT = 30;

/**
 * 送信履歴一覧を取得
 */
export function getFeedbackHistory(): FeedbackHistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn("Failed to load feedback history from localStorage:", err);
    return [];
  }
}

/**
 * 新しい送信履歴を先頭に追加（最大30件保存）
 */
export function addFeedbackHistoryItem(
  item: Omit<FeedbackHistoryItem, "id" | "createdAt"> & {
    id?: string;
    createdAt?: string;
  }
): FeedbackHistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const current = getFeedbackHistory();
    const newItem: FeedbackHistoryItem = {
      id: item.id || `fb_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      ticketId: item.ticketId,
      category: item.category,
      categoryLabel: item.categoryLabel,
      email: item.email,
      content: item.content,
      hasScreenshot: item.hasScreenshot,
      createdAt: item.createdAt || new Date().toISOString(),
    };

    const updated = [newItem, ...current].slice(0, MAX_HISTORY_COUNT);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    // カスタムイベントを発火して同一画面内の別コンポーネントにも即時反映
    window.dispatchEvent(new Event("shadowlog:feedback-history-update"));
    return updated;
  } catch (err) {
    console.warn("Failed to save feedback history to localStorage:", err);
    return [];
  }
}

/**
 * 特定のIDの送信履歴を削除
 */
export function deleteFeedbackHistoryItem(id: string): FeedbackHistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const current = getFeedbackHistory();
    const updated = current.filter((item) => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event("shadowlog:feedback-history-update"));
    return updated;
  } catch (err) {
    console.warn("Failed to delete feedback history item from localStorage:", err);
    return [];
  }
}

/**
 * すべての送信履歴を削除
 */
export function clearFeedbackHistory(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event("shadowlog:feedback-history-update"));
  } catch (err) {
    console.warn("Failed to clear feedback history:", err);
  }
}
