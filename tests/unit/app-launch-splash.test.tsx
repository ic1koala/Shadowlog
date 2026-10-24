import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { AppLaunchSplash } from "@/components/features/onboarding/AppLaunchSplash";

describe("AppLaunchSplash (Candidate #2 Particle Convergence on App Launch)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders centered compact splash overlay with Candidate #2 particles and logo", () => {
    render(<AppLaunchSplash />);

    const dialog = screen.getByRole("dialog", { name: "アプリ起動ロゴアニメーション" });
    expect(dialog).toBeTruthy();

    // Verify official brand text is displayed
    expect(screen.getByText("Shadow")).toBeTruthy();
    expect(screen.getByText("Log")).toBeTruthy();

    // Verify skip hint is present
    expect(screen.getByText("タップしてスキップ")).toBeTruthy();
  });

  it("dismisses immediately on click / tap", () => {
    const onFinished = vi.fn();
    render(<AppLaunchSplash onFinished={onFinished} />);

    const dialog = screen.getByRole("dialog");
    fireEvent.click(dialog);

    // Fast-forward close animation
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(onFinished).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("automatically dissolves out after 4.5 seconds (3.5s display + 1s dissolve) and calls onFinished", () => {
    const onFinished = vi.fn();
    render(<AppLaunchSplash onFinished={onFinished} />);

    expect(screen.getByRole("dialog")).toBeTruthy();

    // Fast-forward 3400ms (still visible before dissolve)
    act(() => {
      vi.advanceTimersByTime(3400);
    });
    expect(onFinished).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeTruthy();

    // Fast-forward duration to 4600ms (3500ms + 1000ms dissolve completed)
    act(() => {
      vi.advanceTimersByTime(1200);
    });

    expect(onFinished).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
