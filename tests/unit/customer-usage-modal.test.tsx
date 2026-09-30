import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CustomerUsageModal } from "@/components/features/admin/CustomerUsageModal";
import { CustomerSummary } from "@/app/api/admin/customers/route";

describe("CustomerUsageModal Component", () => {
  const mockCustomer: CustomerSummary = {
    id: "user-test-123",
    email: "customer@example.com",
    plan: "pro",
    created_at: "2026-09-01T00:00:00.000Z",
    tickets_used: 10,
    pro_trials_used: 2,
    practice_count: 25,
    last_practiced_at: "2026-09-30T10:00:00.000Z",
    today_practice_count: 3,
    active_days: 8,
    daily_average_practice: 3.1,
    projected_monthly_practices: 93,
    projected_monthly_cost: 30,
    breakeven_daily_limit: 147,
    cost_risk_status: "safe",
    daily_history: [
      { date: "2026-09-25", count: 2 },
      { date: "2026-09-26", count: 4 },
      { date: "2026-09-27", count: 0 },
      { date: "2026-09-28", count: 5 },
      { date: "2026-09-29", count: 3 },
      { date: "2026-09-30", count: 3 },
    ],
  };

  it("does not render when isOpen is false", () => {
    const { container } = render(
      <CustomerUsageModal
        isOpen={false}
        onClose={vi.fn()}
        customer={mockCustomer}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("does not render when customer is null", () => {
    const { container } = render(
      <CustomerUsageModal
        isOpen={true}
        onClose={vi.fn()}
        customer={null}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders modal header, customer info, and line chart when open", () => {
    render(
      <CustomerUsageModal
        isOpen={true}
        onClose={vi.fn()}
        customer={mockCustomer}
      />
    );

    expect(screen.getByText("日別利用回数の推移")).toBeDefined();
    expect(screen.getByText("customer@example.com")).toBeDefined();
    expect(screen.getByText("Proプラン")).toBeDefined();
    expect(screen.getByText("過去14日間")).toBeDefined();
    expect(screen.getByText("発話利用回数の推移")).toBeDefined();
  });

  it("calls onClose when close button is clicked", () => {
    const handleClose = vi.fn();
    render(
      <CustomerUsageModal
        isOpen={true}
        onClose={handleClose}
        customer={mockCustomer}
      />
    );

    const closeBtn = screen.getByLabelText("閉じる");
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("switches period when period buttons are clicked", () => {
    render(
      <CustomerUsageModal
        isOpen={true}
        onClose={vi.fn()}
        customer={mockCustomer}
      />
    );

    const sevenDayBtn = screen.getByText("過去7日間");
    fireEvent.click(sevenDayBtn);
    expect(sevenDayBtn.className).toContain("text-primary");

    const thirtyDayBtn = screen.getByText("過去30日間");
    fireEvent.click(thirtyDayBtn);
    expect(thirtyDayBtn.className).toContain("text-primary");
  });

  it("renders empty message when customer has no practice history", () => {
    const emptyCustomer: CustomerSummary = {
      ...mockCustomer,
      practice_count: 0,
      today_practice_count: 0,
      daily_history: [],
      last_practiced_at: null,
    };

    render(
      <CustomerUsageModal
        isOpen={true}
        onClose={vi.fn()}
        customer={emptyCustomer}
      />
    );

    expect(screen.getByText("この期間内の練習記録はまだありません。")).toBeDefined();
  });
});
