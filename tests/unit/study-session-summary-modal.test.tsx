import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { StudySessionSummaryModal } from "@/components/features/practice/StudySessionSummaryModal";
import { DiffResult } from "@/types";

describe("StudySessionSummaryModal Component", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("does not render when isOpen is false", () => {
    const { container } = render(
      <StudySessionSummaryModal
        isOpen={false}
        onClose={vi.fn()}
        elapsedSeconds={180}
        streakDays={3}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders elapsed time, streak count, and encouragement when open", () => {
    render(
      <StudySessionSummaryModal
        isOpen={true}
        onClose={vi.fn()}
        elapsedSeconds={504} // 8分24秒
        streakDays={7}
      />
    );

    expect(screen.getByText("🎉 今日のシャドーイング完了！")).toBeDefined();
    expect(screen.getByText("8分24秒")).toBeDefined();
    expect(screen.getByText("7日連続達成！")).toBeDefined();
    expect(screen.getByText(/AIコーチからの労いの一言/)).toBeDefined();
  });

  it("safely handles elapsed time under 60 seconds (defaults to at least 1分)", () => {
    render(
      <StudySessionSummaryModal
        isOpen={true}
        onClose={vi.fn()}
        elapsedSeconds={20}
        streakDays={1}
      />
    );

    expect(screen.getByText("1分")).toBeDefined();
    expect(screen.getByText("1日連続達成！")).toBeDefined();
  });

  it("displays specific problem words from last diff result", () => {
    const diff: DiffResult = {
      accuracyScore: 80,
      originalText: "We need to optimize our cloud database",
      spokenText: "We need optimize cloud database",
      originalWordCount: 7,
      spokenWordCount: 5,
      matchedWordCount: 5,
      tokens: [
        { word: "We", status: "match" },
        { word: "need", status: "match" },
        { word: "to", status: "missing" },
        { word: "optimize", status: "match" },
        { word: "our", status: "missing" },
        { word: "cloud", status: "match" },
        { word: "database", status: "match" },
      ],
    };

    render(
      <StudySessionSummaryModal
        isOpen={true}
        onClose={vi.fn()}
        elapsedSeconds={300}
        streakDays={5}
        lastDiffResult={diff}
      />
    );

    expect(screen.getByText("to")).toBeDefined();
    expect(screen.getByText("our")).toBeDefined();
  });

  it("calls onClose when close button is clicked", () => {
    const onClose = vi.fn();
    render(
      <StudySessionSummaryModal
        isOpen={true}
        onClose={onClose}
        elapsedSeconds={120}
        streakDays={2}
      />
    );

    const closeBtn = screen.getByLabelText("モーダルを閉じる");
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when 'まだ練習を続ける' button is clicked", () => {
    const onClose = vi.fn();
    render(
      <StudySessionSummaryModal
        isOpen={true}
        onClose={onClose}
        elapsedSeconds={120}
        streakDays={2}
      />
    );

    const continueBtn = screen.getByText("まだ練習を続ける");
    fireEvent.click(continueBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("triggers X (Twitter) share on click", () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);

    render(
      <StudySessionSummaryModal
        isOpen={true}
        onClose={vi.fn()}
        elapsedSeconds={120}
        streakDays={3}
      />
    );

    const xButton = screen.getByText("ポスト");
    fireEvent.click(xButton);

    expect(openSpy).toHaveBeenCalledWith(
      expect.stringContaining("https://twitter.com/intent/tweet?text="),
      "_blank",
      "noopener,noreferrer"
    );
  });

  it("triggers Threads share on click", () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);

    render(
      <StudySessionSummaryModal
        isOpen={true}
        onClose={vi.fn()}
        elapsedSeconds={120}
        streakDays={3}
      />
    );

    const threadsButton = screen.getByText("Threads");
    fireEvent.click(threadsButton);

    expect(openSpy).toHaveBeenCalledWith(
      expect.stringContaining("https://threads.net/intent/post?text="),
      "_blank",
      "noopener,noreferrer"
    );
  });
});
