import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  OnboardingTourModal,
  TOUR_STEPS,
} from "@/components/features/practice/OnboardingTourModal";
import { isAdminEmail } from "@/lib/auth/admin-checker";

describe("OnboardingTourModal and TOUR_STEPS (Admin Tour Test)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // Mock scrollIntoView and getBoundingClientRect for JSDOM
    Element.prototype.scrollIntoView = vi.fn();
    Element.prototype.getBoundingClientRect = vi.fn(() => ({
      width: 300,
      height: 80,
      top: 100,
      left: 50,
      bottom: 180,
      right: 350,
      x: 50,
      y: 100,
      toJSON: () => {},
    }));
  });

  it("has exactly 4 well-structured steps targeting correct practice UI elements", () => {
    expect(TOUR_STEPS).toHaveLength(4);

    expect(TOUR_STEPS[0].stepNumber).toBe(1);
    expect(TOUR_STEPS[0].targetId).toBe("tour-audio-player");
    expect(TOUR_STEPS[0].badge).toBe("STEP 1 / 4");

    expect(TOUR_STEPS[1].stepNumber).toBe(2);
    expect(TOUR_STEPS[1].targetId).toBe("tour-sentence-text");
    expect(TOUR_STEPS[1].badge).toBe("STEP 2 / 4");

    expect(TOUR_STEPS[2].stepNumber).toBe(3);
    expect(TOUR_STEPS[2].targetId).toBe("tour-recording-bar");
    expect(TOUR_STEPS[2].badge).toBe("STEP 3 / 4");

    expect(TOUR_STEPS[3].stepNumber).toBe(4);
    expect(TOUR_STEPS[3].targetId).toBe("tour-finish-section");
    expect(TOUR_STEPS[3].badge).toBe("STEP 4 / 4");

    // All steps have titles and descriptions
    TOUR_STEPS.forEach((step) => {
      expect(step.title.length).toBeGreaterThan(0);
      expect(step.description.length).toBeGreaterThan(0);
    });
  });

  it("does not render into DOM when isOpen is false", () => {
    const { container } = render(
      <OnboardingTourModal
        isOpen={false}
        onClose={vi.fn()}
        onComplete={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders STEP 1 content when opened", () => {
    render(
      <OnboardingTourModal
        isOpen={true}
        onClose={vi.fn()}
        onComplete={vi.fn()}
      />
    );

    expect(screen.getByText("STEP 1 / 4")).toBeDefined();
    expect(screen.getByText("模範音声 & 速度調整")).toBeDefined();
    expect(screen.getByText(/ネイティブ音声を聴いて/)).toBeDefined();
    expect(screen.getByText("スキップ")).toBeDefined();
    expect(screen.getByText("次へ")).toBeDefined();
  });

  it("allows navigating forward and backward between tour steps", () => {
    render(
      <OnboardingTourModal
        isOpen={true}
        onClose={vi.fn()}
        onComplete={vi.fn()}
      />
    );

    // Initial state: Step 1
    expect(screen.getByText("STEP 1 / 4")).toBeDefined();

    // Click Next -> Step 2
    fireEvent.click(screen.getByText("次へ"));
    expect(screen.getByText("STEP 2 / 4")).toBeDefined();
    expect(screen.getByText("意味のかたまり（/）& 3D単語フリップ")).toBeDefined();

    // Click Previous -> Back to Step 1
    fireEvent.click(screen.getByText("戻る"));
    expect(screen.getByText("STEP 1 / 4")).toBeDefined();
  });

  it("completes tour at STEP 4 and invokes onComplete and onClose", () => {
    const onComplete = vi.fn();
    const onClose = vi.fn();

    render(
      <OnboardingTourModal
        isOpen={true}
        onClose={onClose}
        onComplete={onComplete}
      />
    );

    // Advance to Step 4
    fireEvent.click(screen.getByText("次へ")); // to Step 2
    fireEvent.click(screen.getByText("次へ")); // to Step 3
    fireEvent.click(screen.getByText("次へ")); // to Step 4

    expect(screen.getByText("STEP 4 / 4")).toBeDefined();
    expect(screen.getByText("今日の学習を終了 & 成果シェア")).toBeDefined();

    // Last step shows complete button
    const completeBtn = screen.getByText("完了して練習を始める ✨");
    expect(completeBtn).toBeDefined();

    fireEvent.click(completeBtn);
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("invokes onComplete and onClose when clicking skip button", () => {
    const onComplete = vi.fn();
    const onClose = vi.fn();

    render(
      <OnboardingTourModal
        isOpen={true}
        onClose={onClose}
        onComplete={onComplete}
      />
    );

    const skipBtn = screen.getByText("スキップ");
    fireEvent.click(skipBtn);

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("admin guard correctly isolates admin email from regular users", () => {
    // Admin checks for rollout safety
    expect(isAdminEmail("shadowlog.app@gmail.com")).toBe(true);
    expect(isAdminEmail("SHADOWLOG.APP@GMAIL.COM")).toBe(true);
    expect(isAdminEmail("user@example.com")).toBe(false);
    expect(isAdminEmail(null)).toBe(false);
    expect(isAdminEmail(undefined)).toBe(false);
  });
});
