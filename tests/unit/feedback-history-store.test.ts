import { describe, it, expect, beforeEach } from "vitest";
import {
  getFeedbackHistory,
  addFeedbackHistoryItem,
  deleteFeedbackHistoryItem,
  clearFeedbackHistory,
} from "@/lib/feedback/feedback-history-store";

describe("feedback-history-store", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns empty array initially", () => {
    expect(getFeedbackHistory()).toEqual([]);
  });

  it("adds a new item and retrieves it", () => {
    addFeedbackHistoryItem({
      category: "bug",
      categoryLabel: "不具合・エラー",
      email: "test@example.com",
      content: "マイクが接続されません",
      hasScreenshot: true,
      ticketId: "ticket-123",
    });

    const history = getFeedbackHistory();
    expect(history).toHaveLength(1);
    expect(history[0].category).toBe("bug");
    expect(history[0].content).toBe("マイクが接続されません");
    expect(history[0].ticketId).toBe("ticket-123");
    expect(history[0].hasScreenshot).toBe(true);
  });

  it("prepends newer items to the top", () => {
    addFeedbackHistoryItem({
      category: "question",
      categoryLabel: "使い方・質問",
      email: "test@example.com",
      content: "最初の質問",
      hasScreenshot: false,
    });
    addFeedbackHistoryItem({
      category: "bug",
      categoryLabel: "不具合・エラー",
      email: "test@example.com",
      content: "2番目の報告",
      hasScreenshot: false,
    });

    const history = getFeedbackHistory();
    expect(history).toHaveLength(2);
    expect(history[0].content).toBe("2番目の報告");
    expect(history[1].content).toBe("最初の質問");
  });

  it("deletes a specific item by id", () => {
    const items = addFeedbackHistoryItem({
      category: "bug",
      categoryLabel: "不具合・エラー",
      email: "test@example.com",
      content: "削除対象",
      hasScreenshot: false,
    });
    const idToDelete = items[0].id;

    addFeedbackHistoryItem({
      category: "feature_request",
      categoryLabel: "改善要望",
      email: "test@example.com",
      content: "残す対象",
      hasScreenshot: false,
    });

    expect(getFeedbackHistory()).toHaveLength(2);

    deleteFeedbackHistoryItem(idToDelete);

    const history = getFeedbackHistory();
    expect(history).toHaveLength(1);
    expect(history[0].content).toBe("残す対象");
  });

  it("clears all feedback history", () => {
    addFeedbackHistoryItem({
      category: "other",
      categoryLabel: "その他",
      email: "test@example.com",
      content: "アイテム1",
      hasScreenshot: false,
    });
    addFeedbackHistoryItem({
      category: "other",
      categoryLabel: "その他",
      email: "test@example.com",
      content: "アイテム2",
      hasScreenshot: false,
    });

    expect(getFeedbackHistory()).toHaveLength(2);

    clearFeedbackHistory();

    expect(getFeedbackHistory()).toEqual([]);
  });
});
