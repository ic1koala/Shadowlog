import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PersonaPromptBanner } from "@/components/features/dashboard/PersonaPromptBanner";
import * as personaStore from "@/lib/storage/persona-store";
import * as ticketStore from "@/lib/storage/ticket-store";

describe("PersonaPromptBanner", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it("does not render for free/guest users", () => {
    vi.spyOn(ticketStore, "getTicketStatus").mockReturnValue({
      plan: "free",
      usedCount: 0,
      maxLimit: 20,
      remainingCount: 20,
      canPracticeShort: true,
      canPracticePro: false,
    });
    vi.spyOn(personaStore, "isPersonaEligible").mockReturnValue(false);

    const { container } = render(<PersonaPromptBanner />);
    expect(container.firstChild).toBeNull();
  });

  it("renders for VIP/Pro users who have not configured persona yet", () => {
    vi.spyOn(ticketStore, "getTicketStatus").mockReturnValue({
      plan: "pro",
      usedCount: 5,
      maxLimit: 9999,
      remainingCount: 9999,
      canPracticeShort: true,
      canPracticePro: true,
    });
    vi.spyOn(personaStore, "isPersonaEligible").mockReturnValue(true);
    vi.spyOn(personaStore, "getPersonaProfile").mockReturnValue(null);

    render(<PersonaPromptBanner />);
    expect(screen.getByText(/VIP特典：あなたの職種・業界に特化した英語をAI生成！/)).toBeDefined();
    expect(screen.getByText(/ペルソナを設定する/)).toBeDefined();
  });

  it("does not render if VIP user already configured persona", () => {
    vi.spyOn(ticketStore, "getTicketStatus").mockReturnValue({
      plan: "pro",
      usedCount: 5,
      maxLimit: 9999,
      remainingCount: 9999,
      canPracticeShort: true,
      canPracticePro: true,
    });
    vi.spyOn(personaStore, "isPersonaEligible").mockReturnValue(true);
    vi.spyOn(personaStore, "getPersonaProfile").mockReturnValue({
      enabled: true,
      jobRole: "海外営業",
      industryField: "半導体",
      targetScenario: "価格交渉",
    });

    const { container } = render(<PersonaPromptBanner />);
    expect(container.firstChild).toBeNull();
  });

  it("hides when dismiss button is clicked", () => {
    vi.spyOn(ticketStore, "getTicketStatus").mockReturnValue({
      plan: "pro",
      usedCount: 0,
      maxLimit: 9999,
      remainingCount: 9999,
      canPracticeShort: true,
      canPracticePro: true,
    });
    vi.spyOn(personaStore, "isPersonaEligible").mockReturnValue(true);
    vi.spyOn(personaStore, "getPersonaProfile").mockReturnValue(null);

    render(<PersonaPromptBanner />);
    const closeBtn = screen.getByTitle("閉じる");
    fireEvent.click(closeBtn);

    expect(sessionStorage.getItem("shadowlog_persona_banner_dismissed")).toBe("true");
    expect(screen.queryByText(/VIP特典：あなたの職種・業界に特化した英語をAI生成！/)).toBeNull();
  });
});
