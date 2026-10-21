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

  it("automatically fades out and calls onFinished after completion", () => {
    const onFinished = vi.fn();
    render(<AppLaunchSplash onFinished={onFinished} />);

    expect(screen.getByRole("dialog")).toBeTruthy();

    // Fast-forward duration (2100ms) + fade transition (400ms)
    act(() => {
      vi.advanceTimersByTime(2600);
    });

    expect(onFinished).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
