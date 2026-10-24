import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { StreakBadge } from "@/components/features/dashboard/StreakBadge";

describe("StreakBadge (Vertical Portrait & Fullscreen Sphere Mode)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders compact badge with streak days and word count", () => {
    render(
      <StreakBadge
        currentStreak={7}
        bestStreak={14}
        totalWords={2500}
        variant="compact"
      />
    );

    expect(screen.getByText("7")).toBeTruthy();
    expect(screen.getByText("日連続学習中！")).toBeTruthy();
    expect(screen.getByText("14")).toBeTruthy();
    expect(screen.getByRole("button", { name: "スフィア全画面表示" })).toBeTruthy();
  });

  it("expands to show vertical portrait sphere card with streak days and word count only", () => {
    render(
      <StreakBadge
        currentStreak={5}
        bestStreak={10}
        totalWords={1850}
        variant="compact"
      />
    );

    // Click to expand
    const toggleCard = screen.getByTitle("タップで詳細を展開");
    fireEvent.click(toggleCard);

    // Verify vertical card contents
    expect(screen.getByText("日連続")).toBeTruthy();
    expect(screen.getByText("1,850")).toBeTruthy();
    expect(screen.getByText("words")).toBeTruthy();
    expect(screen.getByText("全画面で表示する")).toBeTruthy();

    // Verify removed clutter is not present
    expect(screen.queryByText("Admin Test")).toBeNull();
    expect(screen.queryByText("継続日数カラー指標 (Streak Palette)")).toBeNull();
  });

  it("opens fullscreen dialog when clicking full-screen button and closes with X", () => {
    render(
      <StreakBadge
        currentStreak={12}
        bestStreak={15}
        totalWords={5200}
        variant="compact"
      />
    );

    // Click fullscreen button
    const fullscreenBtn = screen.getByRole("button", { name: "スフィア全画面表示" });
    fireEvent.click(fullscreenBtn);

    // Dialog should be open
    const dialog = screen.getByRole("dialog", { name: "ストリークスフィア全画面表示" });
    expect(dialog).toBeTruthy();
    expect(screen.getByText("発話ワード数")).toBeTruthy();
    expect(screen.getByText("5,200")).toBeTruthy();

    // Click close button
    const closeBtn = screen.getByRole("button", { name: "全画面表示を閉じる" });
    fireEvent.click(closeBtn);

    expect(screen.queryByRole("dialog", { name: "ストリークスフィア全画面表示" })).toBeNull();
  });

  it("closes fullscreen dialog when pressing Escape key", () => {
    render(
      <StreakBadge
        currentStreak={20}
        bestStreak={20}
        totalWords={12000}
        variant="compact"
      />
    );

    const fullscreenBtn = screen.getByRole("button", { name: "スフィア全画面表示" });
    fireEvent.click(fullscreenBtn);

    expect(screen.getByRole("dialog", { name: "ストリークスフィア全画面表示" })).toBeTruthy();

    // Fire Escape keydown
    fireEvent.keyDown(window, { key: "Escape" });

    expect(screen.queryByRole("dialog", { name: "ストリークスフィア全画面表示" })).toBeNull();
  });
});
